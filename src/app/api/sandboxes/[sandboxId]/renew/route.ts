import { NextRequest, NextResponse } from "next/server";
import { withManager } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { renewSandboxSchema } from "@/lib/opensandbox/schemas";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const body = renewSandboxSchema.parse(await request.json());
    await withManager((manager) => manager.renewSandbox(sandboxId, body.timeoutSeconds));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
