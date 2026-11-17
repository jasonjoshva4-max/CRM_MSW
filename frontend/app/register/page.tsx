"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold text-primary">ember.</p>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        {error && <p className="mt-5 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {(["name", "email", "phone", "password"] as const).map((field) => (
            <input key={field} required minLength={field === "password" ? 8 : undefined} type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field[0].toUpperCase() + field.slice(1)} className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
          ))}
          <button disabled={saving} className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Creating..." : "Create account"}</button>
        </form>
        <p className="mt-6 text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-primary">Sign in</Link></p>
      </section>
    </main>
  );
}
