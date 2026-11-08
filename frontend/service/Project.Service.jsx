import api from "../common/CommonAxios";


export const listProjectService=(params)=>{
    return api.get("/project/",{params:params})
}


export const createProjectService=(data)=>{
    return api.post("/project/",data)
}

export const updateProjectService=(id,data)=>{
    return api.patch(`/project/${id}/`,data)
}

export const retrieveProjectService=(id)=>{
    return api.get(`/project/${id}/`)
}


export const destroyProjectService=(id)=>{
    return api.delete(`/project/${id}/`)
}

export const userCheckService=(data)=>{
    return api.post("/project/user-check/",data)
}