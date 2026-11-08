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
  StopOutlined,
  ProjectOutlined,
  ApiOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

// Redux Thunks
import {
  listLLMProjectModelThunkApi,
  createLLMProjectModelThunkApi,
  updateLLMProjectModelThunkApi,
  destroyLLMProjectModelThunkApi,
} from "../../slice/LLMProjectModel.Slice";
import { listLLMModelThunkApi } from "../../slice/LLMModel.Slice";
import { listProjectThunkApi } from "../../slice/Project.Slice";

const { Title, Text } = Typography;
const { Option } = Select;

export const LLMProjectModelListCreateUpdateDelete=()=> {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);

  // Filter and Pagination States
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [projectFilter, setProjectFilter] = useState();
  const [modelFilter, setModelFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ordering, setOrdering] = useState();

  const dispatch = useDispatch();
  const llmProjectModels = useSelector((state) => state.LLMProjectModel);
  const llmModels = useSelector((state) => state.LLMModel);
  const projects = useSelector((state) => state.project);

  // Fetch dropdown dependencies (Projects & LLM Models)
  useEffect(() => {
    dispatch(listProjectThunkApi({ pageSize: 100 }));
    dispatch(listLLMModelThunkApi({ pageSize: 100 }));
  }, [dispatch]);

  // Fetch Project-Model Mappings on filter or page changes
  useEffect(() => {
    handleListLLMProjectModels(true);
  }, [page, pageSize, searchText, statusFilter, projectFilter, modelFilter]);

  useEffect(() => {
    handleListLLMProjectModels(false);
  }, [ordering]);

  const handleListLLMProjectModels = (isLoading) => {
    if (isLoading) {
      setDataLoading(true);
    }
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: ordering,
      statusFilter: statusFilter,
      project: projectFilter,
      llm_model: modelFilter,
    };

    dispatch(listLLMProjectModelThunkApi(params))
      .unwrap()
      .then(() => {
        setDataLoading(false);
      })
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error Fetching Mappings",
          description:
            error?.message || error || "Failed to load Project-Model bindings.",
        });
      });
  };

  // Open Drawer for Create / Edit
  const openDrawer = (record = null) => {
    setSelectedMapping(record);
    if (record) {
      form.setFieldsValue({
        project: record.project,
        llm_model: record.llm_model,
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
    setSelectedMapping(null);
    form.resetFields();
  };

  // Map DRF Backend Validation Errors onto Form fields
  const handleApiErrors = (errorResponse) => {
    if (typeof errorResponse === "object" && errorResponse !== null) {
      const fieldErrors = [];
      Object.keys(errorResponse).forEach((field) => {
        if (["project", "llm_model", "is_active"].includes(field)) {
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

  // Form Submission
  const onFinish = (values) => {
    setLoading(true);

    const payload = {
      project: values.project,
      llm_model: values.llm_model,
      is_active: values.is_active ?? true,
    };

    if (selectedMapping) {
      dispatch(
        updateLLMProjectModelThunkApi({ id: selectedMapping.id, data: payload })
      )
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Binding Updated",
            description: "LLM Project Model mapping updated successfully.",
          });
          closeDrawer();
          handleListLLMProjectModels(false);
        })
        .catch((error) => {
          setLoading(false);
          handleApiErrors(error);
        });
    } else {
      dispatch(createLLMProjectModelThunkApi(payload))
        .unwrap()
        .then(() => {
          setLoading(false);
          message.success({
            title: "Model Assigned",
            description: "LLM Model assigned to project successfully.",
          });
          closeDrawer();
          handleListLLMProjectModels(false);
        })
        .catch((error) => {
          setLoading(false);
          handleApiErrors(error);
        });
    }
  };

  // Toggle Active Status Directly
  const handleToggleStatus = (record, checked) => {
    const payload = {
      project: record.project,
      llm_model: record.llm_model,
      is_active: checked,
    };
    dispatch(
      updateLLMProjectModelThunkApi({ id: record.id, data: payload })
    )
      .unwrap()
      .then(() => {
        message.success({
          title: "Status Updated",
          description: `Project Model assignment is now ${
            checked ? "Active" : "Disabled"
          }`,
        });
        handleListLLMProjectModels(false);
      })
      .catch((error) => {
        message.error({
          title: "Update Failed",
          description:
            error?.message || error || "Failed to update status.",
        });
      });
  };

  // Delete Binding
  const handleDelete = (id) => {
    dispatch(destroyLLMProjectModelThunkApi(id))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Removed",
          description:
            res?.message || "LLM Model unassigned from project.",
        });
        handleListLLMProjectModels(false);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description:
            error?.message || error || "Failed to remove project model assignment.",
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

  // Table Columns
  const columns = [
    {
      title: "Project Name",
      dataIndex: "project_name",
      key: "project",
      width: 220,
      sorter: true,
      render: (text) => (
        <Space>
          <ProjectOutlined style={{ color: "#2563eb" }} />
          <Text strong>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Model Name",
      dataIndex: "llm_model_name",
      key: "llm_model",
      width: 200,
      sorter: true,
      render: (text) => (
        <Space>
          <ApiOutlined style={{ color: "#7c3aed" }} />
          <Text strong>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Model Identifier",
      dataIndex: "llm_model_identifier",
      key: "llm_model_identifier",
      width: 200,
      render: (identifier) => (
        <Tag color="#4f46e5" icon={<BarcodeOutlined />}>
          {identifier || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider_name",
      key: "provider_name",
      width: 160,
      render: (name) => (
        <Tag icon={<ApiOutlined />} color="purple">
          {name || "N/A"}
        </Tag>
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
    "color":"white"}}
        />
      ),
    },
    {
      title: "Assigned On",
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
      width: 90,
      render: (_, record) => {
        const menuItems = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit Binding",
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
                title="Remove Binding"
                description="Are you sure you want to remove this model from the project?"
                onConfirm={() => handleDelete(record.id)}
                okText="Remove"
                cancelText="Cancel"
              >
                <div style={{ width: "100%" }}>Remove Binding</div>
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
        {/* Top Header */}
        <div className="top-action-bar" style={{ marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Project LLM Models
            </Title>
            <Text type="secondary">
              Assign and configure which LLM models are available for specific projects.
            </Text>
          </div>
          <Space wrap size="middle">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter(undefined);
                setProjectFilter(undefined);
                setModelFilter(undefined);
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
              Assign Model to Project
            </Button>
          </Space>
        </div>

        {/* Content Card */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              {/* Filter Toolbar */}
              <div className="filter-box-container" style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={8} lg={8}>
                    <Input
                      placeholder="Search project or model name..."
                      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      size="large"
                    />
                  </Col>
                  <Col xs={24} sm={6} md={5} lg={5}>
                    <Select
                      value={projectFilter}
                      onChange={setProjectFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Filter by Project"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {(projects?.data || []).map((proj) => (
                        <Option key={proj.id} value={proj.id}>
                          {proj.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={6} md={5} lg={5}>
                    <Select
                      value={modelFilter}
                      onChange={setModelFilter}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Filter by Model"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {(llmModels?.data || []).map((mod) => (
                        <Option key={mod.id} value={mod.id}>
                          {mod.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={6} md={6} lg={6}>
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
              <Card className="table-card" title="Assigned Project Models">
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
                    <Spin size="large"  style={{color:"#4f46e5"}} />
                    <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500 }}>
                      Loading Project Model mappings...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={llmProjectModels?.data || []}
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
                        total={llmProjectModels?.totalRecords || 0}
                        showTotal={(total) => `Total ${total} assignments`}
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
              <ProjectOutlined style={{ color: "#2563eb" }} />
              <span>
                {selectedMapping ? "Edit Project Model Mapping" : "Assign Model to Project"}
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
                {selectedMapping ? "Save Changes" : "Assign Model"}
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
            {/* Project Selection */}
            <Form.Item
              label="Select Project"
              name="project"
              rules={[{ required: true, message: "Project selection is required" }]}
            >
              <Select
                placeholder="Select a Project"
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {(projects?.data || []).map((proj) => (
                  <Option key={proj.id} value={proj.id}>
                    {proj.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* LLM Model Selection */}
            <Form.Item
              label="Select LLM Model"
              name="llm_model"
              rules={[{ required: true, message: "LLM Model selection is required" }]}
            >
              <Select
                placeholder="Select an LLM Model"
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {(llmModels?.data || []).map((model) => (
                  <Option key={model.id} value={model.id}>
                    {model.name} {model.model_identifier ? `(${model.model_identifier})` : ""}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Active Status Switch */}
            <div
              className="drawer-status-toggle"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
              }}
            >
              <div>
                <Text strong style={{ display: "block" }}>
                  Active Status
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Disabled mappings won't allow model execution in this project.
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