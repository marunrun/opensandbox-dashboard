import { NextRequest, NextResponse } from "next/server";
import { createSandbox, withManager } from "@/lib/opensandbox/client";
import { toErrorResponse } from "@/lib/opensandbox/errors";
import { createSandboxSchema, listSandboxSchema } from "@/lib/opensandbox/schemas";
import { serializeSandboxInfo } from "@/lib/opensandbox/serialize";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = listSandboxSchema.parse({
      state: url.searchParams.get("state") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const response = await withManager(request, (manager) =>
      manager.listSandboxInfos({
        states: query.state ? [query.state] : undefined,
        page: query.page,
        pageSize: query.pageSize ?? 20,
      }),
    );

    return NextResponse.json({
      ...response,
      items: response.items.map(serializeSandboxInfo),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSandboxSchema.parse(await request.json());
    const sandbox = await createSandbox(body, request);

    try {
      const info = await sandbox.getInfo();
      return NextResponse.json(serializeSandboxInfo(info), { status: 201 });
    } finally {
      await sandbox.close();
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}
