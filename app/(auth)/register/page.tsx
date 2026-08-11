"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error?.message ?? "Register failed");
    sessionStorage.setItem("pro_studio_access", payload.data.accessToken);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-studio-bg p-6">
      <form onSubmit={submit} className="w-full max-w-md border border-studio-border bg-studio-panel p-6">
        <h1 className="font-display text-3xl">Create account</h1>
        <div className="mt-6 space-y-3">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button variant="primary" className="w-full">Register</Button>
        </div>
        <p className="mt-4 text-sm text-studio-secondaryText">Already have an account? <Link href="/login" className="text-studio-accent">Login</Link></p>
      </form>
    </main>
  );
}
