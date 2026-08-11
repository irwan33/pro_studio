export type ExportFormat = "PNG" | "JPG" | "SVG" | "PDF";

export function dataUrlToBuffer(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  return Buffer.from(base64, "base64");
}

export function assertExportFormat(format: string): asserts format is ExportFormat {
  if (!["PNG", "JPG", "SVG", "PDF"].includes(format)) throw new Error("Unsupported export format");
}
