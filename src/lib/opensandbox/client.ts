import { Sandbox, SandboxManager } from "@alibaba-group/opensandbox";
import type { SandboxConnectOptions, SandboxCreateOptions } from "@alibaba-group/opensandbox";
import { createConnectionConfig } from "./config";

export function createSandboxManager() {
  return SandboxManager.create({ connectionConfig: createConnectionConfig() });
}

export function createSandbox(options: Omit<SandboxCreateOptions, "connectionConfig">) {
  return Sandbox.create({
    connectionConfig: createConnectionConfig(),
    ...options,
  });
}

export function connectSandbox(options: Omit<SandboxConnectOptions, "connectionConfig">) {
  return Sandbox.connect({
    connectionConfig: createConnectionConfig(),
    ...options,
  });
}

export async function withManager<T>(fn: (manager: SandboxManager) => Promise<T>) {
  const manager = createSandboxManager();
  try {
    return await fn(manager);
  } finally {
    await manager.close();
  }
}

export async function withSandbox<T>(
  sandboxId: string,
  fn: (sandbox: Sandbox) => Promise<T>,
  opts: { skipHealthCheck?: boolean } = { skipHealthCheck: true },
) {
  const sandbox = await connectSandbox({
    sandboxId,
    skipHealthCheck: opts.skipHealthCheck,
  });
  try {
    return await fn(sandbox);
  } finally {
    await sandbox.close();
  }
}
