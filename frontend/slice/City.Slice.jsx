import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  listCityService,
  createCityService,
  updateCityService,
  retrieveCityService,
  destroyCityService,
} from "../service/City.Service";

export const listCityThunkApi = createAsyncThunk(
  "city/listCityThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listCityService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list City API",
      );
    }
  },
);

export const createCityThunkApi = createAsyncThunk(
  "city/createCityThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createCityService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in Create City API",
      );
    }
  },
);

export const retrieveCityThunkApi = createAsyncThunk(
  "city/retrieveCityThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveCityService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieveCity API",
      );
    }
  },
);

export const updateCityThunkApi = createAsyncThunk(
  "city/updateCityThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateCityService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in updateCity API",
      );
    }
  },
);

export const destroyCityThunkApi = createAsyncThunk(
  "city/destroyCityThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyCityService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroyCity API",
      );
    }
  },
);

const cityReducer = createSlice({
  name: "city",
  initialState: {
    status: "",
    totalRecords: 0,
    data: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listCityThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listCityThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results){
          state.data = action.payload.results;
          
        }
        else{
          state.data = action.payload.data;

        }
        state.totalRecords = action.payload.count;
      })
      .addCase(listCityThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(createCityThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createCityThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createCityThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveCityThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveCityThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveCityThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateCityThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateCityThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const get_index = state.data.findIndex((singleData) => {
          return singleData.id === action.payload.data.id;
        });
        if (get_index !== -1) {
          state.data[get_index] = action.payload.data;
        }
      })
      .addCase(updateCityThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyCityThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyCityThunkApi.fulfilled, (state,action) => {
        state.status = "fulfilled";
        state.data = state.data.filter(
          (State) => State.id !== action.payload.id,
        );
      })
      .addCase(destroyCityThunkApi.rejected, (state,action) => {
        state.status = "rejected";
      });

  },
});

export default cityReducer.reducer;
