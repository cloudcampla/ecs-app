#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Vpc } from "../src/vpc/vpc";
import { Cluster } from "../src/ecs/Cluster";
import { Service } from "../src/ecs/Service";
const app = new cdk.App();

const vpc = new Vpc(app, "Network-1", {
  vpcName: "network-1",
  cidr: "10.20.0.0/16",
  maxAzs: 3,
  natGateways: 1,
});

const ecsCluster = new Cluster(app, "EcsCluster", {
  clusterName: "applications",
  vpc: vpc.vpc,
  defaultCloudMapNamespace: {
    name: "app.local",
    useForServiceConnect: true,
    type: cdk.aws_servicediscovery.NamespaceType.HTTP,
  },
});

const appEcs = new Service(app, "EcsService", {
  serviceName: "app",
  image: "alejo9424/aws-verified-access-app:latest",
  cluster: ecsCluster.cluster,
  requireLoadBalancer: true,
  serviceConnectConfiguration: {
    namespace: ecsCluster.cluster.defaultCloudMapNamespace?.namespaceName,
    services: [
      {
        portMappingName: "server",
      },
    ],
  },
  portMappings: [
    {
      containerPort: 8080,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP,
      name: "app",
      appProtocol: cdk.aws_ecs.AppProtocol.http2,
    },
  ],
});

app.synth();
