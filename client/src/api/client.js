export const AUTH_API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
export const TRIP_API = import.meta.env.VITE_TRIP_API || "http://localhost:3000/api";

/**
 * Generic API helper for either AUTH_API or TRIP_API endpoints.
 * Example:
 *   api("/auth/login", { method:"POST", data:{email, password} })
 *   api("/trips", { base: TRIP_API })
 */
export async function api(path, { method = "GET", data, base = AUTH_API } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}
