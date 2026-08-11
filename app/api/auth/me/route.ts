import { handleApiError, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  try {
    return ok(await requireUser());
  } catch (error) {
    return handleApiError(error);
  }
}
