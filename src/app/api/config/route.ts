import { NextResponse } from "next/server";
import { getOpenSandboxRuntimeConfig } from "@/lib/opensandbox/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = getOpenSandboxRuntimeConfig(request);

  return NextResponse.json({
    domain: config.domain,
    protocol: config.protocol,
    requestTimeoutSeconds: config.requestTimeoutSeconds,
    useServerProxy: config.useServerProxy,
    hasApiKey: Boolean(config.apiKey),
  });
}
