import { NextRequest, NextResponse } from "next/server";
import { withSandbox } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { commandSchema } from "@/lib/opensandbox/schemas";
import { serializeJson } from "@/lib/opensandbox/serialize";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const body = commandSchema.parse(await request.json());
    const execution = await withSandbox(sandboxId, (sandbox) =>
      sandbox.commands.run(body.command, {
        workingDirectory: body.workingDirectory,
        timeoutSeconds: body.timeoutSeconds,
        background: body.background,
      }),
    );

    return NextResponse.json(serializeJson(execution));
  } catch (error) {
    return toErrorResponse(error);
  }
}
