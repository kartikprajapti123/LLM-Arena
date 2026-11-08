import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Switch,
  Card,
  Row,
  Col,
  Space,
  Dropdown,
  Spin,
  Popconfirm,
  Typography,
  notification,
  Tooltip,
  Pagination,
  Avatar,
} from "antd";

import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  MessageOutlined,
  MoreOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MailOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  listWorkspaceMemberThunkApi,
  // destroyWorkspaceMemberThunkApi,
  // updateWorkspaceMemberThunkApi
} from "../../slice/Workspace.Slice";
import { createConversationThunkApi } from "../../slice/Conversations.Slice";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

export const WorkspaceMember = () => {
  const [message, contextHolder] = notification.useNotification();
  const [dataLoading, setDataLoading] = useState(false);
  const user_detail = useSelector((state) => state.auth.user_detail);
  // Filters & Pagination State
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [Ordering, setOrdering] = useState();
  const [chatCreationLoading, setChatCreationLoading] = useState(false);
  const [chatLoadingUserId,setChatLoadingUserId]=useState(null)
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const members = useSelector(
    (state) => state.workspaceMember || { data: [], count: 0 },
  );

  // Fetch Member List
  useEffect(() => {
    handleListWorkspaceMembers(true);
  }, [page, pageSize, searchText, roleFilter, statusFilter]);

  useEffect(() => {
    handleListWorkspaceMembers(false);
  }, [Ordering]);

  const handleListWorkspaceMembers = (isLoading) => {
    if (isLoading) {
      setDataLoading(true);
    }
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: Ordering,
      role_filter: roleFilter,
      status_filter: statusFilter,
    };

    dispatch(listWorkspaceMemberThunkApi(params))
      .unwrap()
      .then(() => {
        setDataLoading(false);
      })
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error",
          description:
            error?.message || error || "Failed to fetch workspace members.",
        });
      });
  };

  // Toggle Active/Inactive Status

  // Remove Member
  // const handleDelete = (id) => {
  //   dispatch(destroyWorkspaceMemberThunkApi(id))
  //     .unwrap()
  //     .then((res) => {
  //       message.success({
  //         title: "Success",
  //         description: res?.message || "Member removed successfully.",
  //       });
  //       handleListWorkspaceMembers(false);
  //     })
  //     .catch((error) => {
  //       message.error({
  //         title: "Error",
  //         description: error?.message || error || "Failed to remove member.",
  //       });
  //     });
  // };

  // Sorting Handler
  const GetSortingEnumValue = (sortField, sortOrder) => {
    let sortingEnumKey = "";
    if (sortField === "username" && sortOrder === "ascend")
      sortingEnumKey = "user__username";
    if (sortField === "username" && sortOrder === "descend")
      sortingEnumKey = "-user__username";
    if (sortField === "role" && sortOrder === "ascend") sortingEnumKey = "role";
    if (sortField === "role" && sortOrder === "descend")
      sortingEnumKey = "-role";
    if (sortField === "joined_at" && sortOrder === "ascend")
      sortingEnumKey = "joined_at";
    if (sortField === "joined_at" && sortOrder === "descend")
      sortingEnumKey = "-joined_at";

    return sortingEnumKey;
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter?.columnKey && sorter.order) {
      const orderBy = GetSortingEnumValue(sorter.columnKey, sorter.order);
      if (orderBy !== Ordering) {
        setOrdering(orderBy);
      }
    }
  };

  const handleCreateConversation = (user_id) => {
    const data = {
      workspace: user_detail.workspace,
      conversation_type: "direct",
      participant_ids: [user_id],
    };
    setChatCreationLoading(true);
    setChatLoadingUserId(user_id)
    dispatch(createConversationThunkApi(data))
      .unwrap()
      .then((res) => {
        setChatLoadingUserId(null)
        setChatCreationLoading(false);
        message.success({
          title: "Success",
          description: res.message,
        });

        setTimeout(() => {
          navigate(`/chat/?conversation_id=${res.data.id}`);
        }, [2000]);
      })
      .catch((error) => {
        setChatLoadingUserId(null)
        setChatCreationLoading(false);
        message.error({
          title: "Error",
          description: error,
        });
      });
  };

  // Table Columns Setup
  const columns = [
    {
      title: "Member",
      dataIndex: "username",
      key: "username",
      width: 250,
      sorter: true,
      render: (text, record) => (
        <Space size="middle">
          <Avatar
            src={record.profile_image}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#4f46e5" }}
          />
          <div>
            <Text strong style={{ display: "block" }}>
              {text || "Unknown User"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.user_email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: true,

      width: 150,
      render: (role) => {
        const isOwner =
          role?.toLowerCase() === "owner" || role?.toLowerCase() === "admin";
        return (
          <Tag
            color={isOwner ? "gold" : "#4f46e5"}
            icon={isOwner ? <CrownOutlined /> : <UserOutlined />}
          >
            {(role || "Member").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, record) => {
        if (!record.is_active) {
          return (
            <Tag icon={<StopOutlined />} color="error">
              Disabled
            </Tag>
          );
        }
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        );
      },
    },
    {
      title: "Joined On",
      dataIndex: "joined_at",
      key: "joined_at",
      width: 150,
      sorter: true,
      render: (date) => (
        <Text type="secondary">
          {date ? new Date(date).toLocaleDateString("en-GB") : "N/A"}
        </Text>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 150,
      render: (_, record) => {
        const isCurrentUser = String(user_detail?.id) === String(record?.user);

        if (isCurrentUser) {
          return (
            <Tooltip title="This is your account">
              <span className="workspace-member-you">
                <UserOutlined />
                <span>You</span>
              </span>
            </Tooltip>
          );
        }

        return (
          <Tooltip title="Start a private conversation">
            <Button
              className="workspace-member-chat-btn"
              style={{"color":"white"}}
              icon={<MessageOutlined />}
              loading={String(chatLoadingUserId) === String(record.user)}
              disabled={chatLoadingUserId !== null}
              onClick={() => handleCreateConversation(record.user)}
            >
              Chat
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper">
        {/* Top Header Bar */}
        <div className="top-action-bar">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Workspace Members
            </Title>
            <Text type="secondary">
              View, search, filter, and manage members within your workspace.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setRoleFilter(undefined);
                setStatusFilter(undefined);
              }}
            >
              Reset Filters
            </Button>
          </Space>
        </div>

        {/* Data Table Container */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Isolated Filter Box */}
              <div
                className="filter-box-container"
                style={{ marginBottom: 20 }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={12} lg={12}>
                    <Input
                      placeholder="Search by name or email address..."
                      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      size="large"
                    />
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={6}>
                    <Select
                      value={roleFilter}
                      onChange={setRoleFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select Role"
                      allowClear
                    >
                      <Option value="admin">Admin</Option>
                      <Option value="member">Member</Option>
                      <Option value="viewer">Viewer</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={6}>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select Status"
                      allowClear
                    >
                      <Option value="true">Active Only</Option>
                      <Option value="false">InActive Only</Option>
                    </Select>
                  </Col>
                </Row>
              </div>

              {/* Data Table */}
              <Card className="table-card" title="Members List">
                {dataLoading ? (
                  <div
                    style={{
                      minHeight: "50vh",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "16px",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    <Spin size="large" className="green-spin" style={{color:"#4f46e5"}} />
                    <Text
                      type="secondary"
                      style={{ fontSize: "16px", fontWeight: 500 }}
                    >
                      Fetching workspace members...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={members.data}
                      scroll={{ x: "max-content" }}
                      tableLayout="fixed"
                      pagination={false}
                      onChange={handleTableChange}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 20,
                      }}
                    >
                      <Pagination
                        pageSize={pageSize}
                        current={page}
                        total={members.count}
                        showTotal={(total) => `Total ${total} members`}
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
          </Col>
        </Row>
      </div>
    </>
  );
};
