import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  listConversationService,
  createConversationService,
  updateConversationService,
  retrieveConversationService,
  destroyConversationService,
  createDirectConversationService,
  listConversationMessagesService,
  createConversationMessageService,
  markConversationReadService,
  unreadCountService,
} from "../service/Conversation.Service";

// List Conversations
export const listConversationThunkApi = createAsyncThunk(
  "conversation/listConversationThunkApi",
  async (params, { rejectWithValue }) => {
    try {
      const res = await listConversationService(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list conversation API",
      );
    }
  },
);

// Create Conversation
export const createConversationThunkApi = createAsyncThunk(
  "conversation/createConversationThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createConversationService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create conversation API",
      );
    }
  },
);

// Retrieve Conversation
export const retrieveConversationThunkApi = createAsyncThunk(
  "conversation/retrieveConversationThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await retrieveConversationService(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in retrieve conversation API",
      );
    }
  },
);

// Update Conversation
export const updateConversationThunkApi = createAsyncThunk(
  "conversation/updateConversationThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateConversationService(id, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in update conversation API",
      );
    }
  },
);

// Destroy Conversation
export const destroyConversationThunkApi = createAsyncThunk(
  "conversation/destroyConversationThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await destroyConversationService(id);
      return {
        id,
        ...res.data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in destroy conversation API",
      );
    }
  },
);

// Create or Retrieve Direct Conversation
export const createDirectConversationThunkApi = createAsyncThunk(
  "conversation/createDirectConversationThunkApi",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createDirectConversationService(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in direct conversation API",
      );
    }
  },
);

// List Conversation Messages
export const listConversationMessagesThunkApi = createAsyncThunk(
  "conversation/listConversationMessagesThunkApi",
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const res = await listConversationMessagesService(id, params);
      return {
        conversationId: id,
        response: res.data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in list conversation messages API",
      );
    }
  },
);

// Create Conversation Message
export const createConversationMessageThunkApi = createAsyncThunk(
  "conversation/createConversationMessageThunkApi",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await createConversationMessageService(id, data);
      return {
        conversationId: id,
        response: res.data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in create conversation message API",
      );
    }
  },
);

// Mark Conversation as Read
export const markConversationReadThunkApi = createAsyncThunk(
  "conversation/markConversationReadThunkApi",
  async (id, { rejectWithValue }) => {
    try {
      const res = await markConversationReadService(id);
      return {
        conversationId: id,
        response: res.data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in mark conversation read API",
      );
    }
  },
);

export const unReadCountThunkApi = createAsyncThunk(
  "conversation/unReadCountThunkApi",
  async (_, { rejectWithValue }) => {
    try {
      console.log("unread chat called ")
      const res = await unreadCountService();
      return res.data
    } catch (error) {
      console.log("unread chat error ",error)
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong in unreadCount conversation read API",
      );
    }
  },
);

