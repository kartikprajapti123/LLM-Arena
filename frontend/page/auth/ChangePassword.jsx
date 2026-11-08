import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Result,
  notification,
} from "antd";
import {
  LockOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ChangePasswordThunkApi } from "../../slice/Auth.Slice";
const { Title, Text } = Typography;

export const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [message, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const params=useParams()
  console.log(params.token)
  const onFinish = async (values) => {
    const data = {
    password: values.password,
    password2: values.password2,
    token: params.token,
  };
    setLoading(true);
    dispatch(ChangePasswordThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        localStorage.setItem("access", res.token.access);
        localStorage.setItem("refresh", res.token.refresh);

        setTimeout(() => {
          navigate("/dashboard/");
        }, 2000);
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
  };

  return (
    <>
      {contextHolder}
      <div className="change-password-layout">
        {/* Left Brand Panel (Desktop only) */}
        <div className="brand-panel">
          <div className="brand-content">
            <Space align="center" className="brand-header">
              <div className="brand-logo-badge">
                <ThunderboltFilled className="brand-logo-icon" />
              </div>
              <Title level={2} className="brand-name">
                LLM Arena
              </Title>
            </Space>

            <Title level={1} className="brand-tagline">
              Set up your new password.
            </Title>
            <Text className="brand-description">
              Choose a strong, unique password to ensure your account security
              across all workspaces and model arenas.
            </Text>

            <div className="brand-features">
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Minimum 8 characters with high-entropy checks
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Automatic active session invalidation
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Instant confirmation email notification
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="form-panel">
          <div className="form-wrapper">
            <div className="mobile-brand-header">
              <div className="brand-logo-badge">
                <ThunderboltFilled className="brand-logo-icon" />
              </div>
              <Title level={3} className="mobile-brand-name">
                LLM Arena
              </Title>
            </div>

            {!isSuccess ? (
              <>
                <div className="form-header">
                  <div className="security-icon-badge">
                    <SafetyCertificateOutlined className="security-icon" />
                  </div>
                  <Title level={2} className="form-title">
                    Set new password
                  </Title>
                  <Text type="secondary" className="form-subtitle">
                    Your new password must be different from previously used
                    passwords.
                  </Text>
                </div>

                <Form
                  form={form}
                  name="change_password_form"
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    label="New Password"
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your new password",
                      },
                      {
                        min: 8,
                        message: "Password must be at least 8 characters",
                      },
                    ]}
                    hasFeedback
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="field-icon" />}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="custom-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Confirm New Password"
                    name="password2"
                    dependencies={["newPassword"]}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your new password",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            !value ||
                            getFieldValue("password") === value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("The two passwords do not match!"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="field-icon" />}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      className="custom-input"
                    />
                  </Form.Item>

                  <Form.Item className="submit-item">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      block
                      className="primary-change-btn"
                    >
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>

                <div className="form-footer">
                  <Text type="secondary">
                    Remember your password?{" "}
                    <Link to="/login" className="login-link">
                      Sign in
                    </Link>
                  </Text>
                </div>
              </>
            ) : (
              <div className="success-container">
                <Result
                  status="success"
                  title="Password reset successfully"
                  subTitle="Your password has been changed. You can now sign in with your new credentials."
                  extra={[
                    <Button
                      type="primary"
                      key="login"
                      size="large"
                      block
                      className="primary-change-btn"
                      onClick={() => (window.location.href = "/login")}
                    >
                      Sign In Now
                    </Button>,
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
