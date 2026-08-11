"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client/api";
import { toast } from "sonner";

export function ShareModal({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  async function create() {
    try {
      const result = await api<{ url: string }>("/api/projects/" + projectId + "/share", { method: "POST", body: { permission: "VIEW" } });
      setUrl(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create share link");
    }
  }
  return <Modal title="Share design" open={open} onClose={onClose}><div className="space-y-4"><Button variant="primary" onClick={create}>Create public link</Button>{url && <div className="flex gap-2"><input className="flex-1 border border-studio-border bg-studio-input px-3 font-mono text-sm" value={url} readOnly /><Button onClick={() => navigator.clipboard.writeText(url)}><Copy size={16} />Copy</Button></div>}</div></Modal>;
}
