"use client";

import { useCallback, useEffect, useState } from "react";
import StatCard from "../components/statcard";
import { apiRequest } from "../lib/api";

type Dashboard = { assigned_customers: number; active_leads: number; completed_tasks: number; upcoming_followups: number; pending_tasks: number; lead_conversions: number };

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await apiRequest("/dashboard")); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in to view your dashboard"); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const stats = [
    { label: "Assigned Customers", value: data?.assigned_customers ?? "—" },
    { label: "Active Leads", value: data?.active_leads ?? "—" },
    { label: "Completed Tasks", value: data?.completed_tasks ?? "—" },
    { label: "Upcoming Follow-ups", value: data?.upcoming_followups ?? "—" },
  ];
  return <div className="min-h-screen p-8"><header className="mb-10"><p className="text-sm text-muted">ember CRM</p><h2 className="text-3xl font-bold mt-2">Workspace overview</h2><p className="text-muted mt-1">Your live customer, lead, task and follow-up activity.</p></header>
    {error && <p className="mb-5 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">{stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={String(stat.value)} change="" />)}</section>
    <section className="bg-surface border border-border rounded-xl p-6"><h3 className="text-xl font-bold mb-4">Pipeline summary</h3><div className="grid sm:grid-cols-2 gap-4"><p>Lead conversions: <strong>{data?.lead_conversions ?? "—"}</strong></p><p>Pending tasks: <strong>{data?.pending_tasks ?? "—"}</strong></p></div></section>
  </div>;
}
