import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { listLLMProjectModelService,createLLMProjectModelService,updateLLMProjectModelService,retrieveLLMProjectModelService,destroyLLMProjectModelService } from "../service/LLMProjectModel.service";
export const listLLMProjectModelThunkApi = createAsyncThunk(
  "LLMProjectModel/listLLMProjectModelThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listLLMProjectModelService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list LLM Project Model API",
      );
    }
  },
);

export const createLLMProjectModelThunkApi = createAsyncThunk(
  "LLMProjectModel/createLLMProjectModelThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await createLLMProjectModelService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create LLM Project Model API",
      );
    }
  },
);

export const updateLLMProjectModelThunkApi = createAsyncThunk(
  "LLMProjectModel/updateLLMProjectModelThunkApi",
  async ({ data, id }, { rejectWithValue }) => {
    try {
      const res = await updateLLMProjectModelService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update LLM Project Model API",
      );
    }
  },
);

export const retrieveLLMProjectModelThunkApi = createAsyncThunk(
  "LLMProjectModel/retrieveLLMProjectModelThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveLLMProjectModelService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve LLM Project Model API",
      );
    }
  },
);

export const destroyLLMProjectModelThunkApi = createAsyncThunk(
  "LLMProjectModel/destroyLLMProjectModelThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyLLMProjectModelService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroy LLM Project Model API",
      );
    }
  },
);
const LLMProjectModelReducer = createSlice({
  name: "LLMProjectModel",

  initialState: {
    status: null,
    data: [],
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(listLLMProjectModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(listLLMProjectModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        if (action.payload.results) {
          state.data = action.payload.results;
          state.totalRecords = action.payload.count;
        } else {
          state.data = action.payload.data;
          state.totalRecords = action.payload.data.length;
        }
      })

      .addCase(listLLMProjectModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(createLLMProjectModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(createLLMProjectModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = [action.payload.data, ...state.data];

        state.totalRecords += 1;
      })

      .addCase(createLLMProjectModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(retrieveLLMProjectModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(retrieveLLMProjectModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })

      .addCase(retrieveLLMProjectModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(updateLLMProjectModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(updateLLMProjectModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })

      .addCase(updateLLMProjectModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      })

      .addCase(destroyLLMProjectModelThunkApi.pending, (state) => {
        state.status = "pending";
      })

      .addCase(destroyLLMProjectModelThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords -= 1;
      })

      .addCase(destroyLLMProjectModelThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export default LLMProjectModelReducer.reducer;
