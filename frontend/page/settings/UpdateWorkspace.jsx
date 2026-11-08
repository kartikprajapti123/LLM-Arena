import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Switch,
  Card,
  Row,
  Col,
  Tag,
  Space,
  notification,
  Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  Briefcase,
  Camera,
  Save,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
} from "lucide-react";

import {
  getSingleWorkspaceThunkApi,
  updateWorkspaceThunkApi,
} from "../../slice/Workspace.Slice";

export const UpdateWorkspace = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workspaceImage, setWorkspaceImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const workspaceDetails = useSelector(
    (state) => state.workspace.singleWorkspace,
  );

  const [message, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = () => {
    console.log("called");
    dispatch(getSingleWorkspaceThunkApi())
      .unwrap()
      .then((res) => {
        console.log(res);
        form.setFieldsValue(res.data);
        if (res.data.image !==null){
          console.log("yes")
          setImageUrl(res.data?.image);
        }
        console.log(imageUrl)
      })
      .catch((error) => {
        console.log(error);
        message.error({
          title: "Initialization Error",
          description:
            error?.message || error || "Failed to load workspace details.",
        });
      });
  };

  const handleImageChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setWorkspaceImage(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const onFinish = (values) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("workspace_data",JSON.stringify(values))

    if (workspaceImage) {
      formData.append("image", workspaceImage);
    }

    console.log(workspaceDetails.id)
    dispatch(
      updateWorkspaceThunkApi({ id: workspaceDetails.id, data: formData }),
    )
      .unwrap()
      .then((res) => {
        setLoading(false);
        message.success({
          title: "Workspace Updated",
          description:
            res.message || "Workspace parameters saved successfully.",

        });
        fetchWorkspaceData()
        const updatedData = res.data || res;
        form.setFieldsValue({
          name: updatedData?.name,
          is_active: updatedData?.is_active,
        });
        setImageUrl(updatedData?.image);
      })
      .catch((error) => {
        setLoading(false);
        message.error({
          title: "Update Failed",
          description: error || "Could not save workspace changes.",
        });
      });
  };

  return (
    <>
      {contextHolder}
      <div className="workspace-page-container">
        {/* Page Header */}
        <div className="workspace-header-bar">
          <Space size={16} align="center">
            <div className="workspace-header-icon-box">
              <Briefcase size={22} style={{ color: "#722ED1" }} />
            </div>
            <div>
              <h1 className="workspace-header-title">Workspace Settings</h1>
              <span className="workspace-header-subtitle">
                Manage workspace branding, display name, and operational status
              </span>
            </div>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Row gutter={[24, 24]}>
            {/* Left Column: Image & Meta Overview */}
            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                className="workspace-card workspace-card-centered"
              >
                <div className="workspace-avatar-wrapper">
                  <Upload
                    name="image"
                    listType="picture-circle"
                    showUploadList={false}
                    accept="image/*"
                    beforeUpload={() => false}
                    maxCount={1}
                    onChange={handleImageChange}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Workspace Logo"
                        className="workspace-avatar-image"
                      />
                    ) : (
                      <div className="workspace-avatar-placeholder">
                        {workspaceDetails?.name?.charAt(0)?.toUpperCase() ||
                          "W"}
                      </div>
                    )}
                  </Upload>
                  <Tooltip title="Upload workspace logo">
                    <div className="workspace-upload-badge">
                      <Camera size={14} />
                    </div>
                  </Tooltip>
                </div>

                <h2 className="workspace-title-text">
                  {workspaceDetails?.name || "Workspace"}
                </h2>

                <div className="workspace-meta-border">
                  <div className="workspace-meta-row">
                    <span className="workspace-meta-label">Status</span>
                    {workspaceDetails?.is_active ? (
                      <Tag
                        icon={<CheckCircle2 size={12} />}
                        color="success"
                        className="workspace-status-tag"
                      >
                        Active
                      </Tag>
                    ) : (
                      <Tag
                        icon={<XCircle size={12} />}
                        color="error"
                        className="workspace-status-tag"
                      >
                        Inactive
                      </Tag>
                    )}
                  </div>

                  <div className="workspace-meta-row">
                    <span className="workspace-meta-label">Owner</span>
                    <span className="workspace-meta-value">
                      <Space size={4}>
                        <User size={13} style={{ color: "#8c8c8c" }} />
                        {workspaceDetails?.owner_username || "System Owner"}
                      </Space>
                    </span>
                  </div>

                  {workspaceDetails?.created_at && (
                    <div className="workspace-meta-row">
                      <span className="workspace-meta-label">Created</span>
                      <span className="workspace-meta-value">
                        <Space size={4}>
                          <Calendar size={13} style={{ color: "#8c8c8c" }} />
                          {new Date(
                            workspaceDetails.created_at,
                          ).toLocaleDateString()}
                        </Space>
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Right Column: Editable Details */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Card
                  title={
                    <span className="workspace-card-header-title">
                      General Configuration
                    </span>
                  }
                  bordered={false}
                  className="workspace-card"
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="name"
                        label="Workspace Name"
                        rules={[
                          {
                            required: true,
                            message: "Please input workspace name",
                          },
                        ]}
                      >
                        <Input
                          prefix={
                            <Briefcase
                              size={16}
                              className="workspace-input-icon"
                            />
                          }
                          placeholder="Enter workspace name"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        name="description"
                        label="Workspace Description"
                        rules={[
                          {
                            max: 500,
                            message: "Description cannot exceed 500 characters",
                          },
                        ]}
                      >
                        <Input.TextArea
                          placeholder="Provide a brief description of the workspace and its purpose..."
                          rows={4}
                          maxLength={500}
                          showCount
                        />
                      </Form.Item>
                    </Col>

                    {/* <Col xs={24}>
                      <Form.Item
                        name="is_active"
                        label="Workspace Status"
                        valuePropName="checked"
                      >
                        <Space size={12}>
                          <Switch />
                          <span>Enable active workspace operations</span>
                        </Space>
                      </Form.Item>
                    </Col> */}
                  </Row>
                </Card>

                {/* Submit Action */}
                <div className="workspace-action-footer">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<Save size={16} />}
                    size="large"
                    className="workspace-submit-btn"
                    style={{
                      backgroundColor: "#722ED1",
                      borderColor: "#722ED1",
                    }}
                  >
                    Save Workspace Changes
                  </Button>
                </div>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};
