import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusCircleOutlined,
  UsergroupAddOutlined,
  ArrowRightOutlined,
  FormOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import useNotification from "antd/es/notification/useNotification";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { createInviteCodeWorkspaceMemberThunkApi, createWorkspaceThunkApi } from "../slice/Workspace.Slice";

const { Title, Text } = Typography;

export const WorkspaceOnBoarding = () => {
  const [mode, setMode] = useState("create"); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [message, contextHolder] = useNotification();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const selector=useSelector()
  const handleFinish = async (values) => {
    if (mode=="create"){

      setLoading(true);
      const data = new FormData();
      data.append("workspace_data", JSON.stringify(form.getFieldsValue()));
    // data.append("image",)
    dispatch(createWorkspaceThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        form.resetFields()
        setTimeout(()=>{
          navigate("/dashboard/")

        },2000)
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
      })
      .finally(() => {
        setLoading(false);
      });
    }
    else{
      setLoading(true);
      const data ={
        "invite_code":values.invite_code
      }
    dispatch(createInviteCodeWorkspaceMemberThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        form.resetFields()
        setTimeout(()=>{
          navigate("/dashboard/")

        },2000)
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
      })
      .finally(() => {
        setLoading(false);
      });
    }
  };

  return (
    <>
      {contextHolder}
      <div className="workspace-onboarding-container">
        <div className="workspace-onboarding-wrapper">
          {/* Header Section */}
          <div className="workspace-header">
            <Title level={2} className="workspace-title">
              Welcome to LLM Arena!
            </Title>
            <Text type="secondary" className="workspace-subtitle">
              Set up your workspace environment to get started.
            </Text>
          </div>

          {/* Mode Selector Cards */}
          <Row gutter={[16, 16]} className="card-selector-row">
            <Col xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => setMode("create")}
                className={`choice-card choice-card-create ${
                  mode === "create" ? "active" : "choice-card-inactive"
                }`}
              >
                <Space
                  direction="vertical"
                  align="center"
                  className="choice-card-inner"
                >
                  <PlusCircleOutlined className="choice-card-icon" />
                  <Text strong className="choice-card-title">
                    Create New Workspace
                  </Text>
                  <Text type="secondary" className="choice-card-desc">
                    You will be the owner/admin of this workspace.
                  </Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => setMode("join")}
                className={`choice-card choice-card-join ${
                  mode === "join" ? "active" : "choice-card-inactive"
                }`}
              >
                <Space
                  direction="vertical"
                  align="center"
                  className="choice-card-inner"
                >
                  <UsergroupAddOutlined className="choice-card-icon" />
                  <Text strong className="choice-card-title">
                    Join Existing Workspace
                  </Text>
                  <Text type="secondary" className="choice-card-desc">
                    Join an existing team as a workspace member.
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Dynamic Form Area */}
          <Card className="workspace-form-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              requiredMark={false}
            >
              {mode === "create" ? (
                <>
                  <Title level={4} className="form-section-title">
                    Create Workspace Details
                  </Title>

                  <Form.Item
                    label="Workspace Name"
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a workspace name",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<FormOutlined className="field-icon" />}
                      placeholder="e.g. Acme AI Team"
                      className="custom-input"
                    />
                  </Form.Item>

                  <Form.Item label="Description (Optional)" name="description">
                    <Input.TextArea
                      rows={3}
                      placeholder="Brief description of your project or organization"
                      className="custom-input"
                    />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Title level={4} className="form-section-title">
                    Enter Invite Details
                  </Title>

                  <Form.Item
                    label="Workspace Invite Code"
                    name="invite_code"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your invite code",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<KeyOutlined className="field-icon" />}
                      placeholder="e.g. WS-8493-INVITE"
                      className="custom-input"
                    />
                  </Form.Item>
                </>
              )}

              <Divider className="auth-divider" />

              <Form.Item className="form-submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  icon={<ArrowRightOutlined />}
                  className="primary-register-btn"
                >
                  {mode === "create" ? "Create & Continue" : "Join Workspace"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
};
