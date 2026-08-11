import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://prostudio:prostudio@localhost:5432/prostudio?schema=public"),
  JWT_ACCESS_SECRET: z.string().min(12).default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(12).default("dev-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_DRIVER: z.enum(["local", "s3", "r2"]).default("local"),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  MAX_UPLOAD_SIZE: z.coerce.number().positive().default(10 * 1024 * 1024),
  NODE_ENV: z.string().default("development")
});

export const env = envSchema.parse(process.env);
