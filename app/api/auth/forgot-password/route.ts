import { ok } from "@/lib/api/response";
export async function POST() { return ok({ message: "If the email exists, a reset link will be issued." }); }