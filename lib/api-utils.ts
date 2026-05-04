import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
