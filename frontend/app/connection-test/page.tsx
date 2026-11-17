
"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function ConnectionTest() {
  const [status, setStatus] = useState("Checking connection...");

  useEffect(() => {
    apiRequest("/health")
      .then((data) => {
        setStatus(`Connected successfully! Status: ${data.status}`);
      })
      .catch(() => {
        setStatus("Connection failed. Check whether FastAPI is running.");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="rounded-xl border p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">
          Frontend - Backend Connection
        </h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
