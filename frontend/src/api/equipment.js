import api from "./client";

export const equipmentApi = {
  list: (params) => api.get("/api/equipment", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/equipment/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/equipment", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/equipment/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/equipment/${id}`).then((r) => r.data),
};
