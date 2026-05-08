import nextEnv from "@next/env";
import { Sandbox, SandboxException, SandboxManager } from "@alibaba-group/opensandbox";
import { createConnectionConfig, getOpenSandboxRuntimeConfig } from "../src/lib/opensandbox/config";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const args = new Set(process.argv.slice(2));
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
  for (const item of list.items) {
    console.log("sandbox:", {
      id: item.id,
      image: typeof item.image === "string" ? item.image : item.image.uri,
      state: item.status.state,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      metadata: item.metadata,
    });
  }

  if (args.has("--list-only")) {
    await manager.close();
    await config.closeTransport();
    return;
  }

  if (args.has("--cleanup-dashboard")) {
    for (const item of list.items) {
      if (item.metadata?.["app.opensandbox-dashboard/check"] === "true") {
        console.log("cleanup:", item.id, item.status.state);
        await manager.killSandbox(item.id);
      }
    }
    await manager.close();
    await config.closeTransport();
    return;
  }

  const targetId = process.argv.find((arg) => arg.startsWith("--sandbox-id="))?.slice("--sandbox-id=".length);
  if (targetId) {
    const connected = await Sandbox.connect({
      connectionConfig: config,
      sandboxId: targetId,
      skipHealthCheck: true,
    });
    try {
      await exerciseSandbox(connected);
    } finally {
      await connected.close();
      await manager.close();
      await config.closeTransport();
    }
    return;
  }

  let sandbox: Sandbox | undefined;
  try {
    const image =
      process.argv.find((arg) => arg.startsWith("--image="))?.slice("--image=".length) ??
      "registry.cn-hangzhou.aliyuncs.com/domai/tool-docker:tools-node-python-aliyun-v1";

    sandbox = await Sandbox.create({
      connectionConfig: config,
      image,
      timeoutSeconds: 600,
      metadata: {
        "app.opensandbox-dashboard/check": "true",
      },
      skipHealthCheck: args.has("--skip-create-health-check"),
      readyTimeoutSeconds: 120,
    });

    await exerciseSandbox(sandbox);
  } finally {
    if (sandbox) {
      await sandbox.kill();
      await sandbox.close();
    }
    await manager.close();
    await config.closeTransport();
  }
}

async function exerciseSandbox(sandbox: Sandbox) {
  const info = await sandbox.getInfo();
  console.log("info:", info.id, info.status.state);

  const execution = await sandbox.commands.run("echo opensandbox-dashboard-ok && uname -a", {
    timeoutSeconds: 30,
  });
  console.log("command stdout:", execution.logs.stdout.map((line) => line.text).join("").trim());

  await sandbox.files.writeFiles([{ path: "/tmp/opensandbox-dashboard.txt", data: "ok\n", mode: 644 }]);
  const content = await sandbox.files.readFile("/tmp/opensandbox-dashboard.txt");
  console.log("file read:", content.trim());

  const files = await sandbox.files.search({ path: "/tmp", pattern: "opensandbox-dashboard.txt" });
  console.log("file search:", files.map((file) => file.path).join(", "));

  const endpoint = await sandbox.getEndpoint(44772);
  console.log("endpoint:", endpoint.endpoint);

  const metrics = await sandbox.getMetrics();
  console.log("metrics:", metrics);

  await sandbox.renew(900);
  console.log("renewed");

  try {
    const policy = await sandbox.getEgressPolicy();
    console.log("egress policy:", policy);
  } catch (error) {
    console.log("egress policy check failed:", error instanceof Error ? error.message : error);
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
