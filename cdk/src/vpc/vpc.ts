import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface VpcProps {
  vpcName: string;
  cidr: string;
  maxAzs: number;
  natGateways: number;
}

export class Vpc extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);
    this.vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: props.vpcName,
      cidr: props.cidr,
      maxAzs: props.maxAzs,
      natGateways: props.natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
