import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
interface EcsProps {
    vpc: ec2.IVpc;
    clusterName: string;
}
export declare class Cluster extends cdk.Stack {
    readonly cluster: ecs.Cluster;
    constructor(scope: Construct, id: string, props: EcsProps);
}
export {};
