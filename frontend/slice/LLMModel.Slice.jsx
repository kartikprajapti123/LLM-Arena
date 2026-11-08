import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listLLMModelService,
  createLLMModelService,
  updateLLMModelService,
  retrieveLLMModelService,
  destroyLLMModelService,
} from "../service/LLMModel.Service";

export const listLLMModelThunkApi = createAsyncThunk(
  "LLMModel/listLLMModelThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listLLMModelService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list LLM Model API",
      );
    }
  },
);

export const createLLMModelThunkApi = createAsyncThunk(
  "LLMModel/createLLMModelThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await createLLMModelService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create LLM Model API",
      );
    }
  },
);

export const updateLLMModelThunkApi = createAsyncThunk(
  "LLMModel/updateLLMModelThunkApi",
  async ({ data, id }, { rejectWithValue }) => {
    try {
      const res = await updateLLMModelService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update LLM Model API",
      );
    }
  },
);

export const retrieveLLMModelThunkApi = createAsyncThunk(
  "LLMModel/retrieveLLMModelThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveLLMModelService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve LLM Model API",
      );
    }
  },
);

export const destroyLLMModelThunkApi = createAsyncThunk(
  "LLMModel/destroyLLMModelThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyLLMModelService(id);
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
const LLMModelReducer = createSlice({
  name: "LLMModel",

  initialState: {
    status: null,
    data: [],
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(listLLMModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(listLLMModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        if (action.payload.results) {
          state.data = action.payload.results;
          state.totalRecords = action.payload.count;
        } else {
          state.data = action.payload.data;
          state.totalRecords = action.payload.data.length;
        }
      })

      .addCase(listLLMModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(createLLMModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(createLLMModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = [action.payload.data, ...state.data];

        state.totalRecords += 1;
      })

      .addCase(createLLMModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(retrieveLLMModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(retrieveLLMModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(retrieveLLMModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(updateLLMModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(updateLLMModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })

      .addCase(updateLLMModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(destroyLLMModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(destroyLLMModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords -= 1;
      })

      .addCase(destroyLLMModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default LLMModelReducer.reducer;
