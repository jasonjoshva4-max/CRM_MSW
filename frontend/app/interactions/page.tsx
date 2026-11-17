"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Interaction = { id: number; lead_id?: number; customer_id?: number; interaction_type: string; occurred_at: string; notes: string };
const initialForm = { lead_id: "", customer_id: "", interaction_type: "Call", notes: "" };

export default function InteractionsPage() {
  const [items, setItems] = useState<Interaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setItems((await apiRequest("/interactions")).interactions); } catch (err) { setError(err instanceof Error ? err.message : "Could not load interactions"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      await apiRequest("/interactions", { method: "POST", body: JSON.stringify({ lead_id: form.lead_id ? Number(form.lead_id) : undefined, customer_id: form.customer_id ? Number(form.customer_id) : undefined, interaction_type: form.interaction_type, notes: form.notes }) });
      setForm(initialForm); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not record interaction"); }
  }
  return <main className="min-h-screen p-8"><header className="mb-8"><h1 className="text-3xl font-bold">Interaction history</h1><p className="mt-2 text-muted">Record calls, emails, meetings and notes.</p></header>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}<form onSubmit={submit} className="mb-8 grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2"><input type="number" min="1" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value, customer_id: "" })} placeholder="Lead ID" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><input type="number" min="1" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, lead_id: "" })} placeholder="Customer ID" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><select value={form.interaction_type} onChange={(e) => setForm({ ...form, interaction_type: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3"><option>Call</option><option>Email</option><option>Meeting</option><option>Note</option></select><input required value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What happened?" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><button className="rounded-lg bg-primary px-5 py-3 font-semibold text-white md:w-fit">Record interaction</button></form><section className="rounded-xl border border-border bg-surface p-6"><div className="space-y-3">{items.map((item) => <article key={item.id} className="border-b border-border py-4"><div className="flex justify-between"><h2 className="font-semibold">{item.interaction_type} · {item.lead_id ? `Lead #${item.lead_id}` : `Customer #${item.customer_id}`}</h2><time className="text-sm text-muted">{new Date(item.occurred_at).toLocaleString()}</time></div><p className="mt-2 text-muted">{item.notes}</p></article>)}{items.length === 0 && <p className="text-muted">No interactions recorded.</p>}</div></section></main>;
}
