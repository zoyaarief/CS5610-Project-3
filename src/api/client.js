const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
export async function api(path, { method="GET", data } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type":"application/json" },
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}
