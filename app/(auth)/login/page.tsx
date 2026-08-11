"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("user@prostudio.dev");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const payload = await res.json();
    if (!res.ok) return setError(payload.error?.message ?? "Login failed");
    sessionStorage.setItem("pro_studio_access", payload.data.accessToken);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-studio-bg p-6">
      <form onSubmit={submit} className="w-full max-w-md border border-studio-border bg-studio-panel p-6">
        <h1 className="font-display text-3xl">Pro Studio</h1>
        <p className="mt-2 text-sm text-studio-secondaryText">Sign in to continue creating sports content.</p>
        <div className="mt-6 space-y-3">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button variant="primary" className="w-full">Login</Button>
        </div>
        <p className="mt-4 text-sm text-studio-secondaryText">No account? <Link href="/register" className="text-studio-accent">Register</Link></p>
      </form>
    </main>
  );
}
