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
        portMappingName: "app",
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
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowEcrPermissions",
        Effect: "Allow",
        Action: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
        ],
        Resource: "*",
      },
      {
        Sid: "AllowSsmActions",
        Effect: "Allow",
        Action: [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
        ],
        Resource: "*",
      },
      {
        Sid: "AllowEcsExecuteCommand",
        Effect: "Allow",
        Action: "ecs:ExecuteCommand",
        Resource: "*",
      },
      {
        Sid: "AllowCloudwatchActions",
        Effect: "Allow",
        Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource: "*",
      },
      {
        Sid: "AllowParameterStoreActions",
        Effect: "Allow",
        Action: [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ],
        Resource: "*",
      },
      {
        Sid: "AllowSecretManagerActions",
        Effect: "Allow",
        Action: ["secretsmanager:GetSecretValue"],
        Resource: "*",
      },
    ],
  },
});

app.synth();
