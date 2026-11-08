import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Segmented,
  Space,
  Spin,
  Typography,
  Badge,
  Avatar,
  Tag,
  Tooltip,
  Pagination,
  Popconfirm,
  Drawer,
  Empty,
  notification,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  listNotificationThunkApi,
  retrieveNotificationThunkApi,
  unreadNotificationCountThunkApi,
  markNotificationReadThunkApi,
  markAllNotificationsReadThunkApi,
  destroyNotificationThunkApi,
  clearAllNotificationsThunkApi,
  clearSelectedNotification,
} from "../slice/Notification.Slice";

const { Title, Text, Paragraph } = Typography;

const PRIMARY = "#4f46e5";

// Maps a notification type to an icon + colour. Unknown types fall back to "info".
const TYPE_CONFIG = {
  info: { icon: <InfoCircleOutlined />, color: "#4f46e5", bg: "#eef2ff" },
  success: { icon: <CheckCircleOutlined />, color: "#16a34a", bg: "#f0fdf4" },
  warning: { icon: <WarningOutlined />, color: "#d97706", bg: "#fffbeb" },
  error: { icon: <CloseCircleOutlined />, color: "#dc2626", bg: "#fef2f2" },
};

const getTypeConfig = (type) =>
  TYPE_CONFIG[String(type || "info").toLowerCase()] || TYPE_CONFIG.info;

// "5 minutes ago", "2 days ago", otherwise a short date.
const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB");
};

const formatFullDate = (value) =>
  value ? new Date(value).toLocaleString("en-GB") : "N/A";

