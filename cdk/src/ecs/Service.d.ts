import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";
interface ServiceProps {
    serviceName: string;
    cluster: ecs.Cluster;
    taskDefinition: ecs.FargateTaskDefinition;
    serviceConnectConfiguration?: cdk.aws_ecs.ServiceConnectProps;
    requireLoadBalancer?: boolean;
}
export declare class Service extends cdk.Stack {
    readonly service: ecs.FargateService;
    readonly serviceAlb: ecsPatterns.ApplicationLoadBalancedFargateService;
    constructor(scope: Construct, id: string, props: ServiceProps);
}
export {};
