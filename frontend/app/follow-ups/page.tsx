"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type FollowUp = { id: number; lead_id?: number; customer_id?: number; scheduled_at: string; status: string; notes?: string };
const initialForm = { lead_id: "", customer_id: "", scheduled_at: "", notes: "" };

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setItems((await apiRequest("/follow-ups")).follow_ups); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load follow-ups"); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/follow-ups", {
        method: "POST",
        body: JSON.stringify({
          lead_id: form.lead_id ? Number(form.lead_id) : undefined,
          customer_id: form.customer_id ? Number(form.customer_id) : undefined,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          notes: form.notes || undefined,
        }),
      });
      setForm(initialForm);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not schedule follow-up"); }
  }
  async function updateStatus(id: number, status: string) {
    try { await apiRequest(`/follow-ups/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update follow-up"); }
  }

  return <main className="min-h-screen p-8">
    <header className="mb-8"><h1 className="text-3xl font-bold">Follow-ups</h1><p className="mt-2 text-muted">Schedule and track customer or lead follow-ups.</p></header>
    {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
    <form onSubmit={submit} className="mb-8 grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2">
      <input type="number" min="1" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value, customer_id: "" })} placeholder="Lead ID" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
      <input type="number" min="1" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, lead_id: "" })} placeholder="Customer ID" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
      <input required type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
      <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
      <button className="rounded-lg bg-primary px-5 py-3 font-semibold text-white md:w-fit">Schedule follow-up</button>
    </form>
    <section className="rounded-xl border border-border bg-surface p-6"><div className="space-y-3">{items.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-4"><div><p className="font-semibold">{item.lead_id ? `Lead #${item.lead_id}` : `Customer #${item.customer_id}`}</p><p className="text-sm text-muted">{new Date(item.scheduled_at).toLocaleString()} {item.notes ? `· ${item.notes}` : ""}</p></div><select value={item.status} onChange={(e) => void updateStatus(item.id, e.target.value)} className="rounded-lg border border-border bg-[#FFFCF7] p-2"><option>Pending</option><option>Completed</option><option>Cancelled</option></select></div>)}{items.length === 0 && <p className="text-muted">No follow-ups scheduled.</p>}</div></section>
  </main>;
}
