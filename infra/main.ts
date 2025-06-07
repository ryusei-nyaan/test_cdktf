import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import NetworkStack from "./network/network";
import ServerStack from "./server/server";
import { awsconfig } from "./config";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
    new AwsProvider(this, awsconfig.provider, {
      region: awsconfig.region,
      accessKey: awsconfig.accessKey,
      secretKey: awsconfig.secretKey,
    });
    const networkStack = new NetworkStack(this, "network");
    new ServerStack(
      this,
      "server",
      networkStack.publicENI.id,
      networkStack.privateENI.id
    );
  }
}

const app = new App();
new MyStack(app, "infra");
app.synth();
