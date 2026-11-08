import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  listProjectService,
  createProjectService,
  updateProjectService,
  retrieveProjectService,
  destroyProjectService,
  userCheckService,
} from "../service/Project.Service";

// List Projects
export const listProjectThunkApi = createAsyncThunk(
  "project/listProjectThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listProjectService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list project API"
      );
    }
  }
);

// Create Project
export const createProjectThunkApi = createAsyncThunk(
  "project/createProjectThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createProjectService(data);
      return res.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in Create Project API"
      );
    }
  }
);

// Retrieve Single Project
export const retrieveProjectThunkApi = createAsyncThunk(
  "project/retrieveProjectThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveProjectService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieveProject API"
      );
    }
  }
);

// Update Project
export const updateProjectThunkApi = createAsyncThunk(
  "project/updateProjectThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateProjectService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in updateProject API"
      );
    }
  }
);

// Delete Project
export const destroyProjectThunkApi = createAsyncThunk(
  "project/destroyProjectThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyProjectService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroyProject API"
      );
    }
  }
);

export const userCheckThunkApi=createAsyncThunk(
  "project/userCheckThunkApi",
  async (data,{ rejectWithValue })=>{
    try{
      const res=userCheckService(data)
      return res.data
    }
    catch(error){
      return rejectWithValue(
         error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in userCheck API"
      )
    }
  }
)

const projectSlice = createSlice({
  name: "project",
  initialState: {
    status: "",
    totalRecords: 0,
    count: 0,
    data: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // List Projects
      .addCase(listProjectThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listProjectThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results;
        } else {
          state.data = action.payload.data || [];
        }
        state.totalRecords = action.payload.count || 0;
        state.count = action.payload.count || 0;
      })
      .addCase(listProjectThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      // Create Project
      .addCase(createProjectThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createProjectThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const newProject = action.payload.data || action.payload;
        state.data.unshift(newProject);
        state.totalRecords += 1;
        state.count += 1;
      })
      .addCase(createProjectThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      // Retrieve Project
      .addCase(retrieveProjectThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveProjectThunkApi.fulfilled, (state) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveProjectThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(userCheckThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(userCheckThunkApi.fulfilled, (state) => {
        state.status = "fulfilled";
      })
      .addCase(userCheckThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      // Update Project
      .addCase(updateProjectThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateProjectThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const updatedItem = action.payload.data || action.payload;
        const index = state.data.findIndex((item) => item.id === updatedItem.id);

        if (index !== -1) {
          state.data[index] = updatedItem;
        }
      })
      .addCase(updateProjectThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      // Delete Project
      .addCase(destroyProjectThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyProjectThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const deletedId = action.payload.id || action.meta.arg;
        state.data = state.data.filter((project) => project.id !== deletedId);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
        state.count = Math.max(0, state.count - 1);
      })
      .addCase(destroyProjectThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default projectSlice.reducer;