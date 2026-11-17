"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Task = { id: number; title: string; due_at: string; status: string; priority: string };
export default function ActivitiesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setTasks((await apiRequest("/tasks")).tasks); } catch (err) { setError(err instanceof Error ? err.message : "Could not load tasks"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function complete(id: number) { try { await apiRequest(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Completed" }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Could not update task"); } }
  return <main className="min-h-screen p-8"><h1 className="text-3xl font-bold">Activities</h1><p className="text-muted mt-2 mb-8">Tasks and pending activities.</p>{error && <p className="mb-4 text-red-700">{error}</p>}<section className="bg-surface border border-border rounded-xl p-6"><div className="space-y-3">{tasks.map((task) => <div key={task.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-4"><div><h2 className="font-semibold">{task.title}</h2><p className="text-sm text-muted">Due {new Date(task.due_at).toLocaleString()} · {task.priority}</p></div>{task.status !== "Completed" && <button onClick={() => void complete(task.id)} className="text-primary font-semibold">Mark complete</button>}</div>)}{tasks.length === 0 && <p className="text-muted">No tasks assigned.</p>}</div></section></main>;
}
