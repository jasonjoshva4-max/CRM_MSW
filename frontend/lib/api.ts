const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("ember-token")
    : null;
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("ember-auth-expired"));
    }
    throw new Error(data.detail || "API request failed");
  }

  return data;
}