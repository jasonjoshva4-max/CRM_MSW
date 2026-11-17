"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Notification = { id: number; message: string; kind: string; read: boolean; created_at: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setItems((await apiRequest("/notifications")).notifications); } catch (err) { setError(err instanceof Error ? err.message : "Could not load notifications"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function markRead(id: number) { try { await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Could not mark notification as read"); } }
  return <main className="min-h-screen p-8"><header className="mb-8"><h1 className="text-3xl font-bold">Notifications</h1><p className="mt-2 text-muted">Assignments, follow-ups and task reminders.</p></header>{error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}<section className="rounded-xl border border-border bg-surface p-6"><div className="space-y-3">{items.map((item) => <div key={item.id} className={`flex flex-wrap justify-between gap-3 border-b border-border py-4 ${item.read ? "opacity-60" : ""}`}><div><p className="font-semibold">{item.message}</p><p className="text-sm text-muted">{item.kind} · {new Date(item.created_at).toLocaleString()}</p></div>{!item.read && <button onClick={() => void markRead(item.id)} className="text-primary font-semibold">Mark read</button>}</div>)}{items.length === 0 && <p className="text-muted">You have no notifications.</p>}</div></section></main>;
}
