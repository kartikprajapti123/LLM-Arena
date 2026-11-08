import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Grid,
  Image,
  Input,
  Modal,
  Radio,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  Upload,
  notification,
} from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MenuOutlined,
  MessageOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  listConversationThunkApi,
  createConversationThunkApi,
  destroyConversationThunkApi,
  createDirectConversationThunkApi,
  listConversationMessagesThunkApi,
  createConversationMessageThunkApi,
  markConversationReadThunkApi,
  addConversationMessage,
  clearConversationMessages,
} from "../../slice/Conversations.Slice"; // Adjust path to your Redux slice

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

/* -------------------------------------------------------------------------- */
/*  Configuration – adjust these to match your project                         */
/* -------------------------------------------------------------------------- */

// Must match the values of ChatMessageModel.MessageType / ConversationType.
const MESSAGE_TYPE = { TEXT: "text", IMAGE: "image", FILE: "file" };
const CONVERSATION_TYPE = { DIRECT: "direct", GROUP: "group" };

const CONVERSATION_PAGE_SIZE = 100;
const MESSAGE_PAGE_SIZE = 50;
const LIST_REFRESH_MS = 20000;
const MAX_FILE_MB = 10;

// Typing indicator timings.
// There are no "stop typing" events. Every "typing" signal is a short lease:
// the sender renews it while the user types, the receiver hides the dots when
// the lease runs out (or immediately when the sender's message arrives).
const TYPING_SEND_INTERVAL_MS = 1000000; // sender renews the signal this often
const TYPING_EXPIRE_MS = 1000000; // receiver hides the dots this long after the last signal

const selectConversationState = (state) =>
  state.Conversation ?? state.conversation;

