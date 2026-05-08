import { NextRequest, NextResponse } from "next/server";
import { withSandbox } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const metrics = await withSandbox(request, sandboxId, (sandbox) => sandbox.getMetrics());
    return NextResponse.json(metrics);
  } catch (error) {
    return toErrorResponse(error);
  }
}
