"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Task = { id: number; title: string; description?: string; due_at: string; status: string; priority: string };
const initialForm = { title: "", description: "", due_at: "", priority: "Medium" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setTasks((await apiRequest("/tasks")).tasks); } catch (err) { setError(err instanceof Error ? err.message : "Could not load tasks"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await apiRequest("/tasks", { method: "POST", body: JSON.stringify({ ...form, due_at: new Date(form.due_at).toISOString(), description: form.description || undefined }) }); setForm(initialForm); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not create task"); }
  }
  async function update(id: number, status: string) {
    try { await apiRequest(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update task"); }
  }
  return <main className="min-h-screen p-8"><header className="mb-8"><h1 className="text-3xl font-bold">Tasks</h1><p className="mt-2 text-muted">Manage deadlines and pending activities.</p></header>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}<form onSubmit={submit} className="mb-8 grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2"><input required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><input required type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3" /><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-border bg-[#FFFCF7] p-3"><option>Low</option><option>Medium</option><option>High</option></select><button className="rounded-lg bg-primary px-5 py-3 font-semibold text-white md:w-fit">Create task</button></form><section className="rounded-xl border border-border bg-surface p-6"><div className="space-y-3">{tasks.map((task) => <div key={task.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-4"><div><h2 className="font-semibold">{task.title}</h2><p className="text-sm text-muted">Due {new Date(task.due_at).toLocaleString()} · {task.priority}{task.description ? ` · ${task.description}` : ""}</p></div><select value={task.status} onChange={(e) => void update(task.id, e.target.value)} className="rounded-lg border border-border bg-[#FFFCF7] p-2"><option>Pending</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></div>)}{tasks.length === 0 && <p className="text-muted">No tasks assigned.</p>}</div></section></main>;
}
