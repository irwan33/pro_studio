import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { env } from "@/lib/env";

export type UploadInput = { filename: string; mimeType: string; bytes: Buffer };

export interface StorageDriver {
  uploadFile(input: UploadInput): Promise<{ url: string; key: string }>;
  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  createSignedUploadUrl(filename: string): Promise<{ url: string; key: string }>;
}

const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function safeName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export class LocalStorageDriver implements StorageDriver {
  async uploadFile(input: UploadInput) {
    if (!imageTypes.has(input.mimeType)) throw new Error("Unsupported upload type");
    if (input.bytes.byteLength > env.MAX_UPLOAD_SIZE) throw new Error("File is too large");
    const key = crypto.randomUUID() + "-" + safeName(input.filename);
    const dir = path.resolve(env.UPLOAD_DIR);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, key), input.bytes);
    return { key, url: this.getPublicUrl(key) };
  }

  async deleteFile(key: string) {
    await fs.rm(path.join(path.resolve(env.UPLOAD_DIR), key), { force: true });
  }

  getPublicUrl(key: string) {
    return "/api/storage/" + encodeURIComponent(key);
  }

  async createSignedUploadUrl(filename: string) {
    const key = crypto.randomUUID() + "-" + safeName(filename);
    return { key, url: "/api/assets/upload?key=" + encodeURIComponent(key) };
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
