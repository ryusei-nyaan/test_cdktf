import { Construct } from "constructs";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { awsconfig } from "../config";
export class ServerStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    publicNic: string,
    privateNic: string
  ) {
    super(scope, id);

    // define resources here
    new Instance(this, "publicInstance", {
      //amazonlinux
      ami: "ami-0c2da9ee6644f16e5",
      availabilityZone: awsconfig.availabilityZone,
      instanceType: "t2.micro",
      networkInterface: [
        {
          deviceIndex: 0,
          networkInterfaceId: publicNic,
        },
      ],
      userData: `#!/bin/bash
                sudo yum update
                sudo yum install -y net-snmp
                sudo yum install -y net-snmp-utils
                sudo yum install -y firewalld 
                sudo systemctl start firewalld.service
                sudo firewall-cmd --permanent --add-port=161/udp
                sudo systemctl restart firewalld.service
                sudo bash -c 'echo view systemview included .1.3.6.1.2.1.25 >> /etc/snmp/snmpd.conf'          
                sudo bash -c 'echo com2sec notConfigUser default public >> /etc/snmp/snmpd.conf'              
                sudo bash -c 'echo group  notConfigGroup v2c  notConfigUser >> /etc/snmp/snmpd.conf'              
                sudo systemctl start snmpd`,
      tags: { Name: "test-instance-agent" },
    });
    new Instance(this, "privateInstance", {
      //amazonlinux
      ami: "ami-0c2da9ee6644f16e5",
      availabilityZone: awsconfig.availabilityZone,
      instanceType: "t2.micro",
      networkInterface: [
        {
          deviceIndex: 0,
          networkInterfaceId: privateNic,
        },
      ],
      userData: `#!/bin/bash
                sudo yum update
                sudo yum install -y net-snmp
                sudo yum install -y net-snmp-utils
                sudo yum install -y firewalld
                sudo systemctl start firewalld.service
                sudo systemctl start snmpd
                sudo yum install -y pip
                sudo pip install pysnmp`,
      tags: { Name: "test-instance-manager" },
    });
  }
}

export default ServerStack;
