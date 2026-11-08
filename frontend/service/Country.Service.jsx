import api from "../common/CommonAxios.jsx";

export const listCountryService = (params) => {
  return api.get("/country/", {params:params});
};
export const createCountryService = (data) => {
  return api.post("/country/", data);
};
export const retrieveCountryService = (id,data) => {
  return api.get(`/country/${id}/`, data);
};
export const updateCountryService = (id,data) => {
  return api.patch(`/country/${id}/`, data);
};
export const destroyCountryService = (id,data) => {
  return api.delete(`/country/${id}/`, data);
};
