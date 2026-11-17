"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";

type Results = { customers: { id: number; name: string; email: string }[]; leads: { id: number; name: string; email: string; stage: string }[] };
const stages = ["", "New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"];

export default function SearchPage() {
  const [form, setForm] = useState({ q: "", employee_id: "", stage: "", priority: "", date: "" });
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const params = new URLSearchParams({ q: form.q });
      if (form.employee_id) params.set("employee_id", form.employee_id);
      if (form.stage) params.set("stage", form.stage);
      if (form.priority) params.set("priority", form.priority);
      if (form.date) params.set("date", new Date(form.date).toISOString());
      setResults(await apiRequest(`/search?${params.toString()}`));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not search"); }
  }
  return <main className="min-h-screen p-8"><header className="mb-8"><h1 className="text-3xl font-bold">Global search</h1><p className="mt-2 text-muted">Search accessible customers and leads with filters.</p></header>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}<form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2"><input required minLength={1} value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="Name, email or company" className="rounded-lg border border-border bg-[#FFFCF7] p-3 md:col-span-2" /><input type="number" min="1" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="Employee ID" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3">{stages.map((stage) => <option key={stage} value={stage}>{stage || "Any lead stage"}</option>)}</select><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3"><option value="">Any priority</option><option>Low</option><option>Medium</option><option>High</option></select><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><button className="rounded-lg bg-primary px-5 py-3 font-semibold text-white md:w-fit">Search</button></form>{results && <section className="mt-8 grid gap-6 md:grid-cols-2"><div className="rounded-xl border border-border bg-surface p-6"><h2 className="text-xl font-bold">Customers</h2>{results.customers.map((item) => <p key={item.id} className="border-b border-border py-3"><strong>{item.name}</strong><br /><span className="text-sm text-muted">{item.email}</span></p>)}{results.customers.length === 0 && <p className="mt-4 text-muted">No customers found.</p>}</div><div className="rounded-xl border border-border bg-surface p-6"><h2 className="text-xl font-bold">Leads</h2>{results.leads.map((item) => <p key={item.id} className="border-b border-border py-3"><strong>{item.name}</strong><br /><span className="text-sm text-muted">{item.email} · {item.stage}</span></p>)}{results.leads.length === 0 && <p className="mt-4 text-muted">No leads found.</p>}</div></section>}</main>;
}
