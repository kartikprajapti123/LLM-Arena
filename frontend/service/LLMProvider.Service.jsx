import api from "../common/CommonAxios.jsx";

export const listLLMProviderService = (params) => {
  return api.get("/llm-provider/", {params:params});
};
export const createLLMProvderService = (data) => {
  return api.post("/llm-provider/", data);
};
export const retrieveLLMProviderService = (id,data) => {
  return api.get(`/llm-provider/${id}/`, data);
};
export const updateLLMProviderService = (id,data) => {
  return api.patch(`/llm-provider/${id}/`, data);
};
export const destroyLLMProviderService = (id,data) => {
  return api.delete(`/llm-provider/${id}/`, data);
};
