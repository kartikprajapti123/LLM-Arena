import api from "../common/CommonAxios.jsx";

export const listLLMProjectModelService = (params) => {
  return api.get("/llm-project-model/", {params:params});
};
export const createLLMProjectModelService = (data) => {
  return api.post("/llm-project-model/", data);
};
export const retrieveLLMProjectModelService = (id,data) => {
  return api.get(`/llm-project-model/${id}/`, data);
};
export const updateLLMProjectModelService = (id,data) => {
  return api.patch(`/llm-project-model/${id}/`, data);
};
export const destroyLLMProjectModelService = (id,data) => {
  return api.delete(`/llm-project-model/${id}/`, data);
};
