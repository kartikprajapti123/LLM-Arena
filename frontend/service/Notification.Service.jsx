import api from "../common/CommonAxios.jsx";

export const listNotificationService = (params) => {
  return api.get("/notification/", { params: params });
};

export const retrieveNotificationService = (id) => {
  return api.get(`/notification/${id}/`);
};

export const unreadNotificationCountService = () => {
  return api.get("/notification/unread-count/");
};

export const markNotificationReadService = (id) => {
  return api.patch(`/notification/${id}/mark-read/`);
};

export const markAllNotificationsReadService = () => {
  return api.patch("/notification/mark-all-read/");
};

export const destroyNotificationService = (id) => {
  return api.delete(`/notification/${id}/`);
};

export const clearAllNotificationsService = () => {
  return api.delete("/notification/clear-all/");
};