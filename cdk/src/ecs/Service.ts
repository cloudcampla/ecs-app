import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";

interface ServiceProps {
  serviceName: string;
  cluster: ecs.Cluster;
  serviceConnectConfiguration?: cdk.aws_ecs.ServiceConnectProps;
  image: string;
  requireLoadBalancer?: boolean;
  portMappings?: ecs.PortMapping[];
}

export class Service extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly serviceAlb: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly logGroup: logs.LogGroup;
  constructor(scope: Construct, id: string, props: ServiceProps) {
    super(scope, id);
    this.logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/ecs/${props.serviceName}`,
      retention: logs.RetentionDays.FIVE_DAYS,
    });

    // Define the ECS task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        family: props.serviceName,
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
        },
      );
      new cdk.CfnOutput(this, "LoadBalancerDNS", {
        value: this.serviceAlb.loadBalancer.loadBalancerDnsName,
      });
    }
  }
}
