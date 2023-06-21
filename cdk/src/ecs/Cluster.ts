import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

interface EcsProps {
  vpc: ec2.IVpc;
  clusterName: string;
  defaultCloudMapNamespace?: ecs.CloudMapNamespaceOptions;
}

export class Cluster extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  constructor(scope: Construct, id: string, props: EcsProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
      clusterName: props.clusterName,
      defaultCloudMapNamespace: props.defaultCloudMapNamespace,
    });
  }
}
