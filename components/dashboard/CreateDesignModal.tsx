"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { socialFormats } from "@/lib/editor/templates";
import { api } from "@/lib/client/api";
import { toast } from "sonner";

export function CreateDesignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("Matchday Graphic");
  const [format, setFormat] = useState(socialFormats[0]);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const result = await api<{ id: string }>("/api/projects", { method: "POST", body: { title, width: format.width, height: format.height } });
      router.push("/editor/" + result.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create design");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create new design" open={open} onClose={onClose}>
      <div className="space-y-4">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project title" />
        <div className="grid grid-cols-2 gap-2">
          {socialFormats.map((item) => (
            <button key={item.label} onClick={() => setFormat(item)} className={"border p-3 text-left " + (format.label === item.label ? "border-studio-accent bg-studio-accent/10" : "border-studio-border bg-studio-elevated")}>
              <div className="font-semibold">{item.label}</div>
              <div className="font-mono text-xs text-studio-muted">{item.width} x {item.height}</div>
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={create} disabled={busy}>{busy ? "Creating..." : "Open editor"}</Button>
      </div>
    </Modal>
  );
}
