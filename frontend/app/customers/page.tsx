"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Customer = { id: number; name: string; email: string; phone: string; company?: string };
const emptyForm = { name: "", email: "", phone: "", company: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest("/customers/?limit=100");
      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (editing) await apiRequest(`/customers/${editing}`, { method: "PUT", body: JSON.stringify(form) });
      else await apiRequest("/customers/", { method: "POST", body: JSON.stringify(form) });
      setForm(emptyForm); setEditing(null); setShowForm(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save customer"); }
  }
  async function remove(id: number) {
    if (!window.confirm("Delete this customer?")) return;
    try { await apiRequest(`/customers/${id}`, { method: "DELETE" }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete customer"); }
  }
  const filtered = customers.filter((x) => `${x.name} ${x.email} ${x.company ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="min-h-screen p-8">
    <header className="flex flex-wrap justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold">Customers</h1><p className="text-muted mt-2">Manage assigned customer relationships.</p></div>
      <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }} className="bg-primary text-white px-5 py-3 rounded-lg">{showForm ? "Close" : "+ Add Customer"}</button></header>
    {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
    {showForm && <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-6 mb-8 grid md:grid-cols-2 gap-4">
      {(["name", "email", "phone", "company"] as const).map((field) => <input key={field} required={field !== "company"} type={field === "email" ? "email" : "text"} placeholder={field[0].toUpperCase() + field.slice(1)} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="border border-border rounded-lg p-3 bg-[#FFFCF7]" />)}
      <button className="bg-primary text-white px-5 py-3 rounded-lg md:w-fit">{editing ? "Update" : "Save"} Customer</button>
    </form>}
    <section className="bg-surface border border-border rounded-xl p-6"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full border border-border rounded-lg p-3 mb-5 bg-[#FFFCF7]" />
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="py-3">Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Actions</th></tr></thead><tbody>
        {filtered.map((customer) => <tr key={customer.id} className="border-b border-border"><td className="py-4 font-semibold">{customer.name}</td><td>{customer.email}</td><td>{customer.phone}</td><td>{customer.company || "—"}</td><td><button className="text-primary mr-4" onClick={() => { setEditing(customer.id); setForm({ name: customer.name, email: customer.email, phone: customer.phone, company: customer.company || "" }); setShowForm(true); }}>Edit</button><button className="text-red-700" onClick={() => void remove(customer.id)}>Delete</button></td></tr>)}
      </tbody></table>{filtered.length === 0 && <p className="text-center py-10 text-muted">No customers found.</p>}</div>
    </section>
  </div>;
}
