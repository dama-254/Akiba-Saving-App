const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  listGoals: (token) => request("/api/goals", { token }),
  createGoal: (token, payload) => request("/api/goals", { method: "POST", body: payload, token }),
  getGoal: (token, id) => request(`/api/goals/${id}`, { token }),
  updateGoal: (token, id, payload) =>
    request(`/api/goals/${id}`, { method: "PUT", body: payload, token }),
  deleteGoal: (token, id) => request(`/api/goals/${id}`, { method: "DELETE", token }),
  addDeposit: (token, goalId, payload) =>
    request(`/api/goals/${goalId}/deposits`, { method: "POST", body: payload, token }),
  deleteDeposit: (token, depositId) =>
    request(`/api/deposits/${depositId}`, { method: "DELETE", token }),
};
