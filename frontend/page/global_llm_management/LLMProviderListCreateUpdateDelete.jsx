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
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  GlobalOutlined,
  KeyOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  listLLMProviderThunkApi,
  createLLMProviderThunkApi,
  updateLLMProviderThunkApi,
  destroyLLMProviderThunkApi,
} from "../../slice/LLMProvider.Slice"; // Adjust path to your Redux slice

const { Title, Text } = Typography;
const { Option } = Select;

export default function LLMProviderListCreateUpdateDelete() {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Filters state
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ordering, setOrdering] = useState();

  const dispatch = useDispatch();
  const llmProviders = useSelector((state) => state.LLMProvider);

  useEffect(() => {
    handleListLLMProviders(true);
  }, [page, pageSize, searchText, statusFilter]);

  useEffect(() => {
    handleListLLMProviders(false);
  }, [ordering]);

  const handleListLLMProviders = (isLoading) => {
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

    dispatch(listLLMProviderThunkApi(params))
      .unwrap()
      .then(() => {
        setDataLoading(false);
      })
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error Fetching Providers",
          description: error?.message || error || "Failed to load LLM providers.",
        });
      });
  };

  // Open Drawer for Create or Edit
  const openDrawer = (record = null) => {
    setSelectedProvider(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        slug: record.slug,
        website: record.website,
        is_active: record.is_active,
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
    setSelectedProvider(null);
    form.resetFields();
  };

  // Form Submission (Create or Update)
  const onFinish = (values) => {
    setLoading(true);

    const payload = {
      name: values.name,
      slug: values.slug,
      website: values.website,
      is_active: values.is_active ?? true,
    };

    if (selectedProvider) {
      dispatch(
        updateLLMProviderThunkApi({ id: selectedProvider.id, data: payload })
      )
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Provider Updated",
            description: "LLM Provider configurations updated successfully.",
          });
          closeDrawer();
          handleListLLMProviders(false);
        })
        .catch((error) => {
          setLoading(false);
          message.error({
            title: "Update Failed",
            description: error?.message || error || "Failed to update LLM Provider.",
          });
        });
    } else {
      dispatch(createLLMProviderThunkApi(payload))
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Provider Created",
            description: "New LLM Provider successfully registered.",
          });
          closeDrawer();
          handleListLLMProviders(false);
        })
        .catch((error) => {
          setLoading(false);
          message.error({
            title: "Creation Failed",
            description: error?.message || error || "Failed to create LLM Provider.",
          });
        });
    }
  };

  // Toggle Active Status
  const handleToggleStatus = (record, checked) => {
    const payload = { ...record, is_active: checked };
    dispatch(updateLLMProviderThunkApi({ id: record.id, data: payload }))
      .unwrap()
      .then(() => {
        message.success({
          title: "Status Updated",
          description: `Provider "${record.name}" is now ${
            checked ? "Active" : "Disabled"
          }`,
        });
        handleListLLMProviders(false);
      })
      .catch((error) => {
        message.error({
          title: "Update Failed",
          description: error?.message || error || "Failed to toggle status.",
        });
      });
  };

  // Delete Provider
  const handleDelete = (id) => {
    dispatch(destroyLLMProviderThunkApi(id))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Deleted",
          description: res?.message || "LLM Provider deleted successfully.",
        });
        handleListLLMProviders(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error?.message || error || "Failed to delete LLM Provider.",
        });
      });
  };

  // Translate Ant Design Sorter to Backend Query Param
  const getSortingEnumValue = (sortField, sortOrder) => {
    if (!sortOrder) return undefined;
    const prefix = sortOrder === "descend" ? "-" : "";
    return `${prefix}${sortField}`;
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter?.field && sorter.order) {
      const orderBy = getSortingEnumValue(sorter.field, sorter.order);
      if (orderBy !== ordering) {
        setOrdering(orderBy);
      }
    } else {
      setOrdering(undefined);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      title: "Provider Name",
      dataIndex: "name",
      key: "name",
      width: 220,
      sorter: true,
      render: (text) => (
        <Space>
          <ApiOutlined style={{ color: "#2563eb" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      width: 150,
      render: (slug) => <Tag color="#4f46e5">{slug}</Tag>,
    },
    {
      title: "Website Url",
      dataIndex: "website",
      key: "website",
      width: 250,
      ellipsis: true,
      render: (url) => (
        <Text type="secondary" ellipsis={{ tooltip: url }}>
          {url || "N/A"}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
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
      title: "Toggle",
      dataIndex: "is_active",
      key: "is_active",
      width: 110,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record, checked)}
          checkedChildren="Active"
          unCheckedChildren="Disabled"
          style={{
            background: "#4f46e5",
            color: "white"

          }}
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
          {date ? new Date(date).toLocaleDateString("en-GB") : "N/A"}
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
            label: "Edit Provider",
            onClick: () => openDrawer(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            danger: true,
            icon: <DeleteOutlined />,
            label: (
              <Popconfirm
                title="Delete LLM Provider"
                description="Are you sure you want to delete this provider?"
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
              >
                <div style={{ width: "100%" }}>Delete Provider</div>
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
        {/* Top Header Bar */}
        <div className="top-action-bar" style={{ marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              LLM Providers
            </Title>
            <Text type="secondary">
              Manage external AI model providers, API keys, and endpoint settings.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter(undefined);
                setOrdering(undefined);
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
              Add Provider
            </Button>
          </Space>
        </div>

        {/* Content Box with Table */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Filter Box */}
              <div className="filter-box-container" style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={14} md={16} lg={18}>
                    <Input
                      placeholder="Search by provider name or slug..."
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
                      placeholder="Filter by Status"
                      allowClear
                    >
                      <Option value="true">Active Only</Option>
                      <Option value="false">Inactive Only</Option>
                    </Select>
                  </Col>
                </Row>
              </div>

              {/* Data Table */}
              <Card className="table-card" title="Provider List">
                {dataLoading ? (
                  <div
                    style={{
                      minHeight: "40vh",
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
                    <Spin size="large" style={{color:"#4f46e5"}}/>
                    <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500 }}>
                      Fetching LLM Providers...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={llmProviders?.data || []}
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
                        total={llmProviders?.totalRecords || 0}
                        showTotal={(total) => `Total ${total} providers`}
                        showSizeChanger
                        pageSizeOptions={[10, 20, 30, 50]}
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

        {/* Create / Edit Drawer */}
        <Drawer
          title={
            <Space align="center">
              <ApiOutlined style={{ color: "#2563eb" }} />
              <span>
                {selectedProvider ? "Edit LLM Provider" : "Create LLM Provider"}
              </span>
            </Space>
          }
          width={460}
          onClose={closeDrawer}
          open={drawerOpen}
          destroyOnClose
          footer={
            <div
              className="drawer-footer-actions"
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
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
                {selectedProvider ? "Save Changes" : "Create Provider"}
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
              label="Provider Name"
              name="name"
              rules={[{ required: true, message: "Provider name is required" }]}
            >
              <Input
                prefix={<ApiOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="e.g. OpenAI, Anthropic, Ollama"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Slug Identifier"
              name="slug"
              rules={[{ required: true, message: "Slug identifier is required" }]}
            >
              <Input
                placeholder="e.g. openai, anthropic, ollama"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Base API URL"
              name="website"
              extra="Optional base URL for custom or local endpoints (e.g. http://localhost:11434)"
            >
              <Input
                prefix={<GlobalOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="https://api.openai.com/v1"
                size="large"
              />
            </Form.Item>

            <Divider />

            <div
              className="drawer-status-toggle"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong style={{ display: "block" }}>
                  Active Provider Status
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Disable to temporarily block operations for this provider.
                </Text>
              </div>
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch  style={{"background": "#4f46e5",
    "color":"white"}} />
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </>
  );
}