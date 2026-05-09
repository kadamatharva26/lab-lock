import api from "./client";

export const labRoomsApi = {
  list: () => api.get("/api/lab-rooms").then((r) => r.data),
};
