import { NextRequest, NextResponse } from "next/server";
import { withSandbox } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { fileReadSchema, fileSearchSchema, fileWriteSchema } from "@/lib/opensandbox/schemas";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ sandboxId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "read";

    if (mode === "search") {
      const query = fileSearchSchema.parse({
        path: url.searchParams.get("path"),
        pattern: url.searchParams.get("pattern") ?? undefined,
      });
      const files = await withSandbox(sandboxId, (sandbox) => sandbox.files.search(query));
      return NextResponse.json({ items: files });
    }

    const query = fileReadSchema.parse({ path: url.searchParams.get("path") });
    const content = await withSandbox(sandboxId, (sandbox) => sandbox.files.readFile(query.path));
    return NextResponse.json({ content });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { sandboxId } = await params;
    const body = fileWriteSchema.parse(await request.json());
    await withSandbox(sandboxId, (sandbox) =>
      sandbox.files.writeFiles([{ path: body.path, data: body.data, mode: body.mode }]),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
