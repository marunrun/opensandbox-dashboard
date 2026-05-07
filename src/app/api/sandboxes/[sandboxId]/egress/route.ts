import { NextRequest, NextResponse } from "next/server";
import { withSandbox } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { egressPatchSchema } from "@/lib/opensandbox/schemas";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const policy = await withSandbox(sandboxId, (sandbox) => sandbox.getEgressPolicy());
    return NextResponse.json(policy);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const body = egressPatchSchema.parse(await request.json());
    await withSandbox(sandboxId, (sandbox) => sandbox.patchEgressRules(body.rules));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
