import { NextRequest, NextResponse } from "next/server";
import { withSandbox } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { endpointSchema } from "@/lib/opensandbox/schemas";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const url = new URL(request.url);
    const query = endpointSchema.parse({ port: url.searchParams.get("port") });
    const result = await withSandbox(request, sandboxId, async (sandbox) => ({
      endpoint: await sandbox.getEndpoint(query.port),
      url: await sandbox.getEndpointUrl(query.port),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
