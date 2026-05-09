import api from "./client";

export const bookingsApi = {
  list: (params) => api.get("/api/bookings", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/bookings/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/bookings", data).then((r) => r.data),
  transition: (id, body) => api.patch(`/api/bookings/${id}/status`, body).then((r) => r.data),
};
