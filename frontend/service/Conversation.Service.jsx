import api from "../common/CommonAxios.jsx";

// Conversation Services

export const listConversationService = (params) => {
  return api.get("/conversations/", { params });
};

export const createConversationService = (data) => {
  return api.post("/conversations/", data);
};

export const retrieveConversationService = (id) => {
  return api.get(`/conversations/${id}/`);
};

export const updateConversationService = (id, data) => {
  return api.patch(`/conversations/${id}/`, data);
};

export const destroyConversationService = (id) => {
  return api.delete(`/conversations/${id}/`);
};

export const createDirectConversationService = (data) => {
  return api.post("/conversations/direct/", data);
};

// Chat Message Services

export const listConversationMessagesService = (id, params) => {
  return api.get(`/conversations/${id}/messages/`, { params });
};

export const createConversationMessageService = (id, data) => {
  return api.post(`/conversations/${id}/send-message/`, data);
};

export const markConversationReadService = (id) => {
  return api.post(`/conversations/${id}/mark-read/`);
};

export const unreadCountService = () => {
  return api.post(`/conversations/unread-count/`);
};