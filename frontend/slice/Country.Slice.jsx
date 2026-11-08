import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  listCountryService,
  createCountryService,
  updateCountryService,
  retrieveCountryService,
  destroyCountryService,
} from "../service/Country.Service";

export const listCountryThunkApi = createAsyncThunk(
  "country/listCountryThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listCountryService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list country API",
      );
    }
  },
);

export const createCountryThunkApi = createAsyncThunk(
  "country/createCountryThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createCountryService(data);
      return res.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in Create Country API",
      );
    }
  },
);

export const retrieveCountryThunkApi = createAsyncThunk(
  "country/retrieveCountryThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveCountryService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieveCountry API",
      );
    }
  },
);

export const updateCountryThunkApi = createAsyncThunk(
  "country/updateCountryThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateCountryService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in updateCountry API",
      );
    }
  },
);

export const destroyCountryThunkApi = createAsyncThunk(
  "country/destroyCountryThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyCountryService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroyCountry API",
      );
    }
  },
);

const countryReducer = createSlice({
  name: "country",
  initialState: {
    status: "",
    totalRecords: 0,
    data: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listCountryThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listCountryThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results
        }
        else{
          state.data = action.payload.data;
          
        }
        state.totalRecords = action.payload.count;
      })
      .addCase(listCountryThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(createCountryThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createCountryThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createCountryThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveCountryThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveCountryThunkApi.fulfilled, (state) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveCountryThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateCountryThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateCountryThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const index = state.data.findIndex(
          (item) => item.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })
      .addCase(updateCountryThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyCountryThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyCountryThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data = state.data.filter(
          (country) => country.id !== action.payload.id,
        );
        state.totalRecords = state.totalRecords - 1;
      })
      .addCase(destroyCountryThunkApi.rejected, (state, action) => {
        state.status = "rejected";
      });
  },
});

export default countryReducer.reducer;
