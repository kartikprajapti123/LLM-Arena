import api from "../common/CommonAxios";


export const LoginService=(data)=>{
    return api.post("/login/",data)
}

export const RegisterService=(data)=>{
    return api.post("/register/",data)
}


export const OtpVerifyService=(data)=>{
    return api.post("/otp-verify/",data)
}


export const OtpResendService=(data)=>{
    return api.post("/resend-otp/",data)
}

export const ForgotPasswordService=(data)=>{
    return api.post("/forgot-password/",data)
}

export const ChangePasswordService=(data)=>{
    return api.post(`/change-password/`,data)
}

export const ResetPasswordService=(data)=>{
    return api.post(`/reset-password/`,data)
}

export const getSingleUserService=()=>{
    return api.post(`/user/get-single-user/`)
}


export const adminDashboardService=()=>{
    return api.post(`/user/admin-dashboard/`)
}

export const ownerDashboardService=()=>{
    return api.post(`/user/owner-dashboard/`)
}


export const memberDashboardService=()=>{
    return api.post(`/user/member-dashboard/`)
}


export const LogoutService=(data)=>{
    return api.post(`/logout/`,data)
}

export const updateUserService=(id,data)=>{
    return api.patch(`/user/${id}/`,data)
}