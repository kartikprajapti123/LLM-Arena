import api from "../common/CommonAxios.jsx";

export const listWorkspaceService = (params) => {
  return api.get("/workspace/", { params: params });
};

export const createWorkspaceService = (data) => {
  return api.post("/workspace/", data);
};

export const retrieveWorkspaceService = (id) => {
  return api.get(`/workspace/${id}/`);
};

export const updateWorkspaceService = (id, data) => {
  return api.patch(`/workspace/${id}/`, data);
};

export const destroyWorkspaceService = (id) => {
  return api.delete(`/workspace/${id}/`);
};


export const getSingleWorkspaceService = () => {
  return api.post(`/workspace/get-single-workspace/`);
};

//workspace member
export const listWorkspaceMemberService = (params) => {
  return api.get("/workspace-member/", { params: params });
};

export const createWorkspaceMemberService = (data) => {
  return api.post("/workspace-member/", data);
};

export const retrieveWorkspaceMemberService = (id) => {
  return api.get(`/workspace-member/${id}/`);
};

export const updateWorkspaceMemberService = (id, data) => {
  return api.patch(`/workspace-member/${id}/`, data);
};

export const destroyWorkspaceMemberService = (id) => {
  return api.delete(`/workspace-member/${id}/`);
};

export const createInviteCodeWorkspaceMemberService = (data) => {
  return api.post(`/workspace-member/workspace-member-create-invite-code/`,data);
};


//workspace invite
export const listWorkspaceInviteService = (params) => {
  return api.get("/workspace-invitation/", { params: params });
};

export const createWorkspaceInviteService = (data) => {
  return api.post("/workspace-invitation/", data);
};

export const retrieveWorkspaceInviteService = (id) => {
  return api.get(`/workspace-invitation/${id}/`);
};

export const updateWorkspaceInviteService = (id, data) => {
  return api.patch(`/workspace-invitation/${id}/`, data);
};

export const destroyWorkspaceInviteService = (id) => {
  return api.delete(`/workspace-invitation/${id}/`);
};


// Credential
export const listWorkspaceCredentialService = (params) => {
  return api.get("/workspace-credential/", { params: params });
};

export const createWorkspaceCredentialService = (data) => {
  return api.post("/workspace-credential/", data);
};

export const retrieveWorkspaceCredentialService = (id) => {
  return api.get(`/workspace-credential/${id}/`);
};

export const updateWorkspaceCredentialService = (id, data) => {
  return api.patch(`/workspace-credential/${id}/`, data);
};

export const destroyWorkspaceCredentialService = (id) => {
  return api.delete(`/workspace-credential/${id}/`);
};
