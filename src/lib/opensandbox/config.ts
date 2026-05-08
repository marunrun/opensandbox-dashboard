import { ConnectionConfig } from "@alibaba-group/opensandbox";

export type OpenSandboxRuntimeConfig = {
  domain: string;
  apiKey?: string;
  protocol: "http" | "https";
  requestTimeoutSeconds: number;
  useServerProxy: boolean;
};

export function getOpenSandboxRuntimeConfig(request?: Request): OpenSandboxRuntimeConfig {
  const requestConfig: Partial<OpenSandboxRuntimeConfig> = request ? getOpenSandboxRequestConfig(request) : {};
  const protocolValue = requestConfig.protocol ?? process.env.OPENSANDBOX_PROTOCOL;
  const protocol = protocolValue === "http" ? "http" : "https";

  return {
    domain: requestConfig.domain ?? process.env.OPENSANDBOX_DOMAIN ?? "localhost:8080",
    apiKey: requestConfig.apiKey ?? process.env.OPENSANDBOX_API_KEY,
    protocol,
    requestTimeoutSeconds: Number(requestConfig.requestTimeoutSeconds ?? process.env.OPENSANDBOX_REQUEST_TIMEOUT_SECONDS ?? 300),
    useServerProxy: requestConfig.useServerProxy ?? process.env.OPENSANDBOX_USE_SERVER_PROXY !== "false",
  };
}

export function createConnectionConfig(request?: Request) {
  return new ConnectionConfig(getOpenSandboxRuntimeConfig(request));
}

function getOpenSandboxRequestConfig(request: Request): Partial<OpenSandboxRuntimeConfig> {
  const timeoutHeader = request.headers.get("x-opensandbox-request-timeout-seconds");
  const proxyHeader = request.headers.get("x-opensandbox-use-server-proxy");
  const protocolHeader = cleanHeader(request.headers.get("x-opensandbox-protocol"));

  return {
    domain: cleanHeader(request.headers.get("x-opensandbox-domain")),
    apiKey: cleanHeader(request.headers.get("x-opensandbox-api-key")),
    protocol: protocolHeader === "http" || protocolHeader === "https" ? protocolHeader : undefined,
    requestTimeoutSeconds: timeoutHeader ? Number(timeoutHeader) : undefined,
    useServerProxy: proxyHeader ? proxyHeader === "true" : undefined,
  };
}

function cleanHeader(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
