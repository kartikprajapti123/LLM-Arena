import api from "../common/CommonAxios.jsx";

export const listLLMModelService = (params) => {
  return api.get("/llm-model/", {params:params});
};
export const createLLMModelService = (data) => {
  return api.post("/llm-model/", data);
};
export const retrieveLLMModelService = (id,data) => {
  return api.get(`/llm-model/${id}/`, data);
};
export const updateLLMModelService = (id,data) => {
  return api.patch(`/llm-model/${id}/`, data);
};
export const destroyLLMModelService = (id,data) => {
  return api.delete(`/llm-model/${id}/`, data);
};
