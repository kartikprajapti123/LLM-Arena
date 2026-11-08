import api from "../common/CommonAxios.jsx";

export const listComparisonService = (params) => {
  return api.get("/comparison/", {params:params});
};
export const createComparisonService = (data) => {
  return api.post("/comparison/", data);
};
export const retrieveComparisonService = (id,data) => {
  return api.get(`/comparison/${id}/`, data);
};
export const updateComparisonService = (id,data) => {
  return api.patch(`/comparison/${id}/`, data);
};
export const destroyComparisonService = (id,data) => {
  return api.delete(`/comparison/${id}/`, data);
};

export const ComparisonRunService = (data) => {
  return api.post(`/comparison/run/`, data);
};
