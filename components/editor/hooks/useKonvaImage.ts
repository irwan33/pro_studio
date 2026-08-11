"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "loaded" | "error";

const cache = new Map<string, HTMLImageElement>();

/**
 * Loads an image once per src and keeps it in a module cache so Konva nodes are
 * never handed a freshly constructed HTMLImageElement on every render.
 */
export function useKonvaImage(src: string | undefined) {
  const [image, setImage] = useState<HTMLImageElement | undefined>(() =>
    src ? cache.get(src) : undefined
  );
  const [status, setStatus] = useState<Status>(() => (src && cache.has(src) ? "loaded" : "idle"));

  useEffect(() => {
    if (!src) {
      setImage(undefined);
      setStatus("idle");
      return;
    }

    const cached = cache.get(src);
    if (cached) {
      setImage(cached);
      setStatus("loaded");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    const element = new window.Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) element.crossOrigin = "anonymous";

    element.onload = () => {
      if (cancelled) return;
      cache.set(src, element);
      setImage(element);
      setStatus("loaded");
    };
    element.onerror = () => {
      if (cancelled) return;
      setStatus("error");
      setImage(undefined);
    };
    element.src = src;

    return () => {
      cancelled = true;
      element.onload = null;
      element.onerror = null;
    };
  }, [src]);

  return { image, status };
}
