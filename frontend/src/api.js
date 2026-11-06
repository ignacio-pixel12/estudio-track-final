const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Error ${response.status}`;
    const error = new Error(message);
    error.details = payload?.error?.details;
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

export const api = {
  health: () => request("/health"),

  listSubjects: () => request("/subjects"),
  createSubject: (data) => request("/subjects", { method: "POST", body: data }),

  listTasks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subjectId) params.set("subjectId", filters.subjectId);
    if (filters.status) params.set("status", filters.status);
    const query = params.toString();
    return request(`/tasks${query ? `?${query}` : ""}`);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PATCH", body: data }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: "POST" }),
  registerSession: (id, data) => request(`/tasks/${id}/sessions`, { method: "POST", body: data }),

  stats: () => request("/stats"),
};
