import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Ec2InstanceConnectEndpoint } from "@cdktf/provider-aws/lib/ec2-instance-connect-endpoint";
import { NetworkInterface } from "@cdktf/provider-aws/lib/network-interface";
import { awsconfig } from "../config";

class NetworkStack extends Construct {
  publicENI;
  privateENI;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
    //VPC定義
    const entireNetwork = new Vpc(this, "entireNetwork", {
      cidrBlock: "172.16.0.0/24",
      tags: { Name: "test-vpc" },
    });
    //パブリックサブネット
    const publicSubnet = new Subnet(this, "publicSubnet", {
      vpcId: entireNetwork.id,
      availabilityZone: awsconfig.availabilityZone,
      cidrBlock: "172.16.0.0/28",
      mapPublicIpOnLaunch: true,
      tags: { Name: "test-public-subnet" },
    });
    //プライベートサブネット
    const privateSubnet = new Subnet(this, "privateSubnet", {
      vpcId: entireNetwork.id,
      availabilityZone: awsconfig.availabilityZone,
      cidrBlock: "172.16.0.16/28",
      tags: { Name: "test-private-subnet" },
    });
    //インターネットGW
    const intGW = new InternetGateway(this, "intGW", {
      vpcId: entireNetwork.id,
      tags: { Name: "test-gateway" },
    });
    //Elastic IP
    const elasticIP = new Eip(this, "elasticIP", {
      domain: "vpc",
    });
    //NATGW
    const natGW = new NatGateway(this, "natGW", {
      subnetId: publicSubnet.id,
      allocationId: elasticIP.id,
      dependsOn: [intGW],
      tags: { Name: "test-nat" },
    });
    //プライベートサブネットのルーティングテーブル．デフォルトルートをNATGWに．VPC間は通信可能．
    const privateRTTable = new RouteTable(this, "privateRTTable", {
      vpcId: entireNetwork.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          natGatewayId: natGW.id,
        },
      ],
      tags: { Name: "test-privateRTTable" },
    });
    //パブリックサブネットのルーティングテーブル．デフォルトルートをインターネットGWに
    const publicRTTable = new RouteTable(this, "publicRTTable", {
      vpcId: entireNetwork.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: intGW.id,
        },
      ],
      tags: { Name: "test-publicRTTable" },
    });
    //パブリックサブネットとルーティングテーブルの紐付け
    new RouteTableAssociation(this, "publicRTTableAssociaiton", {
      subnetId: publicSubnet.id,
      routeTableId: publicRTTable.id,
    });
    //プライベートサブネットとルーティングテーブルの紐付け
    new RouteTableAssociation(this, "privateRTTTableAssociation", {
      subnetId: privateSubnet.id,
      routeTableId: privateRTTable.id,
    });
    //EICのSecurityGroup
    const eicSecurityGroup = new SecurityGroup(this, "eicSecurityGroup", {
      name: "eicSecurityGroup",
      vpcId: entireNetwork.id,
      egress: [
        {
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["172.16.0.0/24"],
          protocol: "tcp",
        },
      ],
    });
    //publicSubnet側のSecurityGroup
    const publicSecurityGroup = new SecurityGroup(this, "publicSecurityGroup", {
      name: "publicSecurityGroup",
      vpcId: entireNetwork.id,
      ingress: [
        {
          description: "snmpPolling",
          fromPort: 161,
          toPort: 161,
          cidrBlocks: ["172.16.0.16/28"],
          protocol: "udp",
        },
        {
          description: "SSH_from_EIC",
          fromPort: 22,
          toPort: 22,
          securityGroups: [eicSecurityGroup.id],
          protocol: "tcp",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          protocol: "-1",
        },
      ],
    });
    //privateSubnet側のSecurityGroup
    const privateSecurityGroup = new SecurityGroup(
      this,
      "privateSecurityGroup",
      {
        name: "privateSecurityGroup",
        vpcId: entireNetwork.id,
        ingress: [
          {
            description: "SSH_from_EIC",
            fromPort: 22,
            toPort: 22,
            securityGroups: [eicSecurityGroup.id],
            protocol: "tcp",
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            protocol: "-1",
          },
        ],
      }
    );
    //EIC
    new Ec2InstanceConnectEndpoint(this, "privateEic", {
      subnetId: privateSubnet.id,
      securityGroupIds: [eicSecurityGroup.id],
      preserveClientIp: false,
    });

    //ENI
    this.publicENI = new NetworkInterface(this, "publicENI", {
      subnetId: publicSubnet.id,
      privateIps: ["172.16.0.5"],
      securityGroups: [publicSecurityGroup.id],
    });
    this.privateENI = new NetworkInterface(this, "privateENI", {
      subnetId: privateSubnet.id,
      privateIps: ["172.16.0.20"],
      securityGroups: [privateSecurityGroup.id],
    });
  }
}
export default NetworkStack;
