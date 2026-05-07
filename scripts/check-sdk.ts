import { Sandbox, SandboxException, SandboxManager } from "@alibaba-group/opensandbox";
import { createConnectionConfig, getOpenSandboxRuntimeConfig } from "../src/lib/opensandbox/config";

async function main() {
  const config = createConnectionConfig();
  const runtimeConfig = getOpenSandboxRuntimeConfig();
  const manager = SandboxManager.create({ connectionConfig: config });

  console.log("OpenSandbox config", {
    domain: runtimeConfig.domain,
    protocol: runtimeConfig.protocol,
    hasApiKey: Boolean(runtimeConfig.apiKey),
    useServerProxy: runtimeConfig.useServerProxy,
  });

  const list = await manager.listSandboxInfos({ pageSize: 5 });
  console.log(`listSandboxInfos: ${list.items.length} item(s)`);

  const sandbox = await Sandbox.create({
    connectionConfig: config,
    image: "alpine:3.20",
    timeoutSeconds: 600,
    metadata: {
      "app.opensandbox-dashboard/check": "true",
    },
    readyTimeoutSeconds: 60,
  });

  try {
    const info = await sandbox.getInfo();
    console.log("created:", info.id, info.status.state);

    const execution = await sandbox.commands.run("echo opensandbox-dashboard-ok && uname -a", {
      timeoutSeconds: 30,
    });
    console.log("command stdout:", execution.logs.stdout.map((line) => line.text).join("").trim());

    await sandbox.files.writeFiles([{ path: "/tmp/opensandbox-dashboard.txt", data: "ok\n", mode: 644 }]);
    const content = await sandbox.files.readFile("/tmp/opensandbox-dashboard.txt");
    console.log("file read:", content.trim());

    const endpoint = await sandbox.getEndpoint(44772);
    console.log("endpoint:", endpoint.endpoint);

    const metrics = await sandbox.getMetrics();
    console.log("metrics:", metrics);

    await sandbox.renew(900);
    console.log("renewed");
  } finally {
    await sandbox.kill();
    await sandbox.close();
    await manager.close();
    await config.closeTransport();
  }
}

main().catch((error) => {
  if (error instanceof SandboxException) {
    console.error("SandboxException", {
      code: error.error.code,
      message: error.error.message ?? error.message,
      requestId: error.requestId,
    });
  } else {
    console.error(error);
  }
  process.exit(1);
});
