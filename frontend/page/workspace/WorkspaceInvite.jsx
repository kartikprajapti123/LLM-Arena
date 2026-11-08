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
  Drawer,
  Form,
  Dropdown,
  Spin,
  Popconfirm,
  Typography,
  notification,
  Tooltip,
  Divider,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  LinkOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createWorkspaceInviteThunkApi,
  destroyWorkspaceInviteThunkApi,
  listWorkspaceInviteThunkApi,
  updateWorkspaceInviteThunkApi,
} from "../../slice/Workspace.Slice";

const { Title, Text } = Typography;
const { Option } = Select;

export const WorkspaceInvite = () => {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);

  // Filters state
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const dispatch = useDispatch();
  const user_detail = useSelector((state) => state.auth.user_detail);
  // Sample Invites Data (with usage counters)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [Ordering, setOrdering] = useState();
  const invites = useSelector((state) => state.workspaceInvite);
  console.log(invites.data);
  useEffect(() => {
    handleListWorkspaceInvites(true);
  }, [page, pageSize, searchText, statusFilter]);

  useEffect(() => {
    handleListWorkspaceInvites(false);
  }, [Ordering]);

  const handleListWorkspaceInvites = (isloading) => {
    if (isloading) {
      setDataLoading(true);
    }
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: Ordering,
      statusFilter: statusFilter,
    };
    dispatch(listWorkspaceInviteThunkApi(params))
      .unwrap()
      .then((res) => {
        setDataLoading(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
      });
  };
  const handleCopyLink = (code) => {
    navigator.clipboard.writeText(code);
    message.success({
      title: "Copied to Clipboard",
      description: `Invite Code: ${fullUrl}`,
    });
  };

  // Open Drawer for Create or Edit
  const openDrawer = (inviteRecord = null) => {
    setSelectedInvite(inviteRecord);
    if (inviteRecord) {
      form.setFieldsValue({
        invite_code: inviteRecord.invite_code,
        is_active: inviteRecord.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
    }
    setDrawerOpen(true);
  };

  // Close Drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedInvite(null);
    form.resetFields();
  };

  // Form Submission
  const onFinish = (values) => {
    setLoading(true);
    if (selectedInvite) {
      const data = {
        workspace: user_detail?.workspace.id,
        invite_code: values.invite_code,
        is_active: values.is_active,
      };
      dispatch(
        updateWorkspaceInviteThunkApi({ id: selectedInvite.id, data: data }),
      )
        .unwrap()
        .then((res) => {
          console.log("updated")
          setLoading(false);
          message.success({
            title: "Invite Code Updated",
            description: "Workspace invite details modified successfully.",
          });
          closeDrawer();
        })
        .catch((error) => {
          console.log("not updated")

          setLoading(false);
          message.error({
            title: "Error",
            description: error,
          });
        });
    } else {
      const data = {
        invite_code: values.invite_code,
        workspace: user_detail?.workspace,
        is_active: values.is_active,
      };

      console.log(data)

      dispatch(createWorkspaceInviteThunkApi(data))
        .unwrap()
        .then((res) => {
          setLoading(false);
          message.success({
            title: "Invite Generated",
            description: "New active invitation link created successfully.",
          });

          closeDrawer();
        })
        .catch((error) => {
          setLoading(false);
          console.log(error);
          message.error({
            title: "Error",
            description: error.message || error,
          });
        });
    }
  };

  // Toggle Active Status Manual Switch
  

  // Delete Invite Link
  const handleDelete = (id) => {
    dispatch(destroyWorkspaceInviteThunkApi())
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
      });
  };

  // Filter Data

  // Table Columns (Full Width Spacing)
  const columns = [
    {
      title: "Workspace Target",
      dataIndex: "workspace_name",
      key: "workspace_name",
      width: 200,
      sorter: true,
      render: (text) => (
        <Space>
          <KeyOutlined style={{ color: "#2563eb" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Invite Code Token",
      dataIndex: "invite_code",
      key: "invite_code",
      width: 200,

      render: (code) => (
        <Space size="small"  >
          <Tag color="#4f46e5" className="invite-code-tag" >
            {code}
          </Tag>
          <Tooltip title="Copy Invite Link">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(code)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 200,

      render: (_, record) => {
        if (!record.is_active && record.use_count >= record.max_uses) {
          return (
            <Tag icon={<StopOutlined />} color="default">
              Used / Exhausted
            </Tag>
          );
        }
        if (!record.is_active) {
          return <Tag color="error">Disabled</Tag>;
        }
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        );
      },
    },
    
    {
      title: "Created On",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString("en-GB")}
        </Text>
      ),
      sorter: true,
    },
    ...(user_detail?.workspace_role === "owner"
      ? [
          {
            title: "Actions",
            key: "actions",
            align: "right",
            width: 100,

            render: (_, record) => {
              const menuItems = [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit Code & Limits",
                  onClick: () => openDrawer(record),
                },
                {
                  key: "copy",
                  icon: <LinkOutlined />,
                  label: "Copy Full URL",
                  onClick: () => handleCopyLink(record.invite_code),
                },
                { type: "divider" },
                {
                  key: "delete",
                  danger: true,
                  icon: <DeleteOutlined />,
                  label: (
                    <Popconfirm
                      title="Revoke Invite"
                      description="Are you sure you want to delete this invite link?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="Revoke"
                      cancelText="Cancel"
                    >
                      <span>Revoke Link</span>
                    </Popconfirm>
                  ),
                },
              ];

              return (
                <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              );
            },
          },
        ]
      : []),
  ];

  const GetSortingEnumValue = (sortField, sortOrder) => {
    let sortingEnumKey = "";

    if (sortField === "workspace_name" && sortOrder === "ascend") {
      sortingEnumKey = "workspace_name";
    }
    if (sortField === "workspace_name" && sortOrder === "descend") {
      sortingEnumKey = "-workspace_name";
    }

    if (sortField === "created_at" && sortOrder === "ascend") {
      sortingEnumKey = "created_at";
    }
    if (sortField === "created_at" && sortOrder === "descend") {
      sortingEnumKey = "-created_at";
    }

    console.log(sortingEnumKey);
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

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper">
        {/* Top Header Bar */}
        <div className="top-action-bar">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Workspace Invites
            </Title>
            <Text type="secondary">
              Generate, monitor, and configure join tokens and invite links.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter();
              }}
            >
              Reset Filters
            </Button>
            {user_detail?.workspace_role === "owner" ? (
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => openDrawer()}
                className="btn-primary-custom"
              >
                Create Invite Link
              </Button>
            ) : null}
          </Space>
        </div>

        {/* Full-Width Table Card (Span 24) */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Isolated Filter Box */}
              <div className="filter-box-container">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={14} md={16} lg={18}>
                    <Input
                      placeholder="Search by workspace name or invite code..."
                      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      size="large"
                    />
                  </Col>
                  <Col xs={24} sm={10} md={8} lg={6}>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select Status"
                    >
                      <Option value="true">Active Only</Option>
                      <Option value="false">InActive Only</Option>
                    </Select>
                  </Col>
                </Row>
              </div>

              {/* Expanded Data Table */}
              <Card className="table-card" title="Product List">
                {dataLoading ? (
                  <div
                    style={{
                      minHeight: "60vh",
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
                    <Spin size="large" className="green-spin"  style={{color:"#4f46e5"}}/>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: "16px",
                        fontWeight: 500,
                      }}
                    >
                      Fetching Workspace Invite data...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={invites.data}
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
                        total={invites.count}
                        showTotal={(total) => `Total ${total}`}
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

        {/* Slide-out Drawer for Create & Update */}
        <Drawer
          title={
            <Space align="center">
              <LinkOutlined style={{ color: "#2563eb" }} />
              <span>
                {selectedInvite
                  ? "Edit Invite Configuration"
                  : "Create Workspace Invite"}
              </span>
            </Space>
          }
          width={440}
          onClose={closeDrawer}
          open={drawerOpen}
          destroyOnClose
          footer={
            <div className="drawer-footer-actions">
              <Button size="large" onClick={closeDrawer}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={() => form.submit()}
                className="btn-primary-custom"
              >
                {selectedInvite ? "Save Changes" : "Generate Code"}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="drawer-form-content"
          >
            <Form.Item
              label="Invite Code / Token"
              name="invite_code"
              extra="Auto-generated if left empty during creation."
              rules={
                selectedInvite
                  ? [{ required: true, message: "Invite code cannot be blank" }]
                  : []
              }
            >
              <Input
                prefix={<KeyOutlined style={{ color: "#bfbfbf" }} />}
                placeholder={
                  selectedInvite ? "INV-XXXXX" : "Auto-generated token"
                }
                size="large"
              />
            </Form.Item>

            <Divider />

            <div className="drawer-status-toggle">
              <div>
                <Text strong style={{ display: "block" }}>
                  Active Invitation Link
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Allow users to join using this token when active.
                </Text>
              </div>
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch style={{background:"#4f46e5"}} />
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </>
  );
};
