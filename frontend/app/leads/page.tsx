"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Lead = { id: number; name: string; email: string; company?: string; source: string; stage: string; priority: string; expected_deal_value: number };
const stages = ["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState("All");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const data = await apiRequest(`/leads/${stage === "All" ? "" : `?stage=${encodeURIComponent(stage)}`}`); setLeads(data.leads); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load leads"); }
  }, [stage]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function update(id: number, next: string) {
    try { await apiRequest(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ stage: next }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update lead"); }
  }
  return <main className="min-h-screen p-8"><header className="flex justify-between mb-8"><div><h1 className="text-3xl font-bold">Leads</h1><p className="text-muted mt-2">Track the pipeline from new to conversion.</p></div><select value={stage} onChange={(e) => setStage(e.target.value)} className="border border-border rounded-lg p-3 bg-surface"><option>All</option>{stages.map((x) => <option key={x}>{x}</option>)}</select></header>
    {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{leads.map((lead) => <article key={lead.id} className="bg-surface border border-border rounded-xl p-5"><div className="flex justify-between"><h2 className="font-bold">{lead.name}</h2><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-primary">{lead.priority}</span></div><p className="text-muted text-sm mt-1">{lead.company || lead.email}</p><p className="mt-4 font-semibold">{Number(lead.expected_deal_value).toLocaleString()}</p><select value={lead.stage} onChange={(e) => void update(lead.id, e.target.value)} className="mt-4 w-full border border-border rounded-lg p-2 bg-[#FFFCF7]">{stages.map((x) => <option key={x}>{x}</option>)}</select></article>)}</section>{leads.length === 0 && <p className="text-center text-muted py-12">No leads in this view.</p>}</main>;
}
