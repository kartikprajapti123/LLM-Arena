import api from "../common/CommonAxios.jsx";

export const listStateService = (params) => {
  return api.get("/state/", {params:params});
};
export const createStateService = (data) => {
  return api.post("/state/", data);
};
export const retrieveStateService = (id,data) => {
  return api.get(`/state/${id}/`, data);
};
export const updateStateService = (id,data) => {
  return api.patch(`/state/${id}/`, data);
};
export const destroyStateService = (id,data) => {
  return api.delete(`/state/${id}/`, data);
};
