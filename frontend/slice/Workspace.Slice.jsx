import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  listWorkspaceService,
  listWorkspaceInviteService,
  listWorkspaceMemberService,
  createWorkspaceService,
  createWorkspaceInviteService,
  createWorkspaceMemberService,
  updateWorkspaceInviteService,
  updateWorkspaceMemberService,
  updateWorkspaceService,
  retrieveWorkspaceInviteService,
  retrieveWorkspaceMemberService,
  retrieveWorkspaceService,
  destroyWorkspaceService,
  destroyWorkspaceInviteService,
  destroyWorkspaceMemberService,
  getSingleWorkspaceService,
  createInviteCodeWorkspaceMemberService,
  listWorkspaceCredentialService,
  createWorkspaceCredentialService,
  updateWorkspaceCredentialService,
  retrieveWorkspaceCredentialService,
  destroyWorkspaceCredentialService
} from "../service/Workspace.Service";
import { getSingleUserService } from "../service/Auth.Service";

export const listWorkspaceThunkApi = createAsyncThunk(
  "workspace/listWorkspaceThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listWorkspaceService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in list workspace API",
      );
    }
  },
);

export const createWorkspaceThunkApi = createAsyncThunk(
  "workspace/createWorkspaceThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createWorkspaceService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in create workspace API",
      );
    }
  },
);

export const retrieveWorkspaceThunkApi = createAsyncThunk(
  "workspace/retrieveWorkspaceThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveWorkspaceService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in retrieve workspace API",
      );
    }
  },
);

export const updateWorkspaceThunkApi = createAsyncThunk(
  "workspace/updateWorkspaceThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateWorkspaceService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in update workspace API",
      );
    }
  },
);

export const destroyWorkspaceThunkApi = createAsyncThunk(
  "workspace/destroyWorkspaceThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyWorkspaceService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in destroy workspace API",
      );
    }
  },
);

export const getSingleWorkspaceThunkApi = createAsyncThunk(
  "workspace/getSingleWorkspaceThunkApi",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getSingleWorkspaceService();
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in get Single workspace API",
      );
    }
  },
);

export const listWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/listWorkspaceMemberThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listWorkspaceMemberService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in list workspaceMember API",
      );
    }
  },
);

export const createWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/createWorkspaceMemberThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createWorkspaceMemberService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in create workspaceMember API",
      );
    }
  },
);

export const retrieveWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/retrieveWorkspaceMemberThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveWorkspaceMemberService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in retrieve workspaceMember API",
      );
    }
  },
);

export const updateWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/updateWorkspaceMemberThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateWorkspaceMemberService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in update workspaceMember API",
      );
    }
  },
);

export const destroyWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/destroyWorkspaceMemberThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyWorkspaceMemberService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in destroy workspaceMember API",
      );
    }
  },
);

export const createInviteCodeWorkspaceMemberThunkApi = createAsyncThunk(
  "workspaceMember/createInviteCodeWorkspaceMemberThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createInviteCodeWorkspaceMemberService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in destroy createInviteCodeWorkspaceMember API",
      );
    }
  },
);

export const listWorkspaceInviteThunkApi = createAsyncThunk(
  "workspaceInvite/listWorkspaceInviteThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listWorkspaceInviteService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in list workspaceInvite API",
      );
    }
  },
);

export const createWorkspaceInviteThunkApi = createAsyncThunk(
  "workspaceInvite/createWorkspaceInviteThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createWorkspaceInviteService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in create workspaceInvite API",
      );
    }
  },
);

export const retrieveWorkspaceInviteThunkApi = createAsyncThunk(
  "workspaceInvite/retrieveWorkspaceInviteThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveWorkspaceInviteService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in retrieve workspaceInvite API",
      );
    }
  },
);

export const updateWorkspaceInviteThunkApi = createAsyncThunk(
  "workspaceInvite/updateWorkspaceInviteThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateWorkspaceInviteService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in update workspaceInvite API",
      );
    }
  },
);

export const destroyWorkspaceInviteThunkApi = createAsyncThunk(
  "workspaceInvite/destroyWorkspaceInviteThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyWorkspaceInviteService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in destroy workspaceInvite API",
      );
    }
  },
);



export const listWorkspaceCredentialThunkApi = createAsyncThunk(
  "workspaceCredential/listWorkspaceCredentialThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listWorkspaceCredentialService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in list workspaceCredential API",
      );
    }
  },
);

export const createWorkspaceCredentialThunkApi = createAsyncThunk(
  "workspaceCredential/createWorkspaceCredentialThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createWorkspaceCredentialService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in create workspaceCredential API",
      );
    }
  },
);

