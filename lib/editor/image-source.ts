/**
 * Reads the intrinsic size of an image source in the browser.
 *
 * Both the insert and the replace flow need the natural dimensions before they
 * can compute a cover crop, and both must load through the same CORS rules the
 * canvas renderer uses or export would later fail on a tainted canvas.
 */

export type ProbedImage = { src: string; naturalWidth: number; naturalHeight: number };

/** Data and blob URLs are same-origin by definition and must not be tainted. */
export function needsCrossOrigin(src: string) {
  return !src.startsWith("data:") && !src.startsWith("blob:");
}

export function probeImageSize(src: string): Promise<ProbedImage> {
  return new Promise((resolve, reject) => {
    const probe = new window.Image();
    probe.onload = () => {
      resolve({ src, naturalWidth: probe.naturalWidth, naturalHeight: probe.naturalHeight });
    };
    probe.onerror = () => reject(new Error("Could not load image"));
    if (needsCrossOrigin(src)) probe.crossOrigin = "anonymous";
    probe.src = src;
  });
}

/** Reads a picked file as a data URL, which is what the scene stores. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
