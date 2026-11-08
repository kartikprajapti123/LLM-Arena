import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  Space,
  Dropdown,
  Spin,
  Typography,
  notification,
  Pagination,
  Progress,
  Avatar,
  Drawer,
  Popconfirm,
  Form,
  Upload,
  Switch,
} from "antd";
import { Link } from "react-router-dom";

import {
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  listProjectThunkApi,
  createProjectThunkApi, // Un-comment or add this to your slice
  updateProjectThunkApi,
  destroyProjectThunkApi, // Un-comment or add this to your slice
} from "../../slice/Project.Slice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const Project = () => {
  const [form] = Form.useForm();
  const [message, contextHolder] = notification.useNotification();
  const [dataLoading, setDataLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user_detail = useSelector((state) => state.auth.user_detail);
  const [fileList, setFileList] = useState([]);
  // Drawer States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Filters & Pagination State
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [Ordering, setOrdering] = useState();
  const dispatch = useDispatch();
  const projects = useSelector(
    (state) => state.project || { data: [], count: 0 },
  );

  // Get current user from store to check ownership (adjust according to your state)
  const currentUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    handleListProjects(true);
  }, [page, pageSize, searchText, statusFilter]);

  useEffect(() => {
    handleListProjects(false);
  }, [Ordering]);

  const handleListProjects = (isLoading) => {
    if (isLoading) setDataLoading(true);
    const params = {
      page: page,
      pageSize: pageSize,
      search: searchText,
      ordering: Ordering,
      status_filter: statusFilter,
    };

    dispatch(listProjectThunkApi(params))
      .unwrap()
      .then(() => setDataLoading(false))
      .catch((error) => {
        setDataLoading(false);
        message.error({
          title: "Error",
          description: error?.message || error || "Failed to fetch projects.",
        });
      });
  };

  // Open Drawer for Creation
  const handleOpenCreateDrawer = () => {
    setEditingProject(null);
    form.resetFields();
    setFileList([]);
    setDrawerVisible(true);
  };

  // Open Drawer for Editing
  const handleOpenEditDrawer = (record) => {
    setEditingProject(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active ?? true,
    });

    setFileList(
      record.image
        ? [
            {
              uid: "-1",
              name: record.image.split("/").pop(),
              status: "done",
              url: record.image,
            },
          ]
        : [],
    );
    setDrawerVisible(true);
  };

  // Submit Handler for both Create & Update
  const handleFormSubmit = (values) => {
    setSubmitting(true);

    const projectData = {
      ...values,
      workspace: user_detail.workspace,
    };

    const formData = new FormData();

    delete projectData.image;

    formData.append("project_data", JSON.stringify(projectData));

    const file = fileList?.[0]?.originFileObj;
    console.log("file", file);
    if (file) {
      formData.append("image", file);
    }

    if (editingProject) {
      dispatch(updateProjectThunkApi({ id: editingProject.id, data: formData }))
        .unwrap()
        .then((res) => {
          setSubmitting(false);

          message.success({
            title: "Success",
            description: "Project updated successfully!",
          });
        })
        .catch((error) => {
          setSubmitting(false);
          message.error({
            title: "Error",
            description: error,
          });
        });
    } else {
      dispatch(createProjectThunkApi(formData))
        .unwrap()
        .then((res) => {
          setSubmitting(false);
          message.success({
            title: "Success",
            description: "Project created successfully!",
          });
        })
        .catch((error) => {
          setSubmitting(false);
          message.error({
            title: "Error",
            description: error,
          });
        });
    }
    setDrawerVisible(false);
    form.resetFields();
    // handleListProjects(false);
  };

  const GetSortingEnumValue = (sortField, sortOrder) => {
    let sortingEnumKey = "";
    if (sortField === "name" && sortOrder === "ascend") sortingEnumKey = "name";
    if (sortField === "name" && sortOrder === "descend")
      sortingEnumKey = "-name";
    if (sortField === "is_created" && sortOrder === "ascend")
      sortingEnumKey = "is_created";
    if (sortField === "is_created" && sortOrder === "descend")
      sortingEnumKey = "-is_created";
    return sortingEnumKey;
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter?.columnKey && sorter.order) {
      const orderBy = GetSortingEnumValue(sorter.columnKey, sorter.order);
      if (orderBy !== Ordering) setOrdering(orderBy);
    }
  };

  const renderStatusTag = (isActive) => {
    return isActive ? (
      <Tag icon={<CheckCircleOutlined />} color="success">
        ACTIVE
      </Tag>
    ) : (
      <Tag color="default">INACTIVE</Tag>
    );
  };

  const handleDelete = (record_id) => {
    console.log(record_id);
    dispatch(destroyProjectThunkApi(record_id))
      .unwrap()
      .then((res) => {
        message
          .success({
            title: "Success",
            description: res.message,
          })
          .catch((error) => {
            message.error({
              title: "Error",
              description: error,
            });
          });
      });
  };

  const columns = [
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
      width: 250,
      sorter: true,

      render: (text, record) => (
        <Space size="middle">
          <Avatar
            src={record.image}
            icon={<FolderOutlined />}
            style={{ backgroundColor: "#4f46e5" }}
          />

          <div>
            <Text strong style={{ display: "block" }} >
              <Link to={`/run-comparison/${record.id}/`} style={{color:"#4f46e5"}}>
                {text || "Untitled Project"}
              </Link>
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.workspace_name
                ? `Workspace: ${record.workspace_name}`
                : record.description || "No description"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Owner",
      dataIndex: "owner_username",
      key: "owner",
      width: 150,
      render: (text, record) => (
        <Space>
          <Avatar src={record.owner_profile_image} size="small">
            {text ? text[0].toUpperCase() : "U"}
          </Avatar>
          <Text>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (isActive) => renderStatusTag(isActive),
    },
    {
      title: "Created On",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      sorter: true,
      render: (date) => (
        <Text type="secondary">
          {date ? new Date(date).toLocaleDateString("en-GB") : "N/A"}
        </Text>
      ),
    },
    ...(user_detail?.workspace_role === "owner"
      ? [
          {
            title: "Actions",
            key: "actions",
            align: "right",
            width: 100,
            render: (_, record) => {
              // Ownership check condition
              const isOwner = currentUser
                ? record.owner === currentUser.id
                : true;

              const menuItems = [
                {
                  key: "edit",
                  label: "Edit Project",
                  icon: <EditOutlined />,
                  disabled: !isOwner,
                  onClick: () => handleOpenEditDrawer(record),
                },
                {
                  key: "delete",
                  danger: true,
                  label: (
                    <Popconfirm
                      title="Delete Project"
                      description="Are you sure you want to delete this Project ?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <span>Delete Project</span>
                    </Popconfirm>
                  ),
                  icon: <DeleteOutlined />,
                  disabled: !isOwner,
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

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper">
        {/* Top Header Bar */}
        <div className="top-action-bar">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Projects
            </Title>
            <Text type="secondary">
              View, search, filter, and manage all projects.
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
            {user_detail?.workspace_role === "owner" && (
              <Button
                type="primary"
                style={{background:"#4f46e5"}}
                size="large"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateDrawer}
              >
                Create Project
              </Button>
            )}
          </Space>
        </div>

        {/* Data Table Container */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false} className="content-box-card">
              <div
                className="filter-box-container"
                style={{ marginBottom: 20 }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={16} md={16} lg={16}>
                    <Input
                      placeholder="Search by project name..."
                      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      size="large"
                    />
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
              <Card className="table-card" title="Projects List">
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
                    <Spin size="large" style={{color:"#4f46e5"}} />
                    <Text type="secondary" style={{ marginTop: 16 }}>
                      Fetching projects...
                    </Text>
                  </div>
                ) : (
                  <>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={projects.data}
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
                        total={projects.count}
                        showTotal={(total) => `Total ${total} projects`}
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

        {/* Create / Edit Drawer */}
        <Drawer
          title={editingProject ? "Edit Project" : "Create New Project"}
          width={450}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
          extra={
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
              <Button
                onClick={() => form.submit()}
                type="primary"
                style={{background:"#4f46e5"}}
                loading={submitting}
              >
                {editingProject ? "Update" : "Create"}
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
              name="name"
              label="Project Name"
              rules={[{ required: true, message: "Please enter project name" }]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Enter project description" />
            </Form.Item>

            <Form.Item name="image" label="Project Image">
              <Upload
                maxCount={1}
                beforeUpload={() => false}
                listType="picture"
                accept="image/*"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive"  style={{background:"#4f46e5"}}/>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </>
  );
};
