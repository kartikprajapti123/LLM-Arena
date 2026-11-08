import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
// import {
//   listComparisonService,
//   createComparisonService,
//   updateComparisonService,
//   retrieveComparisonService,
//   destroyComparisonService,
// } from "../service/Comparison.Service.jsx";

import {
  listComparisonService,
  createComparisonService,
  updateComparisonService,
  retrieveComparisonService,
  destroyComparisonService,
  ComparisonRunService,
} from "../service/Comparsion.Service.jsx";

export const listComparisonThunkApi = createAsyncThunk(
  "comparison/listComparisonThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listComparisonService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list Comparison API",
      );
    }
  },
);

export const createComparisonThunkApi = createAsyncThunk(
  "comparison/createComparisonThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await createComparisonService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create Comparison API",
      );
    }
  },
);

export const updateComparisonThunkApi = createAsyncThunk(
  "comparison/updateComparisonThunkApi",
  async ({ data, id }, { rejectWithValue }) => {
    try {
      const res = await updateComparisonService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update Comparison API",
      );
    }
  },
);

export const retrieveComparisonThunkApi = createAsyncThunk(
  "comparison/retrieveComparisonThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveComparisonService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve Comparison API",
      );
    }
  },
);

export const destroyComparisonThunkApi = createAsyncThunk(
  "comparison/destroyComparisonThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyComparisonService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroy LLM Model API",
      );
    }
  },
);

export const ComparisonRunThunkApi = createAsyncThunk(
  "comparison/ComparisonRunThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ComparisonRunService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in Comparison run API",
      );
    }
  },
);
const ComparisonReducer = createSlice({
  name: "comparison",

  initialState: {
    status: null,
    data: [],
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(listComparisonThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(listComparisonThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        if (action.payload.results) {
          state.data = action.payload.results;
          state.totalRecords = action.payload.count;
        } else {
          state.data = action.payload.data;
          state.totalRecords = action.payload.data.length;
        }
      })

      .addCase(listComparisonThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(createComparisonThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(createComparisonThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = [action.payload.data, ...state.data];

        state.totalRecords += 1;
      })

      .addCase(createComparisonThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(retrieveComparisonThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(retrieveComparisonThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(retrieveComparisonThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(updateComparisonThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(updateComparisonThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })

      .addCase(updateComparisonThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(destroyComparisonThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(destroyComparisonThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords -= 1;
      })

      .addCase(destroyComparisonThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(ComparisonRunThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(ComparisonRunThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(ComparisonRunThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default ComparisonReducer.reducer;
