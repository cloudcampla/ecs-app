import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import {
  Role,
  PolicyDocument,
  ServicePrincipal,
  Policy,
} from "aws-cdk-lib/aws-iam";

interface ServiceProps {
  serviceName: string;
  cluster: ecs.Cluster;
  serviceConnectConfiguration?: cdk.aws_ecs.ServiceConnectProps;
  image: string;
  requireLoadBalancer?: boolean;
  portMappings?: ecs.PortMapping[];
  policy?: any;
}

export class Service extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly serviceAlb: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly logGroup: logs.LogGroup;
  private taskRole: Role;
  constructor(scope: Construct, id: string, props: ServiceProps) {
    super(scope, id);
    this.logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/ecs/${props.serviceName}`,
      retention: logs.RetentionDays.FIVE_DAYS,
    });

    if (props.policy) {
      const policyDocument = PolicyDocument.fromJson(props.policy);
      const policy = new Policy(this, "Policy", {
        policyName: `${props.serviceName}-execution-role-policy`,
        document: policyDocument,
      });
      this.taskRole = new Role(this, "ExecutionRole", {
        roleName: `${props.serviceName}-execution-role`,
        assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
      });
      this.taskRole.attachInlinePolicy(policy);
    }

    // Define the ECS task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        family: props.serviceName,
        taskRole: this.taskRole,
        executionRole: this.taskRole,
      },
    );

    this.taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromRegistry(props.image),
      containerName: `${props.serviceName}`,
      portMappings: props.portMappings,
      logging: new ecs.AwsLogDriver({
        logGroup: this.logGroup,
        streamPrefix: props.serviceName,
      }),
    });

    // Define the ECS service with Service Connect enabled
    if (!props.requireLoadBalancer || props.requireLoadBalancer === undefined) {
      this.service = new ecs.FargateService(this, "Service", {
        serviceName: props.serviceName,
        cluster: props.cluster,
        taskDefinition: this.taskDefinition,
        serviceConnectConfiguration: props.serviceConnectConfiguration,
        enableExecuteCommand: true,
      });
    } else {
      this.serviceAlb = new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "ServiceAlb",
        {
          serviceName: props.serviceName,
          cluster: props.cluster,
          taskDefinition: this.taskDefinition,
          enableExecuteCommand: true,
        },
      );

      const scaling = this.serviceAlb.service.autoScaleTaskCount({
        minCapacity: 1,
        maxCapacity: 10,
      });

      scaling.scaleOnCpuUtilization("CPUPolicyScaling", {
        targetUtilizationPercent: 70,
      });

      scaling.scaleOnMemoryUtilization("MemoryPolicyScaling", {
        targetUtilizationPercent: 70,
      });

      new cdk.CfnOutput(this, "LoadBalancerDNS", {
        value: this.serviceAlb.loadBalancer.loadBalancerDnsName,
      });
    }
  }
}