export const Notification = () => {
  const dispatch = useDispatch();
  const [message, contextHolder] = notification.useNotification();

  const { data, totalRecords, unreadCount, selectedNotification } =
    useSelector(
      (state) =>
        state.notification || {
          data: [],
          totalRecords: 0,
          unreadCount: 0,
          selectedNotification: null,
        },
    );

  const [dataLoading, setDataLoading] = useState(false);
  const [readFilter, setReadFilter] = useState("all"); // all | unread | read
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showError = useCallback(
    (error, fallback) =>
      message.error({
        title: "Error",
        description: error?.message || error || fallback,
      }),
    [message],
  );

  const handleListNotifications = useCallback(
    (isLoading = true) => {
      if (isLoading) setDataLoading(true);

      const params = { page, pageSize };
      if (readFilter === "unread") params.is_read = false;
      if (readFilter === "read") params.is_read = true;

      dispatch(listNotificationThunkApi(params))
        .unwrap()
        .catch((error) => showError(error, "Failed to fetch notifications."))
        .finally(() => setDataLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, page, pageSize, readFilter],
  );

  useEffect(() => {
    handleListNotifications(true);
  }, [handleListNotifications]);

  useEffect(() => {
    dispatch(unreadNotificationCountThunkApi());
  }, [dispatch]);

  // ==================== ACTIONS ====================

  const handleMarkRead = (id) => {
    dispatch(markNotificationReadThunkApi(id))
      .unwrap()
      .catch((error) => showError(error, "Failed to mark as read."));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsReadThunkApi())
      .unwrap()
      .then(() =>
        message.success({
          title: "Success",
          description: "All notifications marked as read.",
        }),
      )
      .catch((error) => showError(error, "Failed to mark all as read."));
  };

  const handleDelete = (id) => {
    dispatch(destroyNotificationThunkApi(id))
      .unwrap()
      .then(() => {
        message.success({
          title: "Success",
          description: "Notification deleted.",
        });
        // Refill the page if the last item on it was removed.
        if (data.length === 1 && page > 1) setPage(page - 1);
        else handleListNotifications(false);
      })
      .catch((error) => showError(error, "Failed to delete notification."));
  };

  const handleClearAll = () => {
    dispatch(clearAllNotificationsThunkApi())
      .unwrap()
      .then(() => {
        setPage(1);
        message.success({
          title: "Success",
          description: "All notifications cleared.",
        });
      })
      .catch((error) => showError(error, "Failed to clear notifications."));
  };

  const handleOpenNotification = (item) => {
    setDrawerVisible(true);
    dispatch(retrieveNotificationThunkApi(item.id))
      .unwrap()
      .catch((error) => showError(error, "Failed to load notification."));
    if (!item.is_read) handleMarkRead(item.id);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    dispatch(clearSelectedNotification());
  };

  const handleResetFilters = () => {
    setReadFilter("all");
    setPage(1);
  };

  // ==================== RENDER HELPERS ====================

  const renderItem = (item) => {
    const cfg = getTypeConfig(item.notification_type || item.type);
    const unread = !item.is_read;

    return (
      <div
        key={item.id}
        onClick={() => handleOpenNotification(item)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          padding: "16px 20px",
          cursor: "pointer",
          background: unread ? "#f8f9ff" : "#fff",
          borderLeft: `3px solid ${unread ? PRIMARY : "transparent"}`,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Avatar
          size={40}
          icon={cfg.icon}
          style={{ background: cfg.bg, color: cfg.color, flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text strong={unread} ellipsis style={{ fontSize: 15 }}>
              {item.title || "Notification"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </div>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ margin: "4px 0 0" }}
          >
            {item.message || item.description || item.body || ""}
          </Paragraph>
        </div>

        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {unread && (
            <Tooltip title="Mark as read">
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleMarkRead(item.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete Notification"
            description="Are you sure you want to delete this notification?"
            onConfirm={() => handleDelete(item.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>
    );
  };

  const emptyText =
    readFilter === "unread"
      ? "You're all caught up. No unread notifications."
      : readFilter === "read"
        ? "No read notifications yet."
        : "You have no notifications.";

  const detailCfg = getTypeConfig(
    selectedNotification?.notification_type || selectedNotification?.type,
  );

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper">
        {/* Top Header Bar */}
        <div className="top-action-bar">
          <div>
            <Space size="middle" align="center">
              <Title level={3} style={{ margin: 0 }}>
                Notifications
              </Title>
              {unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  overflowCount={99}
                  style={{ backgroundColor: PRIMARY }}
                />
              )}
            </Space>
            <div>
              <Text type="secondary">
                Stay up to date with activity across your workspace.
              </Text>
            </div>
          </div>

          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
            <Button
              size="large"
              icon={<CheckOutlined />}
              disabled={unreadCount === 0}
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
            <Popconfirm
              title="Clear All Notifications"
              description="This will permanently delete every notification. Continue?"
              onConfirm={handleClearAll}
              okText="Clear All"
              cancelText="Cancel"
              disabled={totalRecords === 0}
            >
              <Button
                danger
                size="large"
                icon={<DeleteOutlined />}
                disabled={totalRecords === 0}
              >
                Clear All
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {/* Content */}
        <Card variant="borderless" className="content-box-card">
          <div style={{ marginBottom: 20 }}>
            <Segmented
              size="large"
              value={readFilter}
              onChange={(value) => {
                setReadFilter(value);
                setPage(1);
              }}
              options={[
                { label: "All", value: "all" },
                { label: `Unread${unreadCount ? ` (${unreadCount})` : ""}`, value: "unread" },
                { label: "Read", value: "read" },
              ]}
            />
          </div>

          <Card
            className="table-card"
            title="Notification List"
            styles={{ body: { padding: 0 } }}
          >
            {dataLoading ? (
              <div
                style={{
                  minHeight: "50vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spin size="large" />
                <Text type="secondary" style={{ marginTop: 16 }}>
                  Fetching notifications...
                </Text>
              </div>
            ) : data.length === 0 ? (
              <div style={{ padding: "64px 0" }}>
                <Empty
                  image={
                    <BellOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
                  }
                  description={emptyText}
                />
              </div>
            ) : (
              <>
                <div>{data.map(renderItem)}</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: 20,
                  }}
                >
                  <Pagination
                    pageSize={pageSize}
                    current={page}
                    total={totalRecords}
                    showTotal={(total) => `Total ${total} notifications`}
                    showSizeChanger
                    pageSizeOptions={[10, 20, 30]}
                    onChange={(pages, pageSizes) => {
                      if (pageSizes !== pageSize) {
                        setPageSize(pageSizes);
                        setPage(1);
                      } else {
                        setPage(pages);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </Card>
        </Card>

        {/* Detail Drawer */}
        <Drawer
          title="Notification Details"
          width={450}
          open={drawerVisible}
          onClose={handleCloseDrawer}
          extra={
            selectedNotification && (
              <Popconfirm
                title="Delete Notification"
                description="Are you sure you want to delete this notification?"
                onConfirm={() => {
                  handleDelete(selectedNotification.id);
                  handleCloseDrawer();
                }}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )
          }
        >
          {!selectedNotification ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <Spin />
            </div>
          ) : (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Space size="middle" align="start">
                <Avatar
                  size={48}
                  icon={detailCfg.icon}
                  style={{ background: detailCfg.bg, color: detailCfg.color }}
                />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {selectedNotification.title || "Notification"}
                  </Title>
                  <Text type="secondary">
                    {formatFullDate(selectedNotification.created_at)}
                  </Text>
                </div>
              </Space>

              <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                {selectedNotification.message ||
                  selectedNotification.description ||
                  selectedNotification.body ||
                  "No additional details."}
              </Paragraph>

              <Space wrap>
                {selectedNotification.is_read ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    READ
                  </Tag>
                ) : (
                  <Tag color="processing">UNREAD</Tag>
                )}
                {(selectedNotification.notification_type ||
                  selectedNotification.type) && (
                  <Tag>
                    {String(
                      selectedNotification.notification_type ||
                        selectedNotification.type,
                    ).toUpperCase()}
                  </Tag>
                )}
              </Space>

              {selectedNotification.read_at && (
                <Text type="secondary">
                  Read on {formatFullDate(selectedNotification.read_at)}
                </Text>
              )}
            </Space>
          )}
        </Drawer>
      </div>
    </>
  );
};

export default Notification;
