import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, timingSafeEqual } from "crypto";

function sha256(s: string): Buffer {
  return createHash("sha256").update(s, "utf8").digest();
}

function safeEqual(a: string, b: string): boolean {
  const ha = sha256(a);
  const hb = sha256(b);
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().min(1).max(255),
      password: z.string().min(1).max(255),
    }),
  )
  .handler(async ({ data }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return { ok: false as const, error: "Admin not configured" };
    }
    // Constant-time compare on hashed values to prevent timing leaks.
    const ok =
      safeEqual(data.email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
      safeEqual(data.password, adminPassword);
    if (!ok) return { ok: false as const, error: "Invalid credentials" };
    // Issue a short-lived signed token (hashed) — opaque to the client.
    const token = createHash("sha256")
      .update(`${adminEmail}:${adminPassword}:${Math.floor(Date.now() / 60000)}`)
      .digest("hex");
    return { ok: true as const, token };
  });
