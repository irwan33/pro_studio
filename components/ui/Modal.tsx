"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xl overflow-hidden rounded-[28px] border border-studio-border bg-studio-panel shadow-2xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-studio-border px-4">
          <h2 className="font-display text-lg">{title}</h2>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
