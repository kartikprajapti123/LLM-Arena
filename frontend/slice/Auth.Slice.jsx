import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";

import { LoginService,RegisterService,ForgotPasswordService,ChangePasswordService ,OtpVerifyService,OtpResendService, getSingleUserService, updateUserService, ResetPasswordService, LogoutService, adminDashboardService,ownerDashboardService,memberDashboardService} from "../service/Auth.Service";


export const LoginThunkApi = createAsyncThunk(
  "auth/LoginThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await LoginService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in Login API"
      );
    }
  }
);


export const RegisterThunkApi = createAsyncThunk(
  "auth/RegisterThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await RegisterService(data);

      return res.data;
    } catch (error) {
      console.log(error)
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in Register API"
      );
    }
  }
);



export const OtpVerifyThunkApi = createAsyncThunk(
  "auth/OtpVerifyThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await OtpVerifyService(data);

      return res.data;
    } catch (error) {
      console.log(error)
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in OtpVerify API"
      );
    }
  }
);



export const OtpResendThunkApi = createAsyncThunk(
  "auth/OtpResendThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await OtpResendService(data);

      return res.data;
    } catch (error) {
      console.log(error)
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in OtpResendThunkApi API"
      );
    }
  }
);



export const ForgotPasswordThunkApi = createAsyncThunk(
  "auth/ForgotPasswordThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ForgotPasswordService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in ForgotPassword API"
      );
    }
  }
);



export const ChangePasswordThunkApi = createAsyncThunk(
  "auth/ChangePasswordThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ChangePasswordService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in ChangePassword API"
      );
    }
  }
);


export const ResetPasswordThunkApi = createAsyncThunk(
  "auth/ResetPasswordThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ResetPasswordService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in resetPassword API"
      );
    }
  }
);

export const LogoutThunkApi = createAsyncThunk(
  "auth/LogoutThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await LogoutService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in Logout API"
      );
    }
  }
)


export const getSingleUserThunkApi = createAsyncThunk(
  "auth/getSingleUserThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await getSingleUserService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in get single User  API"
      );
    }
  }
);
export const adminDashboardThunkApi = createAsyncThunk(
  "auth/adminDashboardThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await adminDashboardService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in admin dashboard  API"
      );
    }
  }
);

export const ownerDashboardThunkApi = createAsyncThunk(
  "auth/ownerDashboardThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ownerDashboardService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in owner dashboard  API"
      );
    }
  }
);

export const memberDashboardThunkApi = createAsyncThunk(
  "auth/memberDashboardThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await memberDashboardService(data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in member dashboard  API"
      );
    }
  }
);

export const updateUserThunkApi = createAsyncThunk(
  "auth/updateUserThunkApi",
  async ({id,data}, { rejectWithValue }) => {
    try {
      const res = await updateUserService(id,data);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Something went wrong in update User  API"
      );
    }
  }
);


const authReducer=createSlice({
    "name":"auth",
    initialState:{
        "status":null,
        user_detail:null,
    },
    reducers:{},
    extraReducers:((builder)=>{
        builder
        .addCase(LoginThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(LoginThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(LoginThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(RegisterThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(RegisterThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(RegisterThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(OtpVerifyThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(OtpVerifyThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(OtpVerifyThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(OtpResendThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(OtpResendThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(OtpResendThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })



        builder
        .addCase(ForgotPasswordThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(ForgotPasswordThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(ForgotPasswordThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(ChangePasswordThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(ChangePasswordThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(ChangePasswordThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(LogoutThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(LogoutThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(LogoutThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(ResetPasswordThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(ResetPasswordThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(ResetPasswordThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(getSingleUserThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(getSingleUserThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
            state.user_detail=action.payload.data
        })
        .addCase(getSingleUserThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })

        builder
        .addCase(updateUserThunkApi.pending,(state,action)=>{
            state.status="pending"
        })
        .addCase(updateUserThunkApi.fulfilled,(state,action)=>{
            state.status="fulfilled"
        })
        .addCase(updateUserThunkApi.rejected,(state,action)=>{
            state.status="rejected"
        })
        
    })
})


export default authReducer.reducer