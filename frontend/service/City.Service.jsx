import api from "../common/CommonAxios.jsx";

export const listCityService = (params) => {
  return api.get("/city/", {params:params});
};
export const createCityService = (data) => {
  return api.post("/city/", data);
};
export const retrieveCityService = (id,data) => {
  return api.get(`/city/${id}/`, data);
};
export const updateCityService = (id,data) => {
  return api.patch(`/city/${id}/`, data);
};
export const destroyCityService = (id,data) => {
  return api.delete(`/city/${id}/`, data);
};
