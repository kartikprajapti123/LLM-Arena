import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Tag,
  Space,
  Input,
  Tooltip,
  Avatar,
  Segmented,
  Spin,
  notification,
  Card,
  Pagination,
} from "antd";
import {
  SendOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  CheckOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  TrophyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  ComparisonRunThunkApi,
  listComparisonThunkApi,
} from "../../slice/Comparison.Slice";
import { useNavigate, useParams } from "react-router-dom";
import { userCheckThunkApi } from "../../slice/Project.Slice";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const { Title, Text } = Typography;
const { TextArea } = Input;

/* ==================== MARKDOWN RENDERING (same file) ==================== */

const MARKDOWN_CSS = `
.md-body { font-size: 13.5px; line-height: 1.65; color: #334155; word-break: break-word; min-width: 0; }
.md-body > *:first-child { margin-top: 0; }
.md-body > *:last-child { margin-bottom: 0; }
.md-body p { margin: 0 0 10px; }
.md-body h1, .md-body h2, .md-body h3, .md-body h4 { margin: 16px 0 8px; font-weight: 600; color: #0f172a; }
.md-body h1 { font-size: 18px; }
.md-body h2 { font-size: 16px; }
.md-body h3, .md-body h4 { font-size: 14.5px; }
.md-body ul, .md-body ol { margin: 0 0 10px; padding-left: 22px; }
.md-body li { margin: 3px 0; }
.md-body blockquote { margin: 0 0 10px; padding: 4px 12px; border-left: 3px solid #cbd5e1; color: #64748b; }
.md-body a { color: #2563eb; }
.md-body hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
.md-inline-code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 5px; font-size: 12.5px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #be185d; }
.md-code-block { margin: 0 0 12px; border-radius: 8px; overflow: hidden; background: #1e1e2e; max-width: 100%; }
.md-code-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #2a2a3c; color: #a6adc8; font-size: 12px; }
.md-code-header button { background: none; border: none; color: #a6adc8; cursor: pointer; font-size: 12px; }
.md-code-header button:hover { color: #ffffff; }
.md-table-wrap { overflow-x: auto; margin-bottom: 10px; }
.md-body table { border-collapse: collapse; font-size: 13px; }
.md-body th, .md-body td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
.md-body th { background: #f8fafc; }
`;

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span>{language}</span>
        <button type="button" onClick={handleCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}{" "}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 8px 8px",
          fontSize: 13,
          background: "#1e1e2e",
        }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MarkdownMessage({ content }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Remove the default <pre> so CodeBlock isn't double-wrapped
          pre: ({ children }) => <>{children}</>,

          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");

            // Inline code like `foo`
            if (!match && !text.includes("\n")) {
              return (
                <code className="md-inline-code" {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1] || "text"} code={text} />;
          },

          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),

          table: ({ children }) => (
            <div className="md-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

/* ======================================================================== */

const MOBILE_BREAKPOINT = 991;

// WebSocket endpoint. Must match the route in your routing.py,
// e.g. path("ws/llm-api-update/<project_id>/", LLMUpdateConsumer.as_asgi())
// Use wss:// in production.
const WS_BASE = "ws://localhost:8000/ws/llm-api-update";

// Token sent as ?token=<jwt>. Same key the header uses ("access").
const getWsToken = () => localStorage.getItem("access");

/* Returns true when the viewport is at or below the breakpoint */
const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
};

