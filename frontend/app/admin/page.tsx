"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../components/auth-shell";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  manager_id: number | null;
};

type Manager = { id: number; name: string; email: string };

type EmployeeForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const emptyForm: EmployeeForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function AdminPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (user?.role !== "Admin") return;
    setLoading(true);
    setError("");
    try {
      const [employeeData, managerData] = await Promise.all([
        apiRequest("/admin/employees/"),
        apiRequest("/admin/employees/managers"),
      ]);
      setEmployees(employeeData);
      setManagers(managerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load administration data");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  function startCreate() {
    clearFeedback();
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(employee: Employee) {
    clearFeedback();
    setEditing(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone ?? "",
      password: "",
    });
    setShowForm(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/admin/employees/${editing}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
          }),
        });
        setMessage("Employee updated successfully.");
      } else {
        await apiRequest("/admin/employees/", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("Employee created successfully.");
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save employee");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(employee: Employee) {
    clearFeedback();
    setActionId(employee.id);
    try {
      const action = employee.is_active ? "deactivate" : "activate";
      await apiRequest(`/admin/employees/${employee.id}/${action}`, { method: "PATCH" });
      setMessage(`Employee ${action}d successfully.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update employee status");
    } finally {
      setActionId(null);
    }
  }

  async function remove(employee: Employee) {
    if (!window.confirm(`Delete employee ${employee.name}? This cannot be undone.`)) return;
    clearFeedback();
    setActionId(employee.id);
    try {
      await apiRequest(`/admin/employees/${employee.id}`, { method: "DELETE" });
      setMessage("Employee deleted successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete employee");
    } finally {
      setActionId(null);
    }
  }

  async function assign(employeeId: number, managerId: string) {
    clearFeedback();
    setActionId(employeeId);
    try {
      await apiRequest(`/admin/employees/${employeeId}/manager`, {
        method: "PUT",
        body: JSON.stringify({ manager_id: managerId ? Number(managerId) : null }),
      });
      setMessage("Manager assignment updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign manager");
    } finally {
      setActionId(null);
    }
  }

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.email} ${employee.phone ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== "Admin") {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="mt-3 text-red-700">Administrator access is required.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="mt-2 text-muted">Manage employees and team assignments.</p>
        </div>
        <button onClick={showForm ? () => setShowForm(false) : startCreate} className="rounded-lg bg-primary px-5 py-3 text-white">
          {showForm ? "Close form" : "+ Add Employee"}
        </button>
      </header>

      {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">{message}</p>}

      {showForm && (
        <form onSubmit={submit} className="mb-8 grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2">
          <h2 className="md:col-span-2 text-xl font-bold">{editing ? "Edit employee" : "Add employee"}</h2>
          <input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
          <input required minLength={7} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
          {!editing && <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Temporary password" className="rounded-lg border border-border bg-[#FFFCF7] p-3" />}
          <div className="flex gap-3 md:col-span-2">
            <button disabled={saving} className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-60">{saving ? "Saving..." : editing ? "Update employee" : "Create employee"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-3">Cancel</button>
          </div>
        </form>
      )}

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Employees</h2>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees..." className="rounded-lg border border-border bg-[#FFFCF7] p-3" />
        </div>
        {loading ? <p className="text-muted">Loading employees...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b border-border text-muted"><th className="py-3">Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Assigned manager</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border align-top">
                    <td className="py-4 font-semibold">{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.phone || "—"}</td>
                    <td>{employee.role}</td>
                    <td><span className={employee.is_active ? "rounded-full bg-green-100 px-2 py-1 text-green-800" : "rounded-full bg-gray-100 px-2 py-1 text-gray-700"}>{employee.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <input list={`managers-${employee.id}`} defaultValue={managers.find((manager) => manager.id === employee.manager_id)?.name ?? ""} onChange={(event) => { const manager = managers.find((item) => item.name === event.target.value || item.email === event.target.value); if (manager || event.target.value === "") void assign(employee.id, manager?.id.toString() ?? ""); }} placeholder="Search manager..." className="w-44 rounded-lg border border-border bg-[#FFFCF7] p-2" />
                      <datalist id={`managers-${employee.id}`}>{managers.map((manager) => <option key={manager.id} value={manager.name}>{manager.email}</option>)}</datalist>
                    </td>
                    <td className="space-x-3 whitespace-nowrap">
                      <button disabled={actionId === employee.id} onClick={() => startEdit(employee)} className="text-primary disabled:opacity-50">Edit</button>
                      <button disabled={actionId === employee.id} onClick={() => void updateStatus(employee)} className="text-primary disabled:opacity-50">{employee.is_active ? "Deactivate" : "Activate"}</button>
                      <button disabled={actionId === employee.id} onClick={() => void remove(employee)} className="text-red-700 disabled:opacity-50">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredEmployees.length && <p className="py-10 text-center text-muted">No employees found.</p>}
          </div>
        )}
      </section>
    </main>
  );
}
