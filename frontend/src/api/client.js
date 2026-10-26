const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));

  // A token that is expired (401) or malformed (422) means the session is over.
  if (token && (res.status === 401 || res.status === 422) && onUnauthorized) {
    onUnauthorized();
    throw new Error("Your session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(data.error || data.msg || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  getAccount: (token) => request("/api/account", { token }),
  getTransactions: (token, { limit = 20, offset = 0, kind = "" } = {}) => {
    const params = new URLSearchParams({ limit, offset });
    if (kind) params.set("kind", kind);
    return request(`/api/account/transactions?${params}`, { token });
  },
  deposit: (token, payload) =>
    request("/api/account/deposit", { method: "POST", body: payload, token }),
  withdraw: (token, payload) =>
    request("/api/account/withdraw", { method: "POST", body: payload, token }),
  transfer: (token, payload) =>
    request("/api/account/transfer", { method: "POST", body: payload, token }),
};
// end of file
