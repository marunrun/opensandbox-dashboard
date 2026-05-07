import { NextRequest, NextResponse } from "next/server";
import { withManager } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { serializeSandboxInfo } from "@/lib/opensandbox/serialize";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const info = await withManager((manager) => manager.getSandboxInfo(sandboxId));
    return NextResponse.json(serializeSandboxInfo(info));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    await withManager((manager) => manager.killSandbox(sandboxId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
