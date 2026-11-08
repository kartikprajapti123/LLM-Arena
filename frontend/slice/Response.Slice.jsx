import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listResponseService,
  createResponseService,
  updateResponseService,
  retrieveResponseService,
  destroyResponseService,
} from "../service/Response.Service";

export const listResponseThunkApi = createAsyncThunk(
  "response/listResponseThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listResponseService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list Response API",
      );
    }
  },
);

export const createResponseThunkApi = createAsyncThunk(
  "response/createResponseThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await createResponseService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create Response API",
      );
    }
  },
);

export const updateResponseThunkApi = createAsyncThunk(
  "response/updateResponseThunkApi",
  async ({ data, id }, { rejectWithValue }) => {
    try {
      const res = await updateResponseService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update Response API",
      );
    }
  },
);

export const retrieveResponseThunkApi = createAsyncThunk(
  "response/retrieveResponseThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveResponseService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve Response API",
      );
    }
  },
);

export const destroyResponseThunkApi = createAsyncThunk(
  "response/destroyResponseThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyResponseService(id);
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
const ResponseReducer = createSlice({
  name: "response",

  initialState: {
    status: null,
    data: [],
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(listResponseThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(listResponseThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        if (action.payload.results) {
          state.data = action.payload.results;
          state.totalRecords = action.payload.count;
        } else {
          state.data = action.payload.data;
          state.totalRecords = action.payload.data.length;
        }
      })

      .addCase(listResponseThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(createResponseThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(createResponseThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = [action.payload.data, ...state.data];

        state.totalRecords += 1;
      })

      .addCase(createResponseThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(retrieveResponseThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(retrieveResponseThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(retrieveResponseThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(updateResponseThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(updateResponseThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })

      .addCase(updateResponseThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(destroyResponseThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(destroyResponseThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords -= 1;
      })

      .addCase(destroyResponseThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default ResponseReducer.reducer;
