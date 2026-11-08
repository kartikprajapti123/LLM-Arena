import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listLLMProviderService,
  createLLMProvderService,
  updateLLMProviderService,
  retrieveLLMProviderService,
  destroyLLMProviderService,
} from "../service/LLMProvider.Service";

export const listLLMProviderThunkApi = createAsyncThunk(
  "LLMProvider/listLLMProviderThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listLLMProviderService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list LLM Provider API",
      );
    }
  },
);

export const createLLMProviderThunkApi = createAsyncThunk(
  "LLMProvider/createLLMProviderThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await createLLMProvderService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create LLM Provider API",
      );
    }
  },
);

export const updateLLMProviderThunkApi = createAsyncThunk(
  "LLMProvider/updateLLMProviderThunkApi",
  async ({ data, id }, { rejectWithValue }) => {
    try {
      const res = await updateLLMProviderService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update LLM Provider API",
      );
    }
  },
);

export const retrieveLLMProviderThunkApi = createAsyncThunk(
  "LLMProvider/retrieveLLMProviderThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveLLMProviderService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve LLM Provider API",
      );
    }
  },
);

export const destroyLLMProviderThunkApi = createAsyncThunk(
  "LLMProvider/destroyLLMProviderThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyLLMProviderService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroy LLM Provider API",
      );
    }
  },
);
const LLMProviderReducer = createSlice({
  name: "LLMProvider",

  initialState: {
    status: null,
    data: [],
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(listLLMProviderThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(listLLMProviderThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        if (action.payload.results) {
          state.data = action.payload.results;
          state.totalRecords = action.payload.count;
        } else {
          state.data = action.payload.data;
          state.totalRecords = action.payload.data.length;
        }
      })

      .addCase(listLLMProviderThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(createLLMProviderThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(createLLMProviderThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = [action.payload.data, ...state.data];

        state.totalRecords += 1;
      })

      .addCase(createLLMProviderThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(retrieveLLMProviderThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(retrieveLLMProviderThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(retrieveLLMProviderThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(updateLLMProviderThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(updateLLMProviderThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })

      .addCase(updateLLMProviderThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(destroyLLMProviderThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(destroyLLMProviderThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords -= 1;
      })

      .addCase(destroyLLMProviderThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default LLMProviderReducer.reducer;