/* Keeps a WebSocket open for the project and reconnects with backoff */
const useProjectSocket = (projectId, onEvent) => {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent; // always call the latest handler

  useEffect(() => {
    if (!projectId) return undefined;

    let socket;
    let retryTimer;
    let retries = 0;
    let closedByUs = false;

    const connect = () => {
      const token = getWsToken();
      const query = token ? `?token=${encodeURIComponent(token)}` : "";
      socket = new WebSocket(`${WS_BASE}/${projectId}/${query}`);

      socket.onopen = () => {
        retries = 0;
      };

      socket.onmessage = (e) => {
        try {
          handlerRef.current?.(JSON.parse(e.data));
        } catch (err) {
          console.error("Bad WebSocket message", err);
        }
      };

      socket.onclose = () => {
        if (closedByUs) return;
        // exponential backoff: 1s, 2s, 4s ... max 15s
        const delay = Math.min(1000 * 2 ** retries++, 15000);
        retryTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [projectId]);
};

const FULL_HEIGHT = `calc(100vh - 160px)`;

/* "13 Oct 2026, 10:42 AM" */
const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "");

const statusColor = (status) =>
  status === "completed" || status === "success"
    ? "blue"
    : status === "failed" || status === "error"
      ? "error"
      : "processing";

const GeminiSparkleIcon = ({ color = "#2563eb", size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    aria-hidden="true"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      flexShrink: 0,
    }}
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

export default function RunComparison() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.project_id;

  const isMobile = useIsMobile();

  const [promptInput, setPromptInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [mobileLayoutMode, setMobileLayoutMode] = useState("stack");
  const [isLoading, setIsLoading] = useState(false);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  // Open by default on desktop, closed by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth > MOBILE_BREAKPOINT,
  );
  const [selectedComparisonId, setSelectedComparisonId] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Live progress from the WebSocket:
  // { [comparisonId]: { status, message, models: { [responseId]: { name, status, message } } } }
  const [liveRuns, setLiveRuns] = useState({});

  const [message, contextHolder] = notification.useNotification();
  const mainRef = useRef(null); // scrollable content area
  const sidebarListRef = useRef(null);
  const pagingRef = useRef({ page, pageSize });
  pagingRef.current = { page, pageSize };
  // True while THIS browser has a run in flight (so we only auto-select our own run)
  const sendingRef = useRef(false);
  // A comparison id we selected before it appeared in the fetched list
  const pendingSelectRef = useRef(null);

  const user_detail = useSelector((state) => state.auth?.user_detail);
  const comparisonState = useSelector((state) => state.comparison);
  const rawComparisonData = comparisonState?.data;
  const comparisonList = Array.isArray(rawComparisonData?.results)
    ? rawComparisonData.results
    : Array.isArray(rawComparisonData)
      ? rawComparisonData
      : [];

  // Total number of records across all pages (check your API's key name)
  const totalRecords = Number(
    comparisonState?.totalRecords ??
      rawComparisonData?.count ??
      rawComparisonData?.total ??
      rawComparisonData?.total_count ??
      rawComparisonData?.pagination?.total ??
      comparisonList.length,
  );

  /* Scroll the content area back to the top (prompt + live status live there) */
  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* When switching between mobile and desktop, reset the sidebar state */
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleUserCheck = useCallback(() => {
    if (!projectId || !user_detail?.id) return;

    dispatch(
      userCheckThunkApi({
        project: projectId,
        user: user_detail.id,
      }),
    )
      .unwrap()
      .catch((error) => {
        message.error({
          message: "Authentication Failed",
          description:
            error?.message || error || "Unable to verify user access.",
        });
        navigate("/dashboard/");
      });
  }, [dispatch, message, navigate, projectId, user_detail?.id]);

  /* Loads the history list. silent = no sidebar spinner (used for live refreshes) */
  const fetchComparisons = useCallback(
    async ({ silent = false, page: p, pageSize: ps } = {}) => {
      if (!projectId) return;
      if (!silent) setIsComparisonLoading(true);
      try {
        await dispatch(
          listComparisonThunkApi({
            page: p ?? pagingRef.current.page,
            pageSize: ps ?? pagingRef.current.pageSize,
            projectId,
          }),
        ).unwrap();
      } catch (error) {
        message.error({
          message: "Unable to load comparison history",
          description: error?.message || "Please try again in a moment.",
        });
      } finally {
        if (!silent) setIsComparisonLoading(false);
      }
    },
    [dispatch, message, projectId],
  );

  useEffect(() => {
    handleUserCheck();
  }, [handleUserCheck]);

  useEffect(() => {
    fetchComparisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, projectId]);

  /* WebSocket events pushed by the Django view */
  const handleSocketEvent = useCallback(
    (evt) => {
      const id = evt.comparison_id;

      switch (evt.type) {
        case "comparison_started":
          setLiveRuns((prev) => ({
            ...prev,
            [id]: { status: "running", message: evt.message, models: {} },
          }));
          if (sendingRef.current) {
            pendingSelectRef.current = id;
            setSelectedComparisonId(id);
            setActiveMobileTab(0);
            scrollToTop(); // show the new prompt + its status at the top
          }
          setPage(1);
          fetchComparisons({ silent: true, page: 1 });
          break;

        case "model_started":
        case "model_completed":
        case "model_failed":
          setLiveRuns((prev) => {
            const run = prev[id] || { status: "running", models: {} };
            return {
              ...prev,
              [id]: {
                ...run,
                models: {
                  ...run.models,
                  [evt.response_id]: {
                    ...run.models[evt.response_id],
                    name: evt.model_name || run.models[evt.response_id]?.name,
                    status: evt.status,
                    message: evt.message,
                  },
                },
              },
            };
          });
          if (evt.type !== "model_started") {
            fetchComparisons({ silent: true }); // show the new response card
          }
          break;

        case "evaluation_started":
          setLiveRuns((prev) => ({
            ...prev,
            [id]: {
              ...(prev[id] || { models: {} }),
              status: "evaluating",
              message: evt.message,
            },
          }));
          break;

        case "comparison_completed":
        case "comparison_failed":
          setLiveRuns((prev) => {
            const { [id]: _done, ...rest } = prev;
            return rest;
          });
          fetchComparisons({ silent: true });
          break;

        default:
          break; // connection_established, pong, etc.
      }
    },
    [fetchComparisons, scrollToTop],
  );

  useProjectSocket(projectId, handleSocketEvent);

  /* Keep a valid selection; don't drop a just-started run that isn't in the list yet */
  useEffect(() => {
    if (comparisonList.length === 0) {
      if (!pendingSelectRef.current) setSelectedComparisonId(null);
      return;
    }

    const selectedExists = comparisonList.some(
      (item) => item.id === selectedComparisonId,
    );

    if (selectedExists) {
      if (pendingSelectRef.current === selectedComparisonId) {
        pendingSelectRef.current = null;
      }
      return;
    }

    if (
      selectedComparisonId &&
      pendingSelectRef.current === selectedComparisonId
    ) {
      return; // waiting for the list refresh to include it
    }

    setSelectedComparisonId(comparisonList[0].id);
    setActiveMobileTab(0);
  }, [comparisonList, selectedComparisonId]);

  const activeComparison =
    comparisonList.find((item) => item.id === selectedComparisonId) ||
    comparisonList[0] ||
    null;

  const results = activeComparison?.responses || [];
  const activeLive = activeComparison ? liveRuns[activeComparison.id] : null;

  /* Whenever a different comparison is shown, start at its top (prompt + status).
     New responses arriving later do NOT move the scroll position. */
  useEffect(() => {
    scrollToTop();
  }, [selectedComparisonId, scrollToTop]);

  const handleSendPrompt = async () => {
    const prompt = promptInput.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    sendingRef.current = true;
    scrollToTop();
    try {
      const res = await dispatch(
        ComparisonRunThunkApi({
          project: projectId,
          prompt,
        }),
      ).unwrap();

      setPromptInput("");

      const newId =
        res?.data?.comparison_id ?? res?.data?.id ?? res?.id ?? null;
      if (newId) {
        pendingSelectRef.current = newId;
        setSelectedComparisonId(newId);
      }

      // Final state, in case a socket event was missed
      fetchComparisons({ silent: true, page: 1 });
      if (pagingRef.current.page !== 1) setPage(1);
    } catch (error) {
      message.error({
        message: "Execution Error",
        description:
          error?.message || error || "Failed to process comparison prompt.",
      });
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      message.error({
        message: "Copy failed",
        description: "Your browser could not copy this response.",
      });
    }
  };

  const handleFeedback = (id, type) => {
    setFeedback((previous) => ({ ...previous, [id]: type }));
  };

  /* Sidebar style: fixed overlay drawer on mobile, inline column on desktop */
  const sidebarStyle = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        height: "100dvh",
        width: "280px",
        maxWidth: "85vw",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
        zIndex: 1200,
        overflow: "hidden",
      }
    : {
        width: sidebarOpen ? "300px" : "0px",
        minWidth: sidebarOpen ? "300px" : "0px",
        height: FULL_HEIGHT,
        display: "flex",
        flexDirection: "column",
        borderRight: sidebarOpen ? "1px solid #e2e8f0" : "none",
        backgroundColor: "#ffffff",
        transition: "all 0.2s ease-in-out",
        overflow: "hidden",
        zIndex: 10,
      };

  return (
    <>
      {contextHolder}
      <style>{MARKDOWN_CSS}</style>

      {/* Outer Layout Wrapper */}
      <div
        className="arena-chat-wrapper"
        style={{
          display: "flex",
          width: "100%",
          height: FULL_HEIGHT,
          overflow: "hidden",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* MOBILE BACKDROP: tap to close the drawer */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 1150,
            }}
          />
        )}

        {/* LEFT SIDEBAR */}
        <aside className="arena-sidebar" style={sidebarStyle}>
          {/* Sidebar Top Header */}
          <div
            className="sidebar-header"
            style={{
              padding: "16px",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0,
            }}
          >
            <Space size={8}>
              <GeminiSparkleIcon color="#2563eb" size={20} />
              <Text strong style={{ fontSize: 16 }}>
                LLM Workspace
              </Text>
            </Space>
          </div>

          {/* Sidebar History Title */}
          <div
            style={{
              padding: "12px 16px 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#64748b",
              flexShrink: 0,
            }}
          >
            <HistoryOutlined />
            <Text
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Comparison History
            </Text>
          </div>

          {/* Sidebar Scrollable Item List */}
          <div
            className="sidebar-list hide-scrollbar"
            ref={sidebarListRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {isComparisonLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Spin size="small" />
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                  Loading history...
                </div>
              </div>
            ) : comparisonList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Text type="secondary">No recent comparisons</Text>
              </div>
            ) : (
              comparisonList.map((item) => {
                const isSelected = selectedComparisonId === item.id;

                // Live status from the socket wins over the fetched one
                const displayStatus =
                  liveRuns[item.id]?.status || item.status || "pending";

                const senderName = item.created_by_username;
                const senderAvatar = item.created_by_profileImage || null;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedComparisonId(item.id);
                      setActiveMobileTab(0);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#eff6ff" : "transparent",
                      border: isSelected
                        ? "1px solid #bfdbfe"
                        : "1px solid transparent",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <MessageOutlined
                        style={{
                          color: isSelected ? "#2563eb" : "#64748b",
                          fontSize: 13,
                        }}
                      />
                      <Text
                        ellipsis
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: isSelected ? "#1d4ed8" : "#334155",
                        }}
                      >
                        {item.prompt || item.title || "Untitled comparison"}
                      </Text>
                    </div>

                    {/* Sender: profile picture + name */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        paddingLeft: 21,
                        marginBottom: 4,
                        minWidth: 0,
                      }}
                    >
                      <Avatar
                        size={18}
                        src={senderAvatar}
                        icon={
                          !senderAvatar && !getInitial(senderName) ? (
                            <UserOutlined />
                          ) : undefined
                        }
                        style={{
                          backgroundColor: senderAvatar ? undefined : "#cbd5e1",
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                      >
                        {getInitial(senderName)}
                      </Avatar>
                      <Text
                        ellipsis
                        style={{ fontSize: 12, color: "#64748b", flex: 1 }}
                      >
                        {senderName}
                      </Text>
                    </div>

                    {/* Date + time and status */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        paddingLeft: 21,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {formatDateTime(item.created_at)}
                      </span>
                      <Tag
                        color={statusColor(displayStatus)}
                        style={{
                          margin: 0,
                          fontSize: 10,
                          lineHeight: "14px",
                          padding: "0 6px",
                        }}
                      >
                        {displayStatus}
                      </Tag>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* LEFT SIDEBAR BOTTOM: PAGINATION */}
          <div
            className="sidebar-pagination"
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #f1f5f9",
              backgroundColor: "#ffffff",
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Pagination
              pageSize={pageSize}
              current={page}
              total={totalRecords}
              showSizeChanger
              pageSizeOptions={[10, 20, 30]}
              itemRender={(pageNumber, type, originalElement) => {
                // Only show the current page and its direct neighbours
                if (type === "page") {
                  if (pageNumber < page - 1 || pageNumber > page + 1) {
                    return null;
                  }
                  return originalElement;
                }
                return originalElement;
              }}
              onChange={(pages, pageSizes) => {
                sidebarListRef.current?.scrollTo({ top: 0 });
                if (pageSizes !== pageSize) {
                  setPageSize(pageSizes);
                  setPage(1);
                } else {
                  setPage(pages);
                }
                setSelectedComparisonId(null);
                setActiveMobileTab(0);
              }}
            />
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <div
          className="arena-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            height: FULL_HEIGHT,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#f8fafc",
          }}
        >
          {/* Top Bar Header */}
          <header
            style={{
              height: "56px",
              padding: isMobile ? "0 12px" : "0 20px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              gap: 8,
            }}
          >
            <Space size="middle" style={{ minWidth: 0 }}>
              <Button
                type="text"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                icon={
                  sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
                }
                onClick={() => setSidebarOpen((open) => !open)}
              />
              <Title level={5} style={{ margin: 0 }} ellipsis>
                {isMobile ? "Arena" : "LLM Model Evaluation Arena"}
              </Title>
            </Space>

            <Segmented
              value={mobileLayoutMode}
              onChange={setMobileLayoutMode}
              options={[
                { value: "tabs", icon: <AppstoreOutlined />, label: "Tabs" },
                {
                  value: "stack",
                  icon: <UnorderedListOutlined />,
                  label: "Grid View",
                },
              ]}
              size="small"
            />
          </header>

          {/* RIGHT MIDDLE: CONTENT & RESPONSES AREA */}
          <main
            ref={mainRef}
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "12px" : "24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!activeComparison ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <GeminiSparkleIcon color="#2563eb" size={48} />
                <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                  Side-by-Side Model Benchmarking
                </Title>
                <Text type="secondary" style={{ maxWidth: 400 }}>
                  Select a comparison from the sidebar or enter a prompt below
                  to run outputs simultaneously across models.
                </Text>
              </div>
            ) : (
              <div
                style={{
                  maxWidth: "1400px",
                  width: "100%",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* User Prompt */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <Avatar
                    src={activeComparison.created_by_profileImage || undefined}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: "#cbd5e1",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13, color: "#475569" }}>
                      {activeComparison.created_by_username}
                    </Text>
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        marginTop: 4,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "#0f172a" }}>
                        {activeComparison.prompt}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* LIVE PROGRESS (from WebSocket) */}
                {activeLive && (
                  <Card size="small" style={{ borderRadius: 12 }}>
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Space>
                        <Spin size="small" />
                        <Text strong>
                          {activeLive.status === "evaluating"
                            ? "Judge is evaluating responses..."
                            : "Models are generating responses..."}
                        </Text>
                      </Space>
                      {Object.entries(activeLive.models || {}).map(
                        ([rid, m]) => (
                          <div
                            key={rid}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text style={{ fontSize: 13 }}>
                              {m.name || `Response #${rid}`}
                            </Text>
                            <Tag
                              color={
                                m.status === "completed"
                                  ? "success"
                                  : m.status === "failed"
                                    ? "error"
                                    : "processing"
                              }
                              style={{ margin: 0 }}
                            >
                              {m.status}
                            </Tag>
                          </div>
                        ),
                      )}
                    </Space>
                  </Card>
                )}

                {mobileLayoutMode === "tabs" && results.length > 0 && (
                  <Segmented
                    value={Math.min(activeMobileTab, results.length - 1)}
                    onChange={setActiveMobileTab}
                    block
                    options={results.map((response, index) => ({
                      label:
                        response.model ||
                        `Model #${response.llm_project_model_id}`,
                      value: index,
                    }))}
                  />
                )}

                {/* Model Responses Side-by-Side Grid */}
                {results.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fit, minmax(340px, 1fr))",
                      gap: "16px",
                      width: "100%",
                    }}
                  >
                    {results.map((res, index) => {
                      const isVisibleOnMobile =
                        mobileLayoutMode === "stack" ||
                        activeMobileTab === index;
                      if (!isVisibleOnMobile) return null;

                      const isWinner =
                        String(activeComparison.winner_response) ===
                        String(res.id);
                      const isRunning = res.status === "running";

                      return (
                        <Card
                          key={res.id || index}
                          bordered={false}
                          style={{
                            backgroundColor: "#ffffff",
                            border: isWinner
                              ? "2px solid #2563eb"
                              : "1px solid #e2e8f0",
                            borderRadius: "12px",
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                          }}
                          styles={{
                            body: {
                              padding: "16px",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                              minWidth: 0,
                            },
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 8,
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <Space size={6}>
                              <GeminiSparkleIcon color="#2563eb" size={16} />
                              <Text strong style={{ fontSize: 14 }}>
                                {res.model ||
                                  `Model #${res.llm_project_model_id}`}
                              </Text>
                            </Space>
                            <Space size={4}>
                              {isWinner && (
                                <Tag color="blue" icon={<TrophyOutlined />}>
                                  Winner
                                </Tag>
                              )}
                              <Tag>{res.provider || "AI Model"}</Tag>
                            </Space>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 12,
                              paddingBottom: 8,
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            <span>
                              <ClockCircleOutlined />{" "}
                              {typeof res.response_time === "number"
                                ? `${res.response_time.toFixed(2)}s`
                                : "N/A"}
                            </span>
                            <span>
                              <CodeOutlined /> {res.output_tokens || 0} tokens
                            </span>
                          </div>

                          {/* Response body: markdown text + code blocks */}
                          <div
                            style={{
                              flex: 1,
                              minHeight: "120px",
                              minWidth: 0,
                              marginBottom: 12,
                            }}
                          >
                            {isRunning && !res.content ? (
                              <Space>
                                <Spin size="small" />
                                <Text type="secondary">Generating...</Text>
                              </Space>
                            ) : res.content ? (
                              <MarkdownMessage content={res.content} />
                            ) : (
                              <Text
                                type={res.error_message ? "danger" : "secondary"}
                              >
                                {res.error_message || "No content generated."}
                              </Text>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              paddingTop: 8,
                              borderTop: "1px solid #f1f5f9",
                            }}
                          >
                            <Space size="small">
                              <Tooltip title="Copy text">
                                <Button
                                  type="text"
                                  shape="circle"
                                  size="small"
                                  icon={
                                    copiedId === res.id ? (
                                      <CheckOutlined
                                        style={{ color: "#16a34a" }}
                                      />
                                    ) : (
                                      <CopyOutlined />
                                    )
                                  }
                                  onClick={() =>
                                    handleCopy(res.content, res.id)
                                  }
                                />
                              </Tooltip>
                              <Tooltip title="Helpful">
                                <Button
                                  type="text"
                                  shape="circle"
                                  size="small"
                                  icon={<LikeOutlined />}
                                  style={
                                    feedback[res.id] === "up"
                                      ? {
                                          color: "#2563eb",
                                          backgroundColor: "#eff6ff",
                                        }
                                      : undefined
                                  }
                                  onClick={() => handleFeedback(res.id, "up")}
                                />
                              </Tooltip>
                              <Tooltip title="Unhelpful">
                                <Button
                                  type="text"
                                  shape="circle"
                                  size="small"
                                  icon={<DislikeOutlined />}
                                  style={
                                    feedback[res.id] === "down"
                                      ? {
                                          color: "#ef4444",
                                          backgroundColor: "#fef2f2",
                                        }
                                      : undefined
                                  }
                                  onClick={() => handleFeedback(res.id, "down")}
                                />
                              </Tooltip>
                            </Space>
                            <Tooltip title="Regenerate">
                              <Button
                                type="text"
                                shape="circle"
                                size="small"
                                icon={<ReloadOutlined />}
                                disabled
                              />
                            </Tooltip>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  !activeLive && (
                    <Text type="secondary">
                      Status: {activeComparison.status} (No response details
                      available)
                    </Text>
                  )
                )}
              </div>
            )}
          </main>

          {/* RIGHT BOTTOM: PROMPT INPUT FOOTER */}
          <footer
            style={{
              padding: isMobile ? "12px" : "16px 24px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "3px 12px",
                }}
              >
                <TextArea
                  className="no-focus-border"
                  value={promptInput}
                  onChange={(event) => setPromptInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder="Send a message to compare LLM responses..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  bordered={false}
                  style={{
                    padding: 0,
                    fontSize: 14,
                    boxShadow: "none",
                    resize: "none",
                    border: "none",
                  }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={handleSendPrompt}
                  disabled={!promptInput.trim() || isLoading}
                  loading={isLoading}
                  style={{
                    backgroundColor: "#2563eb",
                    flexShrink: 0,
                    color: "white",
                  }}
                />
              </div>
              {!isMobile && (
                <Text
                  type="secondary"
                  style={{ fontSize: 11, textAlign: "center" }}
                >
                  Shift + Enter for line break • Powered by LLM Arena Engine
                </Text>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