const TOKEN_KEYS = ["access_token", "accessToken", "access", "token"];
const getAccessToken = () => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};
const WS_BASE = "ws://localhost:8000/ws/conversations";
const buildSocketUrl = (conversationId) => {
  const token = getAccessToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${WS_BASE}/${conversationId}/${query}`;
};

const decodeJwt = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

function useCurrentUserId() {
  const reduxUserId = useSelector(
    (state) => state.auth?.user?.id ?? state.Auth?.user?.id ?? state.user?.data?.id,
  );
  return useMemo(() => {
    const token = getAccessToken();
    return String(reduxUserId ?? decodeJwt(token)?.user_id ?? "");
  }, [reduxUserId]);
}

const errorText = (error) => {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const flat = Object.values(error)
      .flat()
      .map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    return flat.join(" ") || "Something went wrong.";
  }
  return String(error);
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const formatDayLabel = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const formatListTime = (iso) => {
  if (!iso) return "";
  return isSameDay(iso, new Date())
    ? formatTime(iso)
    : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const formatBytes = (bytes) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const initials = (name = "?") =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const fileNameFromUrl = (url = "") => {
  try {
    return decodeURIComponent(url.split("?")[0].split("/").pop());
  } catch {
    return "Attachment";
  }
};

const isImageMessage = (message) =>
  message.message_type === MESSAGE_TYPE.IMAGE ||
  /\.(png|jpe?g|gif|webp|svg)$/i.test((message.attachment_url || "").split("?")[0]);

const isGroupConversation = (c) => c?.conversation_type === CONVERSATION_TYPE.GROUP;

const otherParticipant = (c, myId) =>
  c?.participants?.find((p) => String(p.user_id) !== myId);

const conversationName = (c, myId) =>
  isGroupConversation(c)
    ? c.title || "Group"
    : otherParticipant(c, myId)?.username || c?.title || "Conversation";

const conversationImage = (c, myId) =>
  isGroupConversation(c) ? c.avatar : otherParticipant(c, myId)?.profile_image;

const previewOf = (c, myId) => {
  const last = c.last_message;
  if (!last) return "No messages yet";
  if (last.is_deleted) return "Message deleted";
  const body = last.content?.trim() || (last.attachment_url ? "Sent an attachment" : "");
  if (String(last.sender_id) === myId) return `You: ${body}`;
  return isGroupConversation(c) && last.sender_username
    ? `${last.sender_username}: ${body}`
    : body;
};

const buildTimeline = (messages) => {
  const sameCluster = (a, b) =>
    a &&
    b &&
    a.sender_id === b.sender_id &&
    isSameDay(a.created_at, b.created_at) &&
    formatTime(a.created_at) === formatTime(b.created_at);

  const items = [];
  messages.forEach((message, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    if (!prev || !isSameDay(prev.created_at, message.created_at)) {
      items.push({ type: "day", key: `day-${message.id}`, label: formatDayLabel(message.created_at) });
    }
    items.push({
      type: "message",
      key: message.id,
      message,
      isFirstInGroup: !sameCluster(prev, message),
      isLastInGroup: !sameCluster(message, next),
    });
  });
  return items;
};

/* -------------------------------------------------------------------------- */
/*  WebSocket hook                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One socket per open conversation, with automatic reconnect (exponential
 * backoff). Close codes 4001 / 4003 (not authenticated / not a participant)
 * are final and are not retried.
 */
function useConversationSocket(
  conversationId,
  { onMessage, onReconnect, onTyping, onRead, onOpen },
) {
  const [state, setState] = useState("idle");
  const socketRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    handlersRef.current = { onMessage, onReconnect, onTyping, onRead, onOpen };
  });

  useEffect(() => {
    if (!conversationId) {
      setState("idle");
      return undefined;
    }

    let ws;
    let hasConnected = false;
    let disposed = false;
    let attempt = 0;
    let retryTimer;

    const connect = () => {
      setState(hasConnected ? "reconnecting" : "connecting");
      ws = new WebSocket(buildSocketUrl(conversationId));
      socketRef.current = ws;

      ws.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        const h = handlersRef.current;
        switch (payload.type) {
          case "connection_established":
            setState("open");
            attempt = 0;
            if (hasConnected) h.onReconnect?.(); // catch up on missed messages
            hasConnected = true;
            h.onOpen?.();
            break;
          case "chat_message":
            h.onMessage?.(payload.data);
            break;
          case "typing":
            h.onTyping?.(payload);
            break;
          case "read_receipt":
            h.onRead?.(payload);
            break;
          case "error":
            console.warn("Chat socket error:", payload.message);
            break;
          default:
            break;
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = (event) => {
        if (disposed) return;
        if (event.code === 4001 || event.code === 4003) {
          setState("denied");
          return;
        }
        setState("reconnecting");
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15000));
        attempt += 1;
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      ws?.close();
      socketRef.current = null;
    };
  }, [conversationId]);

  const send = useCallback((payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return { state, send };
}

/* -------------------------------------------------------------------------- */
/*  Presentational components                                                  */
/* -------------------------------------------------------------------------- */

function PersonAvatar({ name, src, size = 44, group = false }) {
  return (
    <Avatar size={size} src={src || undefined} className="chat-avatar">
      {group ? <TeamOutlined /> : initials(name)}
    </Avatar>
  );
}

function MessageStatus({ status }) {
  if (status === "sending") return <ClockCircleOutlined className="chat-status" />;
  if (status === "sent") return <CheckOutlined className="chat-status" />;
  if (status === "read") {
    return (
      <span className="chat-status chat-status-double is-read">
        <CheckOutlined />
        <CheckOutlined />
      </span>
    );
  }
  return null;
}

function TypingIndicator({ names }) {
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : "Several people are typing";

  return (
    <div className="chat-row is-them is-first is-last chat-typing-row">
      <div className="chat-row-avatar" />
      <div className="chat-bubble-col">
        <Text type="secondary" style={{ fontSize: 11 }}>
          {label}
        </Text>
        <div className="chat-bubble chat-typing" aria-label={label}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  item,
  myId,
  groupChat,
  getSeenBy,
  totalOthers,
  isLastMine,
  onCopy,
  onRetry,
  onDiscard,
}) {
  const { message, isFirstInGroup, isLastInGroup } = item;
  const local = message._local;
  const mine = String(message.sender_id) === myId;
  const failed = local?.status === "failed";

  const seenBy = mine && !local ? getSeenBy(message) : [];
  const seenByAll = totalOthers > 0 && seenBy.length === totalOthers;
  const status = local ? local.status : mine ? (seenByAll ? "read" : "sent") : null;

  const attachmentName = local?.file?.name || fileNameFromUrl(message.attachment_url);
  const hasAttachment = Boolean(local?.file || message.attachment_url);
  const canCopy = Boolean(message.content) && !message.is_deleted;

  return (
    <div
      className={[
        "chat-row",
        mine ? "is-mine" : "is-them",
        isFirstInGroup ? "is-first" : "",
        isLastInGroup ? "is-last" : "",
        failed ? "is-failed" : "",
        local && !failed ? "is-pending" : "",
      ].join(" ")}
    >
      {!mine && (
        <div className="chat-row-avatar">
          {isLastInGroup && (
            <PersonAvatar
              name={message.sender_username}
              src={message.sender_profile_image}
              size={32}
            />
          )}
        </div>
      )}

      <div className="chat-bubble-col">
        {!mine && groupChat && isFirstInGroup && message.sender_username && (
          <Text className="chat-author">{message.sender_username}</Text>
        )}

        <div className="chat-bubble-line">
          {mine && canCopy && (
            <Tooltip title="Copy text">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                className="chat-bubble-menu"
                onClick={() => onCopy(message)}
                aria-label="Copy message text"
              />
            </Tooltip>
          )}

          <div className="chat-bubble">
            {message.is_deleted ? (
              <span className="chat-deleted">This message was deleted</span>
            ) : (
              <>
                {hasAttachment &&
                  (!local && isImageMessage(message) ? (
                    <Image
                      src={message.attachment_url}
                      width={220}
                      className="chat-image"
                      alt={attachmentName}
                    />
                  ) : (
                    <a
                      className="chat-file"
                      href={local ? undefined : message.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="chat-file-icon">
                        <FileTextOutlined />
                      </span>
                      <span className="chat-file-meta">
                        <span className="chat-file-name">{attachmentName}</span>
                        {local?.file && (
                          <span className="chat-file-size">{formatBytes(local.file.size)}</span>
                        )}
                      </span>
                    </a>
                  ))}
                {message.content && <span className="chat-text">{message.content}</span>}
              </>
            )}
          </div>

          {!mine && canCopy && (
            <Tooltip title="Copy text">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                className="chat-bubble-menu"
                onClick={() => onCopy(message)}
                aria-label="Copy message text"
              />
            </Tooltip>
          )}
        </div>

        {isLastInGroup && (
          <div className="chat-meta">
            {failed ? (
              <>
                <Text type="danger" style={{ fontSize: 11 }}>
                  Not sent
                </Text>
                <Button type="link" size="small" onClick={() => onRetry(local)}>
                  Retry
                </Button>
                <Button type="link" size="small" danger onClick={() => onDiscard(local)}>
                  Discard
                </Button>
              </>
            ) : (
              <>
                <span>{formatTime(message.created_at)}</span>
                {message.is_edited && !message.is_deleted && <span>edited</span>}
                {mine && <MessageStatus status={status} />}
                {mine && isLastMine && !local && seenBy.length > 0 && (
                  <Tooltip title={seenBy.map((p) => p.username).join(", ")}>
                    <span className="chat-seen">
                      {groupChat ? `Seen by ${seenBy.length} of ${totalOthers}` : "Seen"}
                    </span>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationList({
  conversations,
  myId,
  activeId,
  search,
  onSearch,
  onSelect,
  loading,
  error,
  onRetry,
  onNew,
  hasUnread,
}) {
  return (
    <div className="chat-sidebar-inner">
      <div className="chat-sidebar-head">
        <div className="chat-sidebar-title-row">
          <Title level={4} style={{ margin: 0 }}>
            Messages
          </Title>
          {onNew && (
            <Tooltip title="New conversation">
              <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={onNew} />
            </Tooltip>
          )}
        </div>
        <Input
          allowClear
          size="large"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search conversations..."
        />
      </div>

      <div className="chat-conversations" role="list">
        {loading ? (
          <div className="chat-skeletons">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} active avatar paragraph={{ rows: 1 }} title={false}  />
            ))}
          </div>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Could not load conversations"
            description={error}
            action={
              <Button size="small" onClick={onRetry}>
                Retry
              </Button>
            }
            style={{ margin: 8 }}
          />
        ) : conversations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? "No conversations match your search" : "No conversations yet"}
            style={{ marginTop: 48 }}
          />
        ) : (
          conversations.map((c) => {
            const unread = hasUnread(c);
            const name = conversationName(c, myId);
            return (
              <button
                type="button"
                role="listitem"
                key={c.id}
                
                className={`chat-conversation ${String(c.id) === String(activeId) ? "is-active" : ""}`}
                onClick={() => onSelect(c.id)}
              >
                <PersonAvatar
                  name={name}
                  src={conversationImage(c, myId)}
                  group={isGroupConversation(c) && !c.avatar}
                  style={{"background": "#4f46e5",
    "color": "white"}}
                />
                <span className="chat-conversation-body">
                  <span className="chat-conversation-top">
                    <Text strong ellipsis className="chat-conversation-name">
                      {name}
                    </Text>
                    <Text type="secondary" className="chat-conversation-time">
                      {formatListTime(c.last_message?.created_at ?? c.updated_at)}
                    </Text>
                  </span>
                  <span className="chat-conversation-bottom">
                    <Text
                      type="secondary"
                      ellipsis
                      className={`chat-conversation-preview ${unread ? "is-unread" : ""}`}
                    >
                      {previewOf(c, myId)}
                    </Text>
                    {unread && <Badge color="#2563eb" />}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function NewConversationModal({ open, onClose, members, myId, creating, onCreate }) {
  const [form] = Form.useForm();
  const type = Form.useWatch("type", form);
  const isGroup = type === CONVERSATION_TYPE.GROUP;

  const options = members
    .filter((m) => String(m.id) !== myId)
    .map((m) => ({ value: m.id, label: m.username || m.name || m.email }));

  return (
    <Modal
      title="New conversation"
      open={open}
      onCancel={onClose}
      okText={isGroup ? "Create group" : "Start chat"}
      confirmLoading={creating}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ type: CONVERSATION_TYPE.DIRECT }}
        onValuesChange={(changed) => {
          if (changed.type) form.setFieldValue("participants", undefined);
        }}
        onFinish={onCreate}
      >
        <Form.Item name="type">
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value={CONVERSATION_TYPE.DIRECT}>Direct message</Radio.Button>
            <Radio.Button value={CONVERSATION_TYPE.GROUP}>Group</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {isGroup && (
          <Form.Item
            label="Group name"
            name="title"
            rules={[{ required: true, message: "Group name is required" }]}
          >
            <Input size="large" placeholder="e.g. Backend team" />
          </Form.Item>
        )}

        <Form.Item
          label={isGroup ? "Members" : "Person"}
          name="participants"
          rules={[
            { required: true, message: "Select at least one person" },
            ...(isGroup
              ? [
                  {
                    validator: (_, value) =>
                      value?.length >= 2
                        ? Promise.resolve()
                        : Promise.reject(new Error("A group needs at least two other people")),
                  },
                ]
              : []),
          ]}
        >
          <Select
            size="large"
            mode={isGroup ? "multiple" : undefined}
            showSearch
            optionFilterProp="label"
            options={options}
            placeholder={isGroup ? "Select members" : "Select a person"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Props
 *  - workspaceId:      required by the backend when creating conversations
 *  - workspaceMembers: [{ id, username }] used by the "New conversation" dialog.
 *                      If omitted, the dialog button is hidden.
 */
export default function Chat({ workspaceId, workspaceMembers = [] }) {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [api, contextHolder] = notification.useNotification();
  const myId = useCurrentUserId();

  const chat = useSelector(selectConversationState) || {};
  const conversations = chat.data || [];
  const rawMessages = chat.messages || [];
  const totalMessages = chat.totalMessages || 0;

  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});
  const [outbox, setOutbox] = useState([]);
  const [readOverrides, setReadOverrides] = useState({});
  const [readReceipts, setReadReceipts] = useState({}); // { [conversationId]: { [userId]: isoTime } }
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [messagePageSize, setMessagePageSize] = useState(MESSAGE_PAGE_SIZE);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const threadRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const restoreScrollRef = useRef(null);
  const initialScrollRef = useRef(true);
  const messagesRequest = useRef(null);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;
  const socketSendRef = useRef(() => false); // lets markRead use the socket before the hook is declared

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState({}); // { [userId]: username }
  const typingTimersRef = useRef({}); // auto-hide timers for incoming typing
  const lastTypingSentRef = useRef(0);

  const active = conversations.find((c) => String(c.id) === String(activeId)) || null;
  const groupChat = isGroupConversation(active);
  const draft = drafts[activeId] ?? "";

  /* ----------------------------- Data loading ----------------------------- */

  const fetchConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setListLoading(true);
      try {
        await dispatch(
          listConversationThunkApi({ page: 1, pageSize: CONVERSATION_PAGE_SIZE }),
        ).unwrap();
        setListError(null);
      } catch (error) {
        if (!silent) setListError(errorText(error));
      } finally {
        setListLoading(false);
      }
    },
    [dispatch],
  );

  const fetchMessages = useCallback(
    async (conversationId, pageSize, { silent = false } = {}) => {
      messagesRequest.current?.abort();
      const request = dispatch(
        listConversationMessagesThunkApi({ id: conversationId, params: { page: 1, pageSize } }),
      );
      messagesRequest.current = request;
      if (!silent) setMessagesLoading(true);
      try {
        await request.unwrap();
        setMessagesError(null);
      } catch (error) {
        if (error?.name !== "AbortError") setMessagesError(errorText(error));
      } finally {
        if (messagesRequest.current === request) setMessagesLoading(false);
      }
    },
    [dispatch],
  );

  const markRead = useCallback(
    (conversationId) => {
      setReadOverrides((prev) => ({ ...prev, [conversationId]: new Date().toISOString() }));
      dispatch(markConversationReadThunkApi(conversationId))
        .unwrap()
        .catch(() => {});
      if (String(conversationId) === String(activeIdRef.current)) {
        socketSendRef.current({ type: "read" }); // tell everyone else right now
      }
    },
    [dispatch],
  );

  // Initial load + background refresh (keeps sidebar and read receipts fresh)
  useEffect(() => {
    fetchConversations();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetchConversations({ silent: true });
      if (activeIdRef.current) markRead(activeIdRef.current);
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") fetchConversations({ silent: true });
    }, LIST_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchConversations, markRead]);

  // Select the first conversation on desktop once the list arrives
  useEffect(() => {
    if (!activeId && !isMobile && conversations.length > 0) setActiveId(conversations[0].id);
  }, [activeId, isMobile, conversations]);

  // Clear selection if the active conversation disappeared (deleted elsewhere)
  useEffect(() => {
    if (activeId && !listLoading && conversations.length > 0 && !active) setActiveId(null);
  }, [activeId, active, listLoading, conversations.length]);

  // Load messages whenever the conversation changes
  useEffect(() => {
    if (!activeId) return undefined;
    dispatch(clearConversationMessages());
    setMessagePageSize(MESSAGE_PAGE_SIZE);
    stickToBottomRef.current = true;
    initialScrollRef.current = true;
    fetchMessages(activeId, MESSAGE_PAGE_SIZE).then(() => markRead(activeId));
    return () => messagesRequest.current?.abort();
  }, [activeId, dispatch, fetchMessages, markRead]);

  // Reset typing state when switching conversations
  useEffect(() => {
    setTypingUsers({});
    Object.values(typingTimersRef.current).forEach(clearTimeout);
    typingTimersRef.current = {};
    lastTypingSentRef.current = 0;
  }, [activeId]);

  // Clear any pending typing timers on unmount
  useEffect(
    () => () => {
      Object.values(typingTimersRef.current).forEach(clearTimeout);
    },
    [],
  );

  /* ------------------------------ WebSocket ------------------------------- */

  const removeTyping = useCallback((userId) => {
    clearTimeout(typingTimersRef.current[userId]);
    delete typingTimersRef.current[userId];
    setTypingUsers((prev) => {
      if (!(userId in prev)) return prev;
      const { [userId]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Every "typing" signal renews a short lease. If no new signal arrives
  // before the lease expires, the dots disappear.
  const handleSocketTyping = useCallback(
    ({ user_id, username, is_typing, conversation_id }) => {
      if (!is_typing) return; // leases expire on their own
      if (String(user_id) === myId) return;
      if (conversation_id && String(conversation_id) !== String(activeIdRef.current)) return;

      setTypingUsers((prev) => ({ ...prev, [user_id]: username || "Someone" }));
      clearTimeout(typingTimersRef.current[user_id]);
      typingTimersRef.current[user_id] = setTimeout(
        () => removeTyping(user_id),
        TYPING_EXPIRE_MS,
      );
    },
    [myId, removeTyping],
  );

  const handleSocketRead = useCallback(
    ({ user_id, read_at, conversation_id }) => {
      if (String(user_id) === myId) return;
      setReadReceipts((prev) => ({
        ...prev,
        [conversation_id]: { ...(prev[conversation_id] || {}), [String(user_id)]: read_at },
      }));
    },
    [myId],
  );

  const handleSocketMessage = useCallback(
    (message) => {
      if (!message?.id) return;
      if (String(message.conversation_id) !== String(activeIdRef.current)) return;

      removeTyping(message.sender_id); // their message arrived, so they stopped typing

      // The slice looks up `message.conversation`; the API returns `conversation_id`.
      dispatch(addConversationMessage({ ...message, conversation: message.conversation_id }));

      if (String(message.sender_id) !== myId) {
        if (document.visibilityState === "visible") markRead(message.conversation_id);
        fetchConversations({ silent: true }); // re-sorts the sidebar
      }
    },
    [dispatch, fetchConversations, markRead, myId, removeTyping],
  );

  const { state: socketState, send: socketSend } = useConversationSocket(activeId, {
    onMessage: handleSocketMessage,
    onReconnect: () => {
      if (activeIdRef.current) {
        fetchMessages(activeIdRef.current, messagePageSize, { silent: true });
      }
    },
    onTyping: handleSocketTyping,
    onRead: handleSocketRead,
    onOpen: () => {
      if (document.visibilityState === "visible" && activeIdRef.current) {
        markRead(activeIdRef.current);
      }
    },
  });
  socketSendRef.current = socketSend;

  // Called on every keystroke; only actually sends once per interval.
  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current >= TYPING_SEND_INTERVAL_MS) {
      lastTypingSentRef.current = now;
      socketSend({ type: "typing", is_typing: true });
    }
  }, [socketSend]);

  /* ------------------------------ Derived data ---------------------------- */

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter(
      (c) => !q || conversationName(c, myId).toLowerCase().includes(q),
    );
  }, [conversations, search, myId]);

  const serverMessages = useMemo(
    () =>
      rawMessages
        .filter((m) => String(m.conversation_id) === String(activeId))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [rawMessages, activeId],
  );

  const timeline = useMemo(() => {
    const local = outbox
      .filter((o) => o.conversationId === activeId)
      .map((o) => ({
        id: o.tempId,
        conversation_id: o.conversationId,
        sender_id: myId,
        content: o.content,
        message_type: o.file ? MESSAGE_TYPE.FILE : MESSAGE_TYPE.TEXT,
        created_at: o.createdAt,
        _local: o,
      }));
    return buildTimeline([...serverMessages, ...local]);
  }, [serverMessages, outbox, activeId, myId]);

  const hasMoreMessages = serverMessages.length < totalMessages;

  const typingNames = Object.values(typingUsers);

  const hasUnread = useCallback(
    (c) => {
      if (String(c.id) === String(activeId)) return false;
      const last = c.last_message;
      if (!last || String(last.sender_id) === myId) return false;
      const mine = c.participants?.find((p) => String(p.user_id) === myId);
      const readTimes = [mine?.last_read_at, readOverrides[c.id]]
        .filter(Boolean)
        .map((d) => new Date(d).getTime());
      const latestRead = readTimes.length ? Math.max(...readTimes) : 0;
      return new Date(last.created_at).getTime() > latestRead;
    },
    [activeId, myId, readOverrides],
  );

  const otherParticipants = useMemo(
    () => (active?.participants || []).filter((p) => String(p.user_id) !== myId),
    [active, myId],
  );

  // Who has seen this message: combines the REST value (last_read_at from the
  // list refresh) with live socket receipts, whichever is newer.
  const getSeenBy = useCallback(
    (message) => {
      const live = readReceipts[activeId] || {};
      const sentAt = new Date(message.created_at).getTime();
      return otherParticipants.filter((p) => {
        const fromServer = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
        const fromSocket = live[String(p.user_id)]
          ? new Date(live[String(p.user_id)]).getTime()
          : 0;
        return Math.max(fromServer, fromSocket) >= sentAt;
      });
    },
    [otherParticipants, readReceipts, activeId],
  );

  // The "Seen by ..." text is shown only under my most recent message.
  const lastMineId = useMemo(() => {
    for (let i = serverMessages.length - 1; i >= 0; i -= 1) {
      if (String(serverMessages[i].sender_id) === myId) return serverMessages[i].id;
    }
    return null;
  }, [serverMessages, myId]);

  /* ------------------------------- Scrolling ------------------------------ */

  const handleScroll = (e) => {
    const el = e.currentTarget;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useLayoutEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    if (restoreScrollRef.current !== null) {
      el.scrollTop = el.scrollHeight - restoreScrollRef.current; // keep position after loading older
      restoreScrollRef.current = null;
      return;
    }
    if (stickToBottomRef.current && timeline.length > 0) {
      el.scrollTo({ top: el.scrollHeight, behavior: initialScrollRef.current ? "auto" : "smooth" });
      initialScrollRef.current = false;
    }
  }, [timeline.length, activeId, messagesLoading, typingNames.length]);

  const handleLoadEarlier = async () => {
    const next = messagePageSize + MESSAGE_PAGE_SIZE;
    restoreScrollRef.current = threadRef.current?.scrollHeight ?? 0;
    setLoadingOlder(true);
    setMessagePageSize(next);
    await fetchMessages(activeId, next, { silent: true });
    setLoadingOlder(false);
  };

  /* -------------------------------- Sending ------------------------------- */

  const sendMessage = useCallback(
    async ({ content = "", file = null }, existingTempId) => {
      const conversationId = activeIdRef.current;
      if (!conversationId) return;

      const tempId =
        existingTempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      stickToBottomRef.current = true;

      setOutbox((prev) => [
        ...prev.filter((o) => o.tempId !== tempId),
        { tempId, conversationId, content, file, status: "sending", createdAt: new Date().toISOString() },
      ]);

      try {
        let data;
        if (file) {
          data = new FormData();
          data.append("content", content);
          data.append("message_type", file.type?.startsWith("image/") ? MESSAGE_TYPE.IMAGE : MESSAGE_TYPE.FILE);
          data.append("attachment", file);
        } else {
          data = { content, message_type: MESSAGE_TYPE.TEXT };
        }

        const result = await dispatch(
          createConversationMessageThunkApi({ id: conversationId, data }),
        ).unwrap();

        setOutbox((prev) => prev.filter((o) => o.tempId !== tempId));

        // Broadcast the saved message to everyone connected to this conversation.
        const saved = result?.response?.data;
        if (saved && String(activeIdRef.current) === String(conversationId)) {
          socketSend({ type: "chat_message", data: saved });
        }
        fetchConversations({ silent: true });
      } catch (error) {
        setOutbox((prev) =>
          prev.map((o) => (o.tempId === tempId ? { ...o, status: "failed" } : o)),
        );
        api.error({ message: "Message not sent", description: errorText(error), duration: 4 });
      }
    },
    [api, dispatch, fetchConversations, socketSend],
  );

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !activeId) return;
    lastTypingSentRef.current = 0; // next keystroke after sending notifies immediately
    setDrafts((prev) => ({ ...prev, [activeId]: "" }));
    sendMessage({ content });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDraftChange = (e) => {
    const value = e.target.value;
    setDrafts((prev) => ({ ...prev, [activeId]: value }));
    if (value.trim()) notifyTyping();
  };

  const handleFile = (file) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      api.warning({
        message: "File too large",
        description: `Files must be ${MAX_FILE_MB} MB or smaller.`,
      });
      return false;
    }
    sendMessage({ file });
    return false; // we upload through the send-message endpoint, not antd's uploader
  };

  const handleRetry = (local) => sendMessage({ content: local.content, file: local.file }, local.tempId);
  const handleDiscard = (local) => setOutbox((prev) => prev.filter((o) => o.tempId !== local.tempId));

  const handleCopy = (message) => {
    navigator.clipboard?.writeText(message.content);
    api.success({ message: "Copied", description: "Message text copied to clipboard.", duration: 2 });
  };

  /* ---------------------------- Conversation actions ---------------------- */

  const selectConversation = (id) => {
    setActiveId(id);
    setListOpen(false);
  };

  const handleCreateConversation = async (values) => {
    setCreating(true);
    try {
      const result =
        values.type === CONVERSATION_TYPE.DIRECT
          ? await dispatch(
              createDirectConversationThunkApi({
                workspace: workspaceId,
                participant_ids: [values.participants],
              }),
            ).unwrap()
          : await dispatch(
              createConversationThunkApi({
                workspace: workspaceId,
                conversation_type: CONVERSATION_TYPE.GROUP,
                title: values.title,
                participant_ids: values.participants,
              }),
            ).unwrap();

      setNewChatOpen(false);
      if (result?.data?.id) selectConversation(result.data.id);
      fetchConversations({ silent: true });
    } catch (error) {
      api.error({ message: "Could not start conversation", description: errorText(error) });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConversation = () => {
    if (!active) return;
    Modal.confirm({
      title: "Delete conversation",
      content: "This removes the conversation for all participants. Only conversation admins can do this.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(destroyConversationThunkApi(active.id)).unwrap();
          setActiveId(null);
          api.success({ message: "Deleted", description: "Conversation deleted successfully." });
        } catch (error) {
          api.error({ message: "Delete failed", description: errorText(error) });
        }
      },
    });
  };

  /* --------------------------------- Render ------------------------------- */

  const socketBadge = {
    connecting: ["processing", "Connecting"],
    open: ["success", "Live"],
    reconnecting: ["warning", "Reconnecting"],
    denied: ["error", "Disconnected"],
  }[socketState];

  const subtitle = !active
    ? ""
    : groupChat
    ? `${active.participants?.length || 0} members`
    : "Direct message";

  const headerMenu = {
    items: [
      { key: "refresh", icon: <ReloadOutlined />, label: "Refresh messages" },
      { type: "divider" },
      { key: "delete", danger: true, icon: <DeleteOutlined />, label: "Delete conversation" },
    ],
    onClick: ({ key }) => {
      if (key === "refresh") fetchMessages(activeId, messagePageSize);
      if (key === "delete") handleDeleteConversation();
    },
  };

  const list = (
    <ConversationList
      conversations={visibleConversations}
      myId={myId}
      activeId={activeId}
      search={search}
      onSearch={setSearch}
      onSelect={selectConversation}
      loading={listLoading}
      error={listError}
      onRetry={() => fetchConversations()}
      onNew={workspaceId && workspaceMembers.length > 0 ? () => setNewChatOpen(true) : undefined}
      hasUnread={hasUnread}
    />
  );

  return (
    <>
      {contextHolder}
      <div className="chat-shell">
        {!isMobile && <aside className="chat-sidebar">{list}</aside>}

        {isMobile && (
          <Drawer
            placement="left"
            width={320}
            open={listOpen}
            onClose={() => setListOpen(false)}
            styles={{ body: { padding: 0 } }}
            closable={false}
          >
            {list}
          </Drawer>
        )}

        <section className="chat-main">
          {!active ? (
            <div className="chat-empty">
              <Empty
                image={<MessageOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />}
                description="Select a conversation to start messaging"
              >
                {isMobile && (
                  <Button type="primary" onClick={() => setListOpen(true)}>
                    Open conversations
                  </Button>
                )}
              </Empty>
            </div>
          ) : (
            <>
              <header className="chat-header">
                <Space size={12} align="center" style={{ minWidth: 0 }}>
                  {isMobile && (
                    <Button
                      type="text"
                      icon={<MenuOutlined />}
                      onClick={() => setListOpen(true)}
                      aria-label="Open conversations"
                    />
                  )}
                  <PersonAvatar
                  style={{"background": "#4f46e5",
    "color": "white"}}
                    name={conversationName(active, myId)}
                    src={conversationImage(active, myId)}
                    group={groupChat && !active.avatar}
                  />
                  <div className="chat-header-text">
                    <Text strong ellipsis className="chat-header-name">
                      {conversationName(active, myId)}
                    </Text>
                    <Text type="secondary" ellipsis className="chat-header-sub">
                      {subtitle}
                    </Text>
                  </div>
                </Space>

                <Space size={8}>
                  {socketBadge && (
                    <Badge
                      status={socketBadge[0]}
                      text={<Text type="secondary" style={{ fontSize: 12 }}>{socketBadge[1]}</Text>}
                    />
                  )}
                  <Dropdown menu={headerMenu} trigger={["click"]} placement="bottomRight">
                    <Button type="text" shape="circle" icon={<MoreOutlined />} aria-label="More options" />
                  </Dropdown>
                </Space>
              </header>

              <div className="chat-thread" ref={threadRef} onScroll={handleScroll} role="log" aria-live="polite">
                {messagesLoading && serverMessages.length === 0 ? (
                  <div className="chat-empty">
                    <Skeleton active paragraph={{ rows: 4 }} style={{ maxWidth: 420 }} />
                  </div>
                ) : messagesError && serverMessages.length === 0 ? (
                  <div className="chat-empty">
                    <Alert
                      type="error"
                      showIcon
                      message="Could not load messages"
                      description={messagesError}
                      action={
                        <Button size="small" onClick={() => fetchMessages(activeId, messagePageSize)}>
                          Retry
                        </Button>
                      }
                    />
                  </div>
                ) : timeline.length === 0 && typingNames.length === 0 ? (
                  <div className="chat-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={`No messages yet. Say hello to ${conversationName(active, myId)}.`}
                    />
                  </div>
                ) : (
                  <>
                    {hasMoreMessages && (
                      <div className="chat-load-more">
                        <Button size="small" loading={loadingOlder} onClick={handleLoadEarlier}>
                          Load earlier messages
                        </Button>
                      </div>
                    )}
                    {timeline.map((item) =>
                      item.type === "day" ? (
                        <div className="chat-day" key={item.key}>
                          <span>{item.label}</span>
                        </div>
                      ) : (
                        <MessageBubble
                          key={item.key}
                          item={item}
                          myId={myId}
                          groupChat={groupChat}
                          getSeenBy={getSeenBy}
                          totalOthers={otherParticipants.length}
                          isLastMine={item.message.id === lastMineId}
                          onCopy={handleCopy}
                          onRetry={handleRetry}
                          onDiscard={handleDiscard}
                        />
                      ),
                    )}
                    {typingNames.length > 0 && <TypingIndicator names={typingNames} />}
                  </>
                )}
              </div>

              <footer className="chat-composer">
                <Upload showUploadList={false} beforeUpload={handleFile} multiple={false}>
                  <Tooltip title={`Attach file (max ${MAX_FILE_MB} MB)`}>
                    <Button type="text" shape="circle" size="large" icon={<PaperClipOutlined />} />
                  </Tooltip>
                </Upload>

                <Input.TextArea
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message..."
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  className="chat-input"
                  aria-label="Message"
                />

                <Tooltip title="Send (Enter)">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<SendOutlined />}
                    disabled={!draft.trim()}
                    onClick={handleSend}
                    className="btn-primary-custom"
                    aria-label="Send message"
                  />
                </Tooltip>
              </footer>
              <Text type="secondary" className="chat-hint">
                Press Enter to send, Shift + Enter for a new line
              </Text>
            </>
          )}
        </section>
      </div>

      <NewConversationModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        members={workspaceMembers}
        myId={myId}
        creating={creating}
        onCreate={handleCreateConversation}
      />
    </>
  );
}
