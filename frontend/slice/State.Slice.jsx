import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  listStateService,
  createStateService,
  updateStateService,
  retrieveStateService,
  destroyStateService,
} from "../service/State.Service";

export const listStateThunkApi = createAsyncThunk(
  "state/listStateThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listStateService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list State API",
      );
    }
  },
);

export const createStateThunkApi = createAsyncThunk(
  "state/createStateThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createStateService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in Create State API",
      );
    }
  },
);

export const retrieveStateThunkApi = createAsyncThunk(
  "state/retrieveStateThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveStateService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieveState API",
      );
    }
  },
);

export const updateStateThunkApi = createAsyncThunk(
  "state/updateStateThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateStateService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in updateState API",
      );
    }
  },
);

export const destroyStateThunkApi = createAsyncThunk(
  "state/destroyStateThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyStateService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroyState API",
      );
    }
  },
);

const StateReducer = createSlice({
  name: "state",
  initialState: {
    status: "",
    totalRecords: 0,
    data: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listStateThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listStateThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results){
          state.data = action.payload.results;
          
          state.totalRecords = action.payload.count;
        }
        else{
          state.data = action.payload.data;

        }
      })
      .addCase(listStateThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(createStateThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createStateThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createStateThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveStateThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveStateThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveStateThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateStateThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateStateThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const get_index = state.data.findIndex((singleData) => {
          return singleData.id === action.payload.data.id;
        });
        if (get_index !== -1) {
          state.data[get_index] = action.payload.data;
        }
      })
      .addCase(updateStateThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyStateThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyStateThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
        state.data = state.data.filter(
          (State) => State.id !== action.payload.id,
        );
      })
      .addCase(destroyStateThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

  },
});

export default StateReducer.reducer;
