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
  InputNumber,
  Divider,
  Pagination,
  Tooltip,
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
  StopOutlined,
  BlockOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

// Import Redux Thunks (Adjust relative import paths as needed)
import {
  listLLMModelThunkApi,
  createLLMModelThunkApi,
  updateLLMModelThunkApi,
  destroyLLMModelThunkApi,
} from "../../slice/LLMModel.Slice";
import { listLLMProviderThunkApi } from "../../slice/LLMProvider.Slice";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function LLMModelListCreateUpdateDelete() {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // Filter and Pagination States
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [providerFilter, setProviderFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ordering, setOrdering] = useState();

  const dispatch = useDispatch();
  const llmModels = useSelector((state) => state.LLMModel);
  const llmProviders = useSelector((state) => state.LLMProvider);

  // Fetch Providers list for selection options
  useEffect(() => {
    dispatch(listLLMProviderThunkApi({ pageSize: 100 }));
  }, [dispatch]);

  // Fetch LLM Models on table filter or page changes
  useEffect(() => {
    handleListLLMModels(true);
  }, [page, pageSize, searchText, statusFilter, providerFilter]);

  useEffect(() => {
    handleListLLMModels(false);
  }, [ordering]);

  const handleListLLMModels = (isLoading) => {
    if (isLoading) {
      setDataLoading(true);
    }
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: ordering,
      statusFilter: statusFilter,
      provider: providerFilter,
    };

    dispatch(listLLMModelThunkApi(params))
      .unwrap()
      .then(() => {
        setDataLoading(false);
      })
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error Fetching Models",
          description: error?.message || error || "Failed to load LLM models.",
        });
      });
  };

  // Open Drawer for Create / Update
  const openDrawer = (record = null) => {
    setSelectedModel(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        model_identifier: record.model_identifier,
        provider: record.provider || record.provider_details?.id,
        description: record.description,
        context_window: record.context_window,
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
    setSelectedModel(null);
    form.resetFields();
  };

  // Map DRF Backend Validation Errors directly onto Form fields
  const handleApiErrors = (errorResponse) => {
    if (typeof errorResponse === "object" && errorResponse !== null) {
      const fieldErrors = [];
      Object.keys(errorResponse).forEach((field) => {
        if (["name", "model_identifier", "provider", "description", "context_window"].includes(field)) {
          const errors = Array.isArray(errorResponse[field])
            ? errorResponse[field]
            : [errorResponse[field]];
          fieldErrors.push({ name: field, errors });
        }
      });
      if (fieldErrors.length > 0) {
        form.setFields(fieldErrors);
        return;
      }
    }
    message.error({
      title: "Action Failed",
      description:
        typeof errorResponse === "string"
          ? errorResponse
          : errorResponse?.message || "Operation failed. Please check inputs.",
    });
  };

  // Form Submission (Create or Update)
  const onFinish = (values) => {
    setLoading(true);

    const payload = {
      name: values.name,
      model_identifier: values.model_identifier,
      provider: values.provider,
      description: values.description || "",
      context_window: values.context_window || null,
      is_active: values.is_active ?? true,
    };

    if (selectedModel) {
      dispatch(
        updateLLMModelThunkApi({ id: selectedModel.id, data: payload })
      )
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Model Updated",
            description: "LLM Model details updated successfully.",
          });
          closeDrawer();
          handleListLLMModels(false);
        })
        .catch((error) => {
          setLoading(false);
          handleApiErrors(error);
        });
    } else {
      dispatch(createLLMModelThunkApi(payload))
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Model Created",
            description: "New LLM Model registered successfully.",
          });
          closeDrawer();
          handleListLLMModels(false);
        })
        .catch((error) => {
          setLoading(false);
          handleApiErrors(error);
        });
    }
  };

  // Toggle Active Status Directly
  const handleToggleStatus = (record, checked) => {
    const payload = { ...record, is_active: checked };
    dispatch(updateLLMModelThunkApi({ id: record.id, data: payload }))
      .unwrap()
      .then(() => {
        message.success({
          title: "Status Updated",
          description: `Model "${record.name}" is now ${
            checked ? "Active" : "Disabled"
          }`,
        });
        handleListLLMModels(false);
      })
      .catch((error) => {
        message.error({
          title: "Update Failed",
          description: error?.message || error || "Failed to update model status.",
        });
      });
  };

  // Delete Model
  const handleDelete = (id) => {
    dispatch(destroyLLMModelThunkApi(id))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Deleted",
          description: res?.message || "LLM Model deleted successfully.",
        });
        handleListLLMModels(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error?.message || error || "Failed to delete LLM Model.",
        });
      });
  };

  // Translate Table Sorter to DRF ordering standard (-field)
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

  // Table Column Definitions
  const columns = [
    {
      title: "Model Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: true,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <BlockOutlined style={{ color: "#4f46e5" }} />
            <Text strong>{text}</Text>
          </Space>
          {record.description && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 1 }}
              style={{ margin: 0, fontSize: "12px", maxWidth: 220 }}
            >
              {record.description}
            </Paragraph>
          )}
        </Space>
      ),
    },
    {
      title: "Model Identifier",
      dataIndex: "model_identifier",
      key: "model_identifier",
      width: 200,
      sorter: true,
      render: (identifier) => (
        <Tag color="#4f46e5" icon={<BarcodeOutlined />}>
          {identifier}
        </Tag>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider_name",
      key: "provider",
      width: 170,
      render: (providerName, record) => {
        const name =
          providerName ||
          record.provider_details?.name ||
          (llmProviders?.data || []).find((p) => p.id === record.provider)?.name ||
          "N/A";
        return (
          <Tag icon={<ApiOutlined />} color="purple">
            {name}
          </Tag>
        );
      },
    },
    {
      title: "Context Window",
      dataIndex: "context_window",
      key: "context_window",
      width: 160,
      sorter: true,
      render: (val) => (
        <Text type="secondary">
          {val ? `${val.toLocaleString()} tokens` : "N/A"}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
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
          style={{"background": "#4f46e5",
    "color": "white"}}
        />
      ),
    },
    {
      title: "Created On",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
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
      width: 90,
      render: (_, record) => {
        const menuItems = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit Model",
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
                title="Delete Model"
                description="Are you sure you want to delete this LLM Model?"
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
              >
                <div style={{ width: "100%" }}>Delete Model</div>
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
        {/* Header Section */}
        <div className="top-action-bar" style={{ marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              LLM Models
            </Title>
            <Text type="secondary">
              Configure available AI models, context limits, and provider bindings.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter(undefined);
                setProviderFilter(undefined);
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
              Add Model
            </Button>
          </Space>
        </div>

        {/* Content Section */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Filter Toolbar */}
              <div className="filter-box-container" style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={10} lg={12}>
                    <Input
                      placeholder="Search by model name or identifier..."
                      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      size="large"
                    />
                  </Col>
                  <Col xs={24} sm={6} md={7} lg={6}>
                    <Select
                      value={providerFilter}
                      onChange={setProviderFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Filter by Provider"
                      allowClear
                    >
                      {(llmProviders?.data || []).map((prov) => (
                        <Option key={prov.id} value={prov.id}>
                          {prov.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={6} md={7} lg={6}>
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
              <Card className="table-card" title="Model List">
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
                    <Spin size="large" style={{color:"#4f46e5"}} />
                    <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500 }}>
                      Fetching LLM Models...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={llmModels?.data || []}
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
                        total={llmModels?.totalRecords || 0}
                        showTotal={(total) => `Total ${total} models`}
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
              <BlockOutlined style={{ color: "#2563eb" }} />
              <span>
                {selectedModel ? "Edit LLM Model" : "Create LLM Model"}
              </span>
            </Space>
          }
          width={480}
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
                {selectedModel ? "Save Changes" : "Create Model"}
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
            {/* Model Name */}
            <Form.Item
              label="Model Name"
              name="name"
              rules={[{ required: true, message: "Model name is required" }]}
            >
              <Input
                prefix={<BlockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="e.g. GPT-4o, Claude 3.5 Sonnet"
                size="large"
              />
            </Form.Item>

            {/* Model Identifier */}
            <Form.Item
              label={
                <Space>
                  <span>Model Identifier</span>
                  <Tooltip title="API string identifier sent to LLM provider (e.g. gpt-4o, claude-3-5-sonnet-20240620)">
                    <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                  </Tooltip>
                </Space>
              }
              name="model_identifier"
              rules={[{ required: true, message: "Model identifier is required" }]}
            >
              <Input
                prefix={<BarcodeOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="e.g. gpt-4o-2024-05-13"
                size="large"
              />
            </Form.Item>

            {/* LLM Provider Selection */}
            <Form.Item
              label="LLM Provider"
              name="provider"
              rules={[{ required: true, message: "Provider selection is required" }]}
            >
              <Select
                placeholder="Select a Provider"
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {(llmProviders?.data || []).map((provider) => (
                  <Option key={provider.id} value={provider.id}>
                    {provider.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Description */}
            <Form.Item label="Description" name="description">
              <TextArea
                rows={3}
                placeholder="Brief summary of model capabilities or use cases..."
              />
            </Form.Item>

            {/* Context Window */}
            <Form.Item
              label="Context Window (Tokens)"
              name="context_window"
              extra="Maximum token context size supported by the model (e.g. 128000)"
            >
              <InputNumber
                style={{ width: "100%" }}
                size="large"
                prefix={<NumberOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="128000"
                min={0}
                step={1024}
              />
            </Form.Item>

            <Divider />

            {/* Active Switch */}
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
                  Active Model Status
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Disabled models will not be selectable for processing tasks.
                </Text>
              </div>
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch  style={{"background": "#4f46e5",
    "color": "white"}} />
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </>
  );
}