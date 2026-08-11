import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password auth", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
  });
});
