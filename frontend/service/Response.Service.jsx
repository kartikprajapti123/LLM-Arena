import api from "../common/CommonAxios.jsx";

export const listResponseService = (params) => {
  return api.get("/Response/", {params:params});
};
export const createResponseService = (data) => {
  return api.post("/Response/", data);
};
export const retrieveResponseService = (id,data) => {
  return api.get(`/Response/${id}/`, data);
};
export const updateResponseService = (id,data) => {
  return api.patch(`/Response/${id}/`, data);
};
export const destroyResponseService = (id,data) => {
  return api.delete(`/Response/${id}/`, data);
};
