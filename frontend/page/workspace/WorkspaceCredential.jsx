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
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createWorkspaceCredentialThunkApi,
  destroyWorkspaceCredentialThunkApi,
  listWorkspaceCredentialThunkApi,
  updateWorkspaceCredentialThunkApi,
} from "../../slice/Workspace.Slice";
// Import your LLM Provider thunk (adjust path as needed)
import { listLLMProviderThunkApi } from "../../slice/LLMProvider.Slice";

const { Title, Text } = Typography;
const { Option } = Select;

export const WorkspaceCredential = () => {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [visibleKeyId, setVisibleKeyId] = useState(null);

  // Filters & Pagination state
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ordering, setOrdering] = useState();

  const dispatch = useDispatch();
  const user_detail = useSelector((state) => state.auth.user_detail);
  const credentials = useSelector(
    (state) => state.workspaceCredential || { data: [], count: 0 },
  );

  // Dynamic Redux Selector for LLM Providers
  const llmProviders = useSelector((state) => state.LLMProvider.data);
  console.log(llmProviders);

  // Map dynamic LLM provider options from Redux state
  // Fetch Providers and Workspace Credentials on mount
  useEffect(() => {
    // Fetch LLM Providers if not loaded
    dispatch(listLLMProviderThunkApi({ no_pagination: true })).catch(() => {
      message.error({
        title: "Error",
        description: error?.message || error || "Failed to fetch credentials",
      });
    });
  }, [dispatch]);

  useEffect(() => {
    handleListWorkspaceCredentials(true);
  }, [page, pageSize, searchText, statusFilter]);

  useEffect(() => {
    handleListWorkspaceCredentials(false);
  }, [ordering]);

  const handleListWorkspaceCredentials = (isLoading) => {
    if (isLoading) {
      setDataLoading(true);
    }
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: ordering,
      statusFilter: statusFilter,
    };

    dispatch(listWorkspaceCredentialThunkApi(params))
      .unwrap()
      .then(() => {
        setDataLoading(false);
      })
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error",
          description: error?.message || error || "Failed to fetch credentials",
        });
      });
  };

  const handleCopyKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    message.success({
      title: "Copied to Clipboard",
      description: "API Key copied successfully.",
    });
  };

  // Open Drawer for Create or Edit
  const openDrawer = (record = null) => {
    setSelectedCredential(record);
    if (record) {
      // Editing existing credential
      form.setFieldsValue({
        workspace: record.workspace,
        provider: record.provider?.id || record.provider,
        api_key: "", // Keep blank by default unless changing key
        is_active: record.is_active,
      });
    } else {
      // Creating new credential
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
    setSelectedCredential(null);
    form.resetFields();
  };

  // Form Submission (Handles Create & Update)
  const onFinish = (values) => {
    setLoading(true);

    const workspaceId =
      user_detail?.workspace?.id || user_detail?.workspace || values.workspace;

    if (selectedCredential) {
      // UPDATE FEATURE
      const payload = {
        workspace: workspaceId,
        provider: values.provider,
        is_active: values.is_active,
      };

      // Only pass api_key if the user entered a new string
      if (values.api_key && values.api_key.trim() !== "") {
        payload.api_key = values.api_key.trim();
      }

      dispatch(
        updateWorkspaceCredentialThunkApi({
          id: selectedCredential.id,
          data: payload,
        }),
      )
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Credential Updated",
            description: "Workspace provider credential modified successfully.",
          });
          closeDrawer();
          handleListWorkspaceCredentials(false);
        })
        .catch((error) => {
          setLoading(false);
          const errorMessage =
            typeof error === "object" ? JSON.stringify(error) : error;
          message.error({
            title: "Update Failed",
            description: errorMessage || "Could not update credential.",
          });
        });
    } else {
      // CREATE FEATURE
      const payload = {
        workspace: workspaceId,
        provider: values.provider,
        api_key: values.api_key ? values.api_key.trim() : "",
        is_active: values.is_active,
      };

      dispatch(createWorkspaceCredentialThunkApi(payload))
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Credential Saved",
            description:
              "New workspace provider credential created successfully.",
          });
          closeDrawer();
          handleListWorkspaceCredentials(false);
        })
        .catch((error) => {
          setLoading(false);
          const errorMessage =
            typeof error === "object" ? JSON.stringify(error) : error;
          message.error({
            title: "Creation Failed",
            description: errorMessage || "Could not create credential.",
          });
        });
    }
  };

  // Toggle Active Status Inline
  const handleToggleStatus = (record, checked) => {
    const payload = {
      workspace: record.workspace,
      provider: record.provider?.id || record.provider,
      is_active: checked,
    };

    dispatch(
      updateWorkspaceCredentialThunkApi({ id: record.id, data: payload }),
    )
      .unwrap()
      .then(() => {
        message.info({
          title: "Status Updated",
          description: `Credential is now ${checked ? "Active" : "Disabled"}.`,
        });
        handleListWorkspaceCredentials(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error?.message || "Failed to update status.",
        });
      });
  };

  // Delete/Revoke Credential
  const handleDelete = (id) => {
    dispatch(destroyWorkspaceCredentialThunkApi(id))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res?.message || "Credential revoked successfully.",
        });
        handleListWorkspaceCredentials(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error?.message || "Failed to revoke credential.",
        });
      });
  };

  const getSortingEnumValue = (sortField, sortOrder) => {
    let sortingKey = "";
    if (sortField === "workspace_name") {
      sortingKey =
        sortOrder === "ascend" ? "workspace_name" : "-workspace_name";
    }
    if (sortField === "provider_name") {
      sortingKey = sortOrder === "ascend" ? "provider_name" : "-provider_name";
    }
    if (sortField === "created_at") {
      sortingKey = sortOrder === "ascend" ? "created_at" : "-created_at";
    }
    return sortingKey;
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter?.columnKey && sorter.order) {
      const orderBy = getSortingEnumValue(sorter.columnKey, sorter.order);
      if (orderBy !== ordering) {
        setOrdering(orderBy);
      }
    }
  };

  // Table Columns
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
          <Text strong>{text || "—"}</Text>
        </Space>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider_name",
      key: "provider_name",
      width: 180,
      sorter: true,
      render: (text, record) => {
        const providerName =
          text ||
          record.provider?.name ||
          providerOptions.find(
            (p) => p.value === (record.provider?.id || record.provider),
          )?.label ||
          "Provider";

        return (
          <Tag icon={<ApiOutlined />} color="blue">
            {providerName}
          </Tag>
        );
      },
    },
    {
      title: "API Key / Token",
      dataIndex: "api_key",
      key: "api_key",
      width: 260,
      render: (key, record) => {
        const isVisible = visibleKeyId === record.id;
        const maskedKey = "••••••••••••••••••••••••";
        const displayValue = isVisible && key ? key : maskedKey;

        return (
          <Space size="small">
            <Text code style={{ fontSize: "12px" }}>
              {displayValue}
            </Text>
            {key && (
              <Tooltip title={isVisible ? "Hide Key" : "Reveal Key"}>
                <Button
                  type="text"
                  size="small"
                  icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setVisibleKeyId(isVisible ? null : record.id)}
                />
              </Tooltip>
            )}
            {key && (
              <Tooltip title="Copy API Key">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyKey(key)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, record) => (
        <Tag
          icon={record.is_active ? <CheckCircleOutlined /> : <StopOutlined />}
          color={record.is_active ? "success" : "error"}
        >
          {record.is_active ? "Active" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Toggle Link",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      render: (isActive, record) => (
        <Switch
        style={{background:"#4f46e5"}}
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record, checked)}
          checkedChildren="Active"
          unCheckedChildren="Disabled"
        />
      ),
    },
    {
      title: "Created On",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      sorter: true,
      render: (date) => (
        <Text type="secondary">
          {date ? new Date(date).toLocaleDateString("en-GB") : "—"}
        </Text>
      ),
    },
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
            label: "Edit Credential",
            onClick: () => openDrawer(record),
          },
          { type: "divider" },
          {
            key: "delete",
            danger: true,
            icon: <DeleteOutlined />,
            label: (
              <Popconfirm
                title="Revoke Credential"
                description="Are you sure you want to delete this credential?"
                onConfirm={() => handleDelete(record.id)}
                okText="Revoke"
                cancelText="Cancel"
              >
                <span>Revoke Key</span>
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
  ];

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper">
        {/* Top Action Header */}
        <div className="top-action-bar">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Workspace Credentials
            </Title>
            <Text type="secondary">
              Manage, monitor, and configure provider integration API keys.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter(undefined);
              }}
            >
              Reset Filters
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => openDrawer()}
              className="btn-primary-custom"
            >
              Add Credential
            </Button>
          </Space>
        </div>

        {/* Content Box / Table Container */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Filters Box */}
              <div className="filter-box-container">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={14} md={16} lg={18}>
                    <Input
                      placeholder="Search by workspace or provider name..."
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
                      allowClear
                    >
                      <Option value="true">Active Only</Option>
                      <Option value="false">Inactive Only</Option>
                    </Select>
                  </Col>
                </Row>
              </div>

              {/* Data Table */}
              <Card className="table-card" title="Credentials List">
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
                    <Spin size="large" className="green-spin" style={{color:"#4f46e5"}}/>
                    <Text
                      type="secondary"
                      style={{ fontSize: "16px", fontWeight: 500 }}
                    >
                      Fetching Credential Data...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={credentials.data}
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
                        total={credentials.count || 0}
                        showTotal={(total) => `Total ${total}`}
                        showSizeChanger
                        pageSizeOptions={[10, 20, 30]}
                        onChange={(p, ps) => {
                          if (ps !== pageSize) {
                            setPageSize(ps);
                            setPage(1);
                          } else {
                            setPage(p);
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

        {/* Create & Edit Slide-Out Drawer */}
        <Drawer
          title={
            <Space align="center">
              <KeyOutlined style={{ color: "#2563eb" }} />
              <span>
                {selectedCredential
                  ? "Edit Credential Configuration"
                  : "Create Workspace Credential"}
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
                {selectedCredential ? "Save Changes" : "Save Credential"}
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
            {/* Dynamic LLM Provider Field */}
            <Form.Item
              label="Integration Provider"
              name="provider"
              rules={[
                {
                  required: true,
                  message: "Please select a provider",
                },
              ]}
            >
              <Select
                placeholder="Select provider"
                size="large"
                options={(llmProviders || []).map((provider) => ({
                  value: provider.id,
                  label: provider.name,
                }))}
              />
            </Form.Item>

            {/* API Key / Secret Token Field */}
            <Form.Item
              label="API Key / Secret Token"
              name="api_key"
              extra={
                selectedCredential
                  ? "Leave blank to keep current secret key."
                  : "Enter the provider authorization key."
              }
              rules={
                selectedCredential
                  ? []
                  : [{ required: true, message: "API key cannot be blank" }]
              }
            >
              <Input.Password
                prefix={<KeyOutlined style={{ color: "#bfbfbf" }} />}
                placeholder={
                  selectedCredential
                    ? "Leave blank to keep existing key"
                    : "e.g. sk-proj-xxxxxxxx"
                }
                size="large"
              />
            </Form.Item>

            <Divider />

            {/* Active Switch Toggle */}
            <div className="drawer-status-toggle">
              <div>
                <Text strong style={{ display: "block" }}>
                  Active Credential
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Allow integration calls when active.
                </Text>
              </div>
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch  style={{background:"#4f46e5"}}/>
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </>
  );
};
