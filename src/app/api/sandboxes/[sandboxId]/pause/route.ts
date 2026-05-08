import { NextRequest, NextResponse } from "next/server";
import { withManager } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    await withManager(request, (manager) => manager.pauseSandbox(sandboxId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
