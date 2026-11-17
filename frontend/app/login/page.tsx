"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await login(data.access_token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold text-primary">ember.</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-muted">Sign in to your CRM workspace.</p>
        {error && <p className="mt-5 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
          <button disabled={saving} className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
            {saving ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted">Need an account? <Link href="/register" className="font-semibold text-primary">Create one</Link></p>
      </section>
    </main>
  );
}