const conversationReducer = createSlice({
  name: "conversation",

  initialState: {
    status: "",
    messageStatus: "",
    totalRecords: 0,
    data: [],
    currentConversation: null,
    messages: [],
    totalMessages: 0,
    error: null,
  },

  reducers: {
    // Add a message received through WebSocket.
    addConversationMessage: (state, action) => {
      const message = action.payload;

      const exists = state.messages.some((item) => item.id === message.id);

      if (!exists) {
        state.messages.push(message);
        state.totalMessages += 1;
      }

      const conversation = state.data.find(
        (item) => String(item.id) === String(message.conversation),
      );

      if (conversation) {
        conversation.last_message = message;
      }
    },

    // Replace messages when switching conversations.
    clearConversationMessages: (state) => {
      state.messages = [];
      state.totalMessages = 0;
    },

    // Clear the selected conversation.
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },

    clearConversationError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // List Conversations
      .addCase(listConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(listConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const payload = action.payload;

        if (Array.isArray(payload.results)) {
          state.data = payload.results;
        } else if (Array.isArray(payload.data)) {
          state.data = payload.data;
        } else {
          state.data = [];
        }

        state.totalRecords = payload.count ?? state.data.length;
      })
      .addCase(listConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // Create Conversation
      .addCase(createConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(createConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const conversation = action.payload.data;

        if (conversation) {
          const exists = state.data.some((item) => item.id === conversation.id);

          if (!exists) {
            state.data.unshift(conversation);
            state.totalRecords += 1;
          }

          state.currentConversation = conversation;
        }
      })
      .addCase(createConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // Retrieve Conversation
      .addCase(retrieveConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(retrieveConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.currentConversation = action.payload.data;
      })
      .addCase(retrieveConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      .addCase(unReadCountThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(unReadCountThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";
      })
      .addCase(unReadCountThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // Update Conversation
      .addCase(updateConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(updateConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const conversation = action.payload.data;

        if (conversation) {
          const index = state.data.findIndex(
            (item) => item.id === conversation.id,
          );

          if (index !== -1) {
            state.data[index] = conversation;
          }

          if (state.currentConversation?.id === conversation.id) {
            state.currentConversation = conversation;
          }
        }
      })
      .addCase(updateConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // Destroy Conversation
      .addCase(destroyConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(destroyConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        state.data = state.data.filter((item) => item.id !== action.payload.id);

        state.totalRecords = Math.max(0, state.totalRecords - 1);

        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation = null;
          state.messages = [];
          state.totalMessages = 0;
        }
      })
      .addCase(destroyConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // Direct Conversation
      .addCase(createDirectConversationThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(createDirectConversationThunkApi.fulfilled, (state, action) => {
        state.status = "fulfilled";

        const conversation = action.payload.data;

        if (conversation) {
          const index = state.data.findIndex(
            (item) => item.id === conversation.id,
          );

          if (index === -1) {
            state.data.unshift(conversation);
            state.totalRecords += 1;
          } else {
            state.data[index] = conversation;
          }

          state.currentConversation = conversation;
        }
      })
      .addCase(createDirectConversationThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })

      // List Conversation Messages
      .addCase(listConversationMessagesThunkApi.pending, (state) => {
        state.messageStatus = "pending";
        state.error = null;
      })
      .addCase(listConversationMessagesThunkApi.fulfilled, (state, action) => {
        state.messageStatus = "fulfilled";

        const { response } = action.payload;
        const payload = response.results ?? response.data ?? [];

        state.messages = Array.isArray(payload) ? payload : [];
        state.totalMessages = response.count ?? state.messages.length;
      })
      .addCase(listConversationMessagesThunkApi.rejected, (state, action) => {
        state.messageStatus = "rejected";
        state.error = action.payload;
      })

      // Create Conversation Message
      .addCase(createConversationMessageThunkApi.pending, (state) => {
        state.messageStatus = "pending";
        state.error = null;
      })
      .addCase(createConversationMessageThunkApi.fulfilled, (state, action) => {
        state.messageStatus = "fulfilled";

        const message = action.payload.response.data;

        if (message) {
          const exists = state.messages.some((item) => item.id === message.id);

          if (!exists) {
            state.messages.push(message);
            state.totalMessages += 1;
          }

          const conversation = state.data.find(
            (item) => String(item.id) === String(action.payload.conversationId),
          );

          if (conversation) {
            conversation.last_message = message;
          }
        }
      })
      .addCase(createConversationMessageThunkApi.rejected, (state, action) => {
        state.messageStatus = "rejected";
        state.error = action.payload;
      })

      // Mark Conversation as Read
      .addCase(markConversationReadThunkApi.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(markConversationReadThunkApi.fulfilled, (state) => {
        state.status = "fulfilled";
      })
      .addCase(markConversationReadThunkApi.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  addConversationMessage,
  clearConversationMessages,
  clearCurrentConversation,
  clearConversationError,
} = conversationReducer.actions;

export default conversationReducer.reducer;
