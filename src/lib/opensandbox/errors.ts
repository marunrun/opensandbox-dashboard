import { NextResponse } from "next/server";
import { SandboxException } from "@alibaba-group/opensandbox";

type ErrorPayload = {
  error: {
    code: string;
    message: string;
    requestId?: string;
    statusCode?: number;
  };
};

export function toErrorResponse(error: unknown) {
  if (error instanceof SandboxException) {
    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 502;
    const payload: ErrorPayload = {
      error: {
        code: error.error.code,
        message: error.error.message ?? error.message,
        requestId: error.requestId,
        statusCode,
      },
    };

    return NextResponse.json(payload, { status: statusCode });
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    } satisfies ErrorPayload,
    { status: 500 },
  );
}
