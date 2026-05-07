import { NextResponse } from "next/server";
import { getOpenSandboxRuntimeConfig } from "@/lib/opensandbox/config";

export const runtime = "nodejs";

export async function GET() {
  const config = getOpenSandboxRuntimeConfig();

  return NextResponse.json({
    domain: config.domain,
    protocol: config.protocol,
    requestTimeoutSeconds: config.requestTimeoutSeconds,
    useServerProxy: config.useServerProxy,
    hasApiKey: Boolean(config.apiKey),
  });
}
