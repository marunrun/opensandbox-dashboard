import { ConnectionConfig } from "@alibaba-group/opensandbox";

export type OpenSandboxRuntimeConfig = {
  domain: string;
  apiKey?: string;
  protocol: "http" | "https";
  requestTimeoutSeconds: number;
  useServerProxy: boolean;
};

export function getOpenSandboxRuntimeConfig(): OpenSandboxRuntimeConfig {
  const protocol = process.env.OPENSANDBOX_PROTOCOL === "http" ? "http" : "https";

  return {
    domain: process.env.OPENSANDBOX_DOMAIN ?? "localhost:8080",
    apiKey: process.env.OPENSANDBOX_API_KEY,
    protocol,
    requestTimeoutSeconds: Number(process.env.OPENSANDBOX_REQUEST_TIMEOUT_SECONDS ?? 300),
    useServerProxy: process.env.OPENSANDBOX_USE_SERVER_PROXY !== "false",
  };
}

export function createConnectionConfig() {
  return new ConnectionConfig(getOpenSandboxRuntimeConfig());
}
