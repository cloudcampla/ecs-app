import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
interface VpcProps {
    vpcName: string;
    cidr: string;
    maxAzs: number;
    natGateways: number;
}
export declare class Vpc extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    constructor(scope: Construct, id: string, props: VpcProps);
}
export {};