export const retrieveWorkspaceCredentialThunkApi = createAsyncThunk(
  "workspaceCredential/retrieveWorkspaceCredentialThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveWorkspaceCredentialService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in retrieve workspaceCredential API",
      );
    }
  },
);

export const updateWorkspaceCredentialThunkApi = createAsyncThunk(
  "workspaceCredential/updateWorkspaceCredentialThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateWorkspaceCredentialService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in update workspaceCredential API",
      );
    }
  },
);

export const destroyWorkspaceCredentialThunkApi = createAsyncThunk(
  "workspaceCredential/destroyWorkspaceCredentialThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyWorkspaceCredentialService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data ||
          error?.message ||
          "Something went wrong in destroy workspaceCredential API",
      );
    }
  },
);

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    status: null,
    data: [],
    count: 0,
    singleWorkspace:{},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results;
          state.count = action.payload.count;
        } else {
          state.data = action.payload.results;
        }
      })
      .addCase(listWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    

    builder
      .addCase(createWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const index = state.data.findIndex(
          (element) => element.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })
      .addCase(updateWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.count = state.count - 1;

        state.data = state.data.filter(
          (element) => element.id !== action.payload.id,
        );
      })
      .addCase(destroyWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

      builder
      .addCase(getSingleWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(getSingleWorkspaceThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        console.log(action.payload)
        state.singleWorkspace = action.payload.data
      })
      .addCase(getSingleWorkspaceThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});


const workspaceMemberSlice = createSlice({
  name: "workspaceMember",
  initialState: {
    status: null,
    data: [],
    count: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results;
          state.count = action.payload.count;
        } else {
          state.data = action.payload.results;
        }
      })
      .addCase(listWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(createWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const index = state.data.findIndex(
          (element) => element.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })
      .addCase(updateWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.count = state.count - 1;

        state.data = state.data.filter(
          (element) => element.id !== action.payload.id,
        );
      })
      .addCase(destroyWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(createInviteCodeWorkspaceMemberThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createInviteCodeWorkspaceMemberThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(createInviteCodeWorkspaceMemberThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});



const workspaceInviteSlice = createSlice({
  name: "workspaceInvite",
  initialState: {
    status: null,
    data: [],
    count: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listWorkspaceInviteThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listWorkspaceInviteThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results;
          state.count = action.payload.count;
        } else {
          state.data = action.payload.results;
        }
      })
      .addCase(listWorkspaceInviteThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(createWorkspaceInviteThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createWorkspaceInviteThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createWorkspaceInviteThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateWorkspaceInviteThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateWorkspaceInviteThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const index = state.data.findIndex(
          (element) => element.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })
      .addCase(updateWorkspaceInviteThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveWorkspaceThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveWorkspaceInviteThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveWorkspaceInviteThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyWorkspaceInviteThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyWorkspaceInviteThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.count = state.count - 1;

        state.data = state.data.filter(
          (element) => element.id !== action.payload.id,
        );
      })
      .addCase(destroyWorkspaceInviteThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

const workspaceCredentialSlice = createSlice({
  name: "workspaceCredential",
  initialState: {
    status: null,
    data: [],
    count: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listWorkspaceCredentialThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(listWorkspaceCredentialThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        if (action.payload.results) {
          state.data = action.payload.results;
          state.count = action.payload.count;
        } else {
          state.data = action.payload.results;
        }
      })
      .addCase(listWorkspaceCredentialThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(createWorkspaceCredentialThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createWorkspaceCredentialThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.data.unshift(action.payload.data);
      })
      .addCase(createWorkspaceCredentialThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(updateWorkspaceCredentialThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateWorkspaceCredentialThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        const index = state.data.findIndex(
          (element) => element.id === action.payload.data.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload.data;
        }
      })
      .addCase(updateWorkspaceCredentialThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(retrieveWorkspaceCredentialThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(retrieveWorkspaceCredentialThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(retrieveWorkspaceCredentialThunkApi.rejected, (state) => {
        state.status = "rejected";
      });

    builder
      .addCase(destroyWorkspaceCredentialThunkApi.pending, (state) => {
        state.status = "pending";
      })
      .addCase(destroyWorkspaceCredentialThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.count = state.count - 1;

        state.data = state.data.filter(
          (element) => element.id !== action.payload.id,
        );
      })
      .addCase(destroyWorkspaceCredentialThunkApi.rejected, (state) => {
        state.status = "rejected";
      });
  },
});


export const workspaceReducer = workspaceSlice.reducer;
export const workspaceMemberReducer = workspaceMemberSlice.reducer;
export const workspaceInviteReducer = workspaceInviteSlice.reducer;
export const workspaceCredentialReducer = workspaceCredentialSlice.reducer;

