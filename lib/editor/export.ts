import type Konva from "konva";

export type ExportFormat = "png" | "jpg" | "jpeg" | "svg" | "pdf";

export type ExportOptions = {
  format: ExportFormat;
  pixelRatio?: number;
  quality?: number;
  fileName?: string;
};

function mimeFor(format: ExportFormat) {
  return format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
}

function extensionFor(format: ExportFormat) {
  if (format === "jpeg") return "jpg";
  return format;
}

/**
 * Renders the artboard to a data URL. The stage is temporarily reset to scale 1
 * so the export always matches the document size regardless of the editor zoom.
 */
export function stageToDataUrl(stage: Konva.Stage, size: { width: number; height: number }, options: ExportOptions) {
  const previous = {
    scaleX: stage.scaleX(),
    scaleY: stage.scaleY(),
    x: stage.x(),
    y: stage.y(),
    width: stage.width(),
    height: stage.height()
  };

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.size({ width: size.width, height: size.height });

  try {
    return stage.toDataURL({
      mimeType: mimeFor(options.format),
      quality: options.quality ?? 0.95,
      pixelRatio: options.pixelRatio ?? 1
    });
  } finally {
    stage.scale({ x: previous.scaleX, y: previous.scaleY });
    stage.position({ x: previous.x, y: previous.y });
    stage.size({ width: previous.width, height: previous.height });
    stage.batchDraw();
  }
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, fileName);
  URL.revokeObjectURL(url);
}

function bytesFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Minimal single-page PDF wrapper around a JPEG, no external dependency. */
export function pdfFromJpegDataUrl(dataUrl: string, width: number, height: number) {
  const jpeg = bytesFromDataUrl(dataUrl);
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;

  function pushString(value: string) {
    const bytes = encoder.encode(value);
    parts.push(bytes);
    size += bytes.length;
  }

  function pushBytes(bytes: Uint8Array) {
    parts.push(bytes);
    size += bytes.length;
  }

  function object(id: number, body: () => void) {
    offsets[id] = size;
    pushString(id + " 0 obj\n");
    body();
    pushString("\nendobj\n");
  }

  pushString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, () => pushString("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () => pushString("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  object(3, () =>
    pushString(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        width +
        " " +
        height +
        "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"
    )
  );
  object(4, () => {
    pushString(
      "<< /Type /XObject /Subtype /Image /Width " +
        width +
        " /Height " +
        height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        jpeg.length +
        " >>\nstream\n"
    );
    pushBytes(jpeg);
    pushString("\nendstream");
  });
  const draw = "q\n" + width + " 0 0 " + height + " 0 0 cm\n/Im0 Do\nQ\n";
  object(5, () => pushString("<< /Length " + encoder.encode(draw).length + " >>\nstream\n" + draw + "endstream"));

  const xref = size;
  pushString("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id += 1) pushString(String(offsets[id]).padStart(10, "0") + " 00000 n \n");
  pushString("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

/**
 * SVG export wraps the rasterised artboard. Konva has no vector serialiser, so
 * this is a documented limitation rather than a true vector export.
 */
export function svgFromDataUrl(dataUrl: string, width: number, height: number) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='" +
    width +
    "' height='" +
    height +
    "'><image href='" +
    dataUrl +
    "' width='100%' height='100%'/></svg>";
  return new Blob([svg], { type: "image/svg+xml" });
}

export function exportStage(
  stage: Konva.Stage,
  size: { width: number; height: number },
  options: ExportOptions
) {
  const pixelRatio = options.pixelRatio ?? 1;
  const fileName = (options.fileName ?? "pro-studio-export") + "." + extensionFor(options.format);

  if (options.format === "pdf") {
    const dataUrl = stageToDataUrl(stage, size, { ...options, format: "jpeg" });
    const blob = pdfFromJpegDataUrl(dataUrl, size.width * pixelRatio, size.height * pixelRatio);
    downloadBlob(blob, fileName);
    return;
  }

  if (options.format === "svg") {
    const dataUrl = stageToDataUrl(stage, size, { ...options, format: "png" });
    downloadBlob(svgFromDataUrl(dataUrl, size.width * pixelRatio, size.height * pixelRatio), fileName);
    return;
  }

  downloadDataUrl(stageToDataUrl(stage, size, options), fileName);
}
