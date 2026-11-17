"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Report = { total_leads: number; lead_conversions: number; lost_leads: number; customer_growth: number; employee_performance: { name: string; leads: number; conversions: number; completed_tasks: number }[] };
export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setReport(await apiRequest("/reports")); } catch (err) { setError(err instanceof Error ? err.message : "Could not load report"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  return <main className="min-h-screen p-8"><h1 className="text-3xl font-bold">Reports</h1><p className="text-muted mt-2 mb-8">Live performance and pipeline analytics.</p>{error && <p className="mb-4 text-red-700">{error}</p>}<div className="grid md:grid-cols-4 gap-4 mb-8">{[["Total leads", report?.total_leads], ["Conversions", report?.lead_conversions], ["Lost leads", report?.lost_leads], ["Customer growth", report?.customer_growth]].map(([label, value]) => <div key={String(label)} className="bg-surface border border-border rounded-xl p-5"><p className="text-muted text-sm">{label}</p><p className="text-3xl font-bold mt-2">{value ?? "—"}</p></div>)}</div><section className="bg-surface border border-border rounded-xl p-6"><h2 className="text-xl font-bold mb-4">Employee performance</h2>{report?.employee_performance.map((employee) => <div key={employee.name} className="flex justify-between border-b border-border py-3"><span>{employee.name}</span><span>{employee.leads} leads · {employee.conversions} conversions · {employee.completed_tasks} tasks</span></div>)}</section></main>;
}
