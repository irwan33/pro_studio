import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "RATE_LIMITED" | "DATABASE_ERROR" | "SERVER_ERROR";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, code: ApiErrorCode = "SERVER_ERROR", details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

function isPrismaDatabaseError(error: Error) {
  return (
    error.name.includes("Prisma") ||
    error.message.includes("Prisma") ||
    error.message.includes("database server") ||
    error.message.includes("DATABASE_URL")
  );
}

function databaseMessage(error: Error) {
  if (error.message.includes("Authentication failed against database server")) {
    return "Database authentication failed. Check DATABASE_URL in .env, or create the Postgres user/database described in README.md.";
  }
  if (error.message.includes("Environment variable not found: DATABASE_URL")) {
    return "DATABASE_URL is missing. Copy .env.example to .env and set your PostgreSQL connection string.";
  }
  if (error.message.includes("Can't reach database server") || error.message.includes("Can’t reach database server")) {
    return "Cannot reach PostgreSQL. Start your database, then run the Prisma migrate and seed commands.";
  }
  return "Database request failed. Check DATABASE_URL and PostgreSQL status.";
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) return fail("Invalid request payload", 422, "VALIDATION_ERROR", error.flatten());
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return fail("Authentication required", 401, "UNAUTHORIZED");
    if (error.message === "FORBIDDEN") return fail("You do not have permission for this resource", 403, "FORBIDDEN");
    if (error.message === "NOT_FOUND") return fail("Resource not found", 404, "NOT_FOUND");
    if (isPrismaDatabaseError(error)) return fail(databaseMessage(error), 503, "DATABASE_ERROR");
    return fail(process.env.NODE_ENV === "production" ? "Internal server error" : error.message, 500, "SERVER_ERROR");
  }
  return fail("Internal server error", 500, "SERVER_ERROR");
}
