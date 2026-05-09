import api from "./client";

export const dashboardApi = {
  summary: () => api.get("/api/dashboard/summary").then((r) => r.data),
};
