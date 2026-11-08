import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  listNotificationService,
  retrieveNotificationService,
  unreadNotificationCountService,
  markNotificationReadService,
  markAllNotificationsReadService,
  destroyNotificationService,
  clearAllNotificationsService,
} from "../service/Notification.Service";

const RECENT_LIMIT = 5;

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message;

// Supports DRF pagination ({count, results}), plain arrays and {data, count}.
const normalizeList = (payload) => {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  if (Array.isArray(payload?.results)) {
    return { items: payload.results, total: payload.count ?? payload.results.length };
  }
  const items = payload?.data ?? [];
  return { items, total: payload?.count ?? items.length };
};

// ==================== THUNKS ====================

// Full, paginated list used by the Notification page.
export const listNotificationThunkApi = createAsyncThunk(
  "notification/list",
  async (params = {}, thunkAPI) => {
    try {
      const res = await listNotificationService(params);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

// Latest items for the header dropdown (kept separate from the page list).
export const recentNotificationThunkApi = createAsyncThunk(
  "notification/recent",
  async (_, thunkAPI) => {
    try {
      const res = await listNotificationService({
        page: 1,
        pageSize: RECENT_LIMIT,
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const retrieveNotificationThunkApi = createAsyncThunk(
  "notification/retrieve",
  async (id, thunkAPI) => {
    try {
      const res = await retrieveNotificationService(id);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const unreadNotificationCountThunkApi = createAsyncThunk(
  "notification/unreadCount",
  async (_, thunkAPI) => {
    try {
      const res = await unreadNotificationCountService();
      console.log(res.data)
      return res.data;
    } catch (error) {
      console.log(error)
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const markNotificationReadThunkApi = createAsyncThunk(
  "notification/markRead",
  async (id, thunkAPI) => {
    try {
      const res = await markNotificationReadService(id);
      return { id, response: res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const markAllNotificationsReadThunkApi = createAsyncThunk(
  "notification/markAllRead",
  async (_, thunkAPI) => {
    try {
      const res = await markAllNotificationsReadService();
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const destroyNotificationThunkApi = createAsyncThunk(
  "notification/destroy",
  async (id, thunkAPI) => {
    try {
      const res = await destroyNotificationService(id);
      return { id, response: res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const clearAllNotificationsThunkApi = createAsyncThunk(
  "notification/clearAll",
  async (_, thunkAPI) => {
    try {
      const res = await clearAllNotificationsService();
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  },
);

// ==================== INITIAL STATE ====================

const initialState = {
  status: "",
  totalRecords: 0,
  data: [], // paginated list for the Notification page
  recent: [], // latest few for the header dropdown
  unreadCount: 0,
  selectedNotification: null,
  lastReceivedId: null, // changes whenever a live notification arrives
  error: null,
};

// ==================== SLICE ====================

const notificationReducer = createSlice({
  name: "notification",
  initialState,

  reducers: {
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },

    clearNotificationError: (state) => {
      state.error = null;
    },

    // Dispatched by the WebSocket hook when a notification arrives.
    receiveNotification: (state, action) => {
      const item = action.payload;
      if (!item?.id) return;
      if (state.recent.some((n) => n.id === item.id)) return;

      state.recent = [item, ...state.recent].slice(0, RECENT_LIMIT);
      if (!item.is_read) state.unreadCount += 1;
      state.lastReceivedId = item.id;
    },
  },

  extraReducers: (builder) => {
    builder

      // ---------- LIST ----------
      .addCase(listNotificationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(listNotificationThunkApi.fulfilled, (state, action) => {
        const { items, total } = normalizeList(action.payload);
        state.status = "fulfilled";
        state.data = items;
        state.totalRecords = total;
        state.error = null;
      })
      .addCase(listNotificationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload || action.error.message;
      })

      // ---------- RECENT (header) ----------
      .addCase(recentNotificationThunkApi.fulfilled, (state, action) => {
        state.recent = normalizeList(action.payload).items.slice(0, RECENT_LIMIT);
      })
      .addCase(recentNotificationThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // ---------- RETRIEVE ----------
      .addCase(retrieveNotificationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(retrieveNotificationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.selectedNotification = action.payload.data ?? action.payload;
        state.error = null;
      })
      .addCase(retrieveNotificationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload || action.error.message;
      })

      // ---------- UNREAD COUNT ----------
      .addCase(unreadNotificationCountThunkApi.fulfilled, (state, action) => {
        console.log(action.payload.data)
        state.unreadCount =
          action.payload.data?.unread_count
          
      })
      .addCase(unreadNotificationCountThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // ---------- MARK ONE AS READ ----------
      .addCase(markNotificationReadThunkApi.fulfilled, (state, action) => {
        const { id, response } = action.payload;
        const updated = response?.data ?? response?.notification ?? response ?? {};

        // The item can live in the page list, the header list, or only in
        // selectedNotification (detail page), so check all three.
        let wasUnread = false;

        [state.data, state.recent].forEach((list) => {
          const item = list.find((n) => n.id === id);
          if (item && !item.is_read) {
            wasUnread = true;
            item.is_read = true;
            item.read_at = updated.read_at ?? null;
          }
        });

        if (state.selectedNotification?.id === id) {
          if (!state.selectedNotification.is_read) wasUnread = true;
          state.selectedNotification = {
            ...state.selectedNotification,
            ...updated,
            is_read: true,
          };
        }

        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationReadThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // ---------- MARK ALL AS READ ----------
      .addCase(markAllNotificationsReadThunkApi.fulfilled, (state) => {
        [state.data, state.recent].forEach((list) =>
          list.forEach((n) => {
            n.is_read = true;
          }),
        );
        if (state.selectedNotification) {
          state.selectedNotification.is_read = true;
        }
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsReadThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // ---------- DELETE ONE ----------
      .addCase(destroyNotificationThunkApi.fulfilled, (state, action) => {
        const { id } = action.payload;

        const copies = [
          ...state.data,
          ...state.recent,
          ...(state.selectedNotification ? [state.selectedNotification] : []),
        ].filter((n) => n.id === id);

        if (copies.some((n) => !n.is_read)) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        if (state.data.some((n) => n.id === id)) {
          state.totalRecords = Math.max(0, state.totalRecords - 1);
        }

        state.data = state.data.filter((n) => n.id !== id);
        state.recent = state.recent.filter((n) => n.id !== id);

        if (state.selectedNotification?.id === id) {
          state.selectedNotification = null;
        }
        state.error = null;
      })
      .addCase(destroyNotificationThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      // ---------- CLEAR ALL ----------
      .addCase(clearAllNotificationsThunkApi.fulfilled, (state) => {
        state.data = [];
        state.recent = [];
        state.totalRecords = 0;
        state.unreadCount = 0;
        state.selectedNotification = null;
        state.error = null;
      })
      .addCase(clearAllNotificationsThunkApi.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  clearSelectedNotification,
  clearNotificationError,
  receiveNotification,
} = notificationReducer.actions;

export default notificationReducer.reducer;