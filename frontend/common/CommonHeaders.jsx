import React, { useEffect, useRef, useState } from "react";
import {
  Layout,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Tooltip,
  Divider,
  Empty,
  Modal,
  notification,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useDispatch, useSelector } from "react-redux";
import "../common/CommonHeadersStyle.css";
import { Link, useNavigate } from "react-router-dom";
import {
  BellOutlined,
  UserOutlined,
  ProjectOutlined,
  LockOutlined,
  LogoutOutlined,
  MessageOutlined,
  MenuUnfoldOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { LogoutThunkApi } from "../slice/Auth.Slice";
import {
  recentNotificationThunkApi,
  unreadNotificationCountThunkApi,
  markAllNotificationsReadThunkApi,
  receiveNotification,
} from "../slice/Notification.Slice";
import { unReadCountThunkApi } from "../slice/Conversations.Slice";

dayjs.extend(relativeTime);

const { Header } = Layout;

// ==================== WEBSOCKET CONFIG ====================
// Use wss://your-api-domain in production.
const WS_BASE = "ws://localhost:8000";
const WS_PATH = "/ws/notification/"; // must match routing.py
const HEARTBEAT_MS = 30000;
const MAX_RETRY_DELAY_MS = 30000;
const AUTH_FAILED_CODE = 4001; // consumer closes with this when not authenticated
const CONTROL_TYPES = ["connection_established", "pong", "error"];

// Accepts {..notification..}, {data: {..}} or {notification: {..}}.
// Numeric ids ("12") become numbers so they match the ids from the REST API.
const toId = (value) => (/^\d+$/.test(String(value)) ? Number(value) : value);

// Turns the socket payload into the same shape the REST API returns.
const extractNotification = (payload) => {
  if (!payload || CONTROL_TYPES.includes(payload.type)) return null;

  const id = payload.notification_id ?? payload.id;
  if (id === undefined || id === null) return null;

  return {
    ...payload,
    id: toId(id),
    type: payload.notification_type ?? payload.type,
  };
};

// "project_created" -> "Project created"
const humanize = (value) => {
  if (!value) return "Notification";
  const text = String(value).replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function CommonHeader({
  collapsed,
  setCollapsed,
  isMobile,
  mobileOpen,
  setMobileOpen,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user_detail = useSelector((state) => state.auth.user_detail);
  const notification_data = useSelector((state) => state.notification);
  const [message, contextHolder] = notification.useNotification();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadChatMessagesCount, setUnreadChatMessagesCount] = useState(0);

  // Keep the latest `message` api available inside the socket handler
  // without reconnecting the socket on every render.
  const messageRef = useRef(message);
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const canUseNotifications = Boolean(
    (user_detail?.user_role === "user" &&
      user_detail?.workspace_role === "owner") ||
    user_detail?.workspace_role === "member",
  );

  const recentNotifications = notification_data?.recent || [];
  const unreadCount = notification_data?.unreadCount || 0;

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    if (!canUseNotifications) return;

    dispatch(recentNotificationThunkApi())
      .unwrap()
      .catch((error) => {
        console.log(error);

        messageRef.current.error({
          title: "Error",
          description: error?.message || error,
        });
      });

    dispatch(unreadNotificationCountThunkApi());
    dispatch(unReadCountThunkApi()).unwrap()
      .then((res) => {
        setUnreadChatMessagesCount(res.data.unread_count);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error?.message || error,
        });
      });
  }, [canUseNotifications, dispatch]);

  // ==================== REAL-TIME WEBSOCKET ====================
  useEffect(() => {
    if (!canUseNotifications) return;

    let socket = null;
    let retryTimer = null;
    let heartbeat = null;
    let retries = 0;
    let closedByUs = false;

    const connect = () => {
      // Read the token on every attempt so a refreshed token is used.
      const token = localStorage.getItem("access");
      if (!token) return;

      socket = new WebSocket(
        `${WS_BASE}${WS_PATH}?token=${encodeURIComponent(token)}`,
      );

      socket.onopen = () => {
        const wasReconnect = retries > 0;
        retries = 0;

        // Re-sync anything missed while the connection was down.
        if (wasReconnect) {
          dispatch(unreadNotificationCountThunkApi());
          dispatch(recentNotificationThunkApi());
        }

        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, HEARTBEAT_MS);
      };

      socket.onmessage = (event) => {
        console.log(event.data);
        try {
          const item = extractNotification(JSON.parse(event.data));
          if (!item) return; // connection_established / pong / error

          dispatch(receiveNotification(item));

          messageRef.current.info({
            title: item.title || humanize(item.notification_type || item.type),
            description: item.message,
            placement: "topRight",
          });
        } catch (err) {
          console.error("Invalid notification payload", err);
        }
      };

      socket.onerror = () => socket?.close();

      socket.onclose = (event) => {
        clearInterval(heartbeat);
        if (closedByUs) return;

        // Not authenticated: retrying with the same token won't help.
        if (event.code === AUTH_FAILED_CODE) {
          console.warn("Notification socket rejected: not authenticated.");
          return;
        }

        const delay = Math.min(1000 * 2 ** retries, MAX_RETRY_DELAY_MS);
        retries += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      clearInterval(heartbeat);
      socket?.close();
    };
  }, [canUseNotifications, dispatch]);

  // ==================== HANDLERS ====================
  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      content: "Are you sure you want to logout?",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => {
        const data = { refresh: localStorage.getItem("refresh") };
        dispatch(LogoutThunkApi(data))
          .unwrap()
          .then((res) => {
            message.success({ title: "Success", description: res.message });
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            setTimeout(() => navigate("/login/"), 1000);
          })
          .catch((error) => {
            message.error({ title: "Error", description: error });
          });
      },
    });
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsReadThunkApi())
      .unwrap()
      .catch((error) =>
        message.error({
          title: "Error",
          description: error?.message || error,
        }),
      );
  };

  const handleOpenNotification = (item) => {
    setDropdownOpen(false);
    navigate(`/notifications/`); // detail page marks it as read
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    navigate("/notifications/");
  };

  const profileMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/update-profile/">Update Profile</Link>,
    },
    ...(user_detail?.workspace_role === "owner"
      ? [
          {
            key: "update-workspace",
            icon: <UserOutlined />,
            label: <Link to="/update-workspace/">Update Workspace</Link>,
          },
        ]
      : []),
    {
      key: "password",
      icon: <LockOutlined />,
      label: <Link to="/reset-password/">Reset Password</Link>,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      {contextHolder}
      <Header className="common-header">
        {/* Left side trigger & page title */}
        <div className="header-left">
          {isMobile && (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-header-trigger"
            />
          )}
          <div className="header-welcome">
            <div className="welcome-title">
              <ThunderboltOutlined className="welcome-icon" />{" "}
              {user_detail?.workspace_name || "Admin Workspace"}
            </div>
            <div className="welcome-subtitle">
              Compare, evaluate, and deploy models in real-time
            </div>
          </div>
        </div>

        {/* Right side actions & profile */}
        <div className="header-right">
          {canUseNotifications && (
            <>
              {/* Chat Button */}
              <Tooltip title="Messages" placement="bottom">
                <Badge
                  count={unreadChatMessagesCount}
                  size="small"
                  offset={[-4, 4]}
                >
                  <Button
                    type="text"
                    className="header-icon-btn chat-icon-btn"
                    icon={<MessageOutlined />}
                    aria-label="Messages"
                    onClick={() =>{
                      setUnreadChatMessagesCount(0)
                      navigate("/chat")}
                    } 
                  />
                </Badge>
              </Tooltip>

              {/* Notification Button */}
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
                dropdownRender={() => (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <div>
                        <h4>Notifications</h4>
                        <span>
                          {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${
                                unreadCount > 1 ? "s" : ""
                              }`
                            : "You're all caught up"}
                        </span>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        style={{ color: "#4f46e5" }}
                        disabled={unreadCount === 0}
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </Button>
                    </div>
                    <Divider style={{ margin: 0 }} />

                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {recentNotifications.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="No notifications yet"
                          style={{ padding: "24px 0" }}
                        />
                      ) : (
                        recentNotifications.map((instance) => (
                          <div
                            key={instance.id}
                            className={`notification-item ${
                              !instance.is_read ? "unread" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleOpenNotification(instance)}
                          >
                            <div className="notification-avatar">
                              <ProjectOutlined />
                            </div>

                            <div className="notification-content">
                              <strong>
                                {instance.title ||
                                  humanize(
                                    instance.notification_type || instance.type,
                                  )}
                              </strong>
                              <p>{instance.message}</p>
                              <small>
                                {dayjs(instance.created_at).isValid()
                                  ? dayjs(instance.created_at).fromNow()
                                  : ""}
                              </small>
                            </div>

                            {!instance.is_read && (
                              <span className="unread-dot" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <Divider style={{ margin: 0 }} />
                    <div className="notification-footer">
                      <Button
                        type="link"
                        block
                        style={{ color: "#4f46e5" }}
                        onClick={handleViewAll}
                      >
                        View all notifications
                      </Button>
                    </div>
                  </div>
                )}
              >
                <Tooltip title="Notifications" placement="bottom">
                  <Badge
                    count={unreadCount}
                    overflowCount={99}
                    size="small"
                    offset={[-4, 4]}
                  >
                    <Button
                      type="text"
                      className="header-icon-btn chat-icon-btn"
                      icon={<BellOutlined />}
                      aria-label="Notifications"
                    />
                  </Badge>
                </Tooltip>
              </Dropdown>
            </>
          )}

          <Dropdown
            menu={{ items: profileMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="profile-wrapper">
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={user_detail?.profile_image}
                className="profile-avatar"
              />
              <div className="profile-info">
                <span className="profile-name"></span>
                <span className="profile-role"></span>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>
    </>
  );
}
