import { Sandbox, SandboxManager } from "@alibaba-group/opensandbox";
import type { SandboxConnectOptions, SandboxCreateOptions } from "@alibaba-group/opensandbox";
import { createConnectionConfig } from "./config";

export function createSandboxManager(request?: Request) {
  return SandboxManager.create({ connectionConfig: createConnectionConfig(request) });
}

export function createSandbox(options: Omit<SandboxCreateOptions, "connectionConfig">, request?: Request) {
  return Sandbox.create({
    connectionConfig: createConnectionConfig(request),
    ...options,
  });
}

export function connectSandbox(options: Omit<SandboxConnectOptions, "connectionConfig">, request?: Request) {
  return Sandbox.connect({
    connectionConfig: createConnectionConfig(request),
    ...options,
  });
}

export async function withManager<T>(request: Request, fn: (manager: SandboxManager) => Promise<T>) {
  const manager = createSandboxManager(request);
  try {
    return await fn(manager);
  } finally {
    await manager.close();
  }
}

export async function withSandbox<T>(
  request: Request,
  sandboxId: string,
  fn: (sandbox: Sandbox) => Promise<T>,
  opts: { skipHealthCheck?: boolean } = { skipHealthCheck: true },
) {
  const sandbox = await connectSandbox({
    sandboxId,
    skipHealthCheck: opts.skipHealthCheck,
  }, request);
  try {
    return await fn(sandbox);
  } finally {
    await sandbox.close();
  }
}
