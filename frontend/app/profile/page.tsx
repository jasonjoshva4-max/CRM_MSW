"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Profile = {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profile_picture: string | null;
};

const emptyPassword = {
  current_password: "",
  new_password: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(emptyPassword);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await apiRequest("/profile/me");
          setProfile(data);
          setName(data.name);
          setPhone(data.phone ?? "");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not load profile");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest("/profile/me", {
        method: "PUT",
        body: JSON.stringify({ name, phone }),
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest("/profile/change-password", {
        method: "PUT",
        body: JSON.stringify(password),
      });
      setPassword(emptyPassword);
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPicture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const token = window.localStorage.getItem("ember-token");
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/profile/upload-picture`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not upload profile picture");
      setProfile((current) => current ? { ...current, profile_picture: data.profile_picture } : current);
      setMessage("Profile picture uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload profile picture");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) return <main className="min-h-screen p-8 text-muted">Loading profile...</main>;

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">My profile</h1>
        <p className="mt-2 text-muted">Manage your account details and security.</p>
      </header>
      {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">{message}</p>}
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold">Profile details</h2>
          <p className="mb-4 text-sm text-muted">{profile?.email} · {profile?.role}</p>
          <div className="space-y-4">
            <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
            <input required minLength={7} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
            <button disabled={saving} className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-60">{saving ? "Saving..." : "Save profile"}</button>
          </div>
        </form>
        <div className="space-y-8">
          <form onSubmit={changePassword} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold">Change password</h2>
            <div className="space-y-4">
              <input required type="password" value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} placeholder="Current password" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
              <input required minLength={8} type="password" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} placeholder="New password" className="w-full rounded-lg border border-border bg-[#FFFCF7] p-3" />
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-60">{saving ? "Saving..." : "Change password"}</button>
            </div>
          </form>
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold">Profile picture</h2>
            {profile?.profile_picture && <p className="mb-4 text-sm text-muted">A profile picture is already uploaded.</p>}
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={uploadPicture} disabled={uploading} />
            {uploading && <p className="mt-3 text-sm text-muted">Uploading...</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
