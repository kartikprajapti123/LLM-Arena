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
  MailOutlined,
  ArrowLeftOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
  KeyOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ForgotPasswordThunkApi } from "../../slice/Auth.Slice";

const { Title, Text, Link } = Typography;

export const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [message, contextHolder] = notification.useNotification();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    dispatch(ForgotPasswordThunkApi(values))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        form.resetFields();
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
      <div className="forgot-password-layout">
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
              Secure and seamless account recovery.
            </Title>
            <Text className="brand-description">
              Don't worry, reset links are sent instantly so you can get back to
              benchmarking models and collaborating with your team.
            </Text>

            <div className="brand-features">
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Encrypted single-use password recovery links
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Instant delivery to your registered work email
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Secure multi-factor reset confirmation
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

            {!isSubmitted ? (
              <>
                <div className="form-header">
                  <div className="reset-icon-badge">
                    <KeyOutlined className="reset-icon" />
                  </div>
                  <Title level={2} className="form-title">
                    Forgot password?
                  </Title>
                  <Text type="secondary" className="form-subtitle">
                    No worries! Enter your registered email address and we'll
                    send you a link to reset your password.
                  </Text>
                </div>

                <Form
                  form={form}
                  name="forgot_password_form"
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    label="Work Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      {
                        type: "email",
                        message: "Please enter a valid email address",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined className="field-icon" />}
                      placeholder="name@company.com"
                      autoComplete="email"
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
                      className="primary-reset-btn"
                    >
                      Send Reset Link
                    </Button>
                  </Form.Item>
                </Form>

                <div className="form-footer">
                  <Link href="/login" className="back-to-login-link">
                    <ArrowLeftOutlined /> Back to Sign In
                  </Link>
                </div>
              </>
            ) : (
              <div className="success-container">
                <Result
                  status="success"
                  title="Check your email"
                  subTitle={`We have sent a password reset link to ${submittedEmail}. Please check your inbox and follow the instructions.`}
                  extra={[
                    <Button
                      type="primary"
                      key="login"
                      size="large"
                      block
                      className="primary-reset-btn"
                      onClick={() => (window.location.href = "/login")}
                    >
                      Return to Sign In
                    </Button>,
                    <Button
                      key="resend"
                      type="text"
                      className="resend-btn"
                      onClick={() => setIsSubmitted(false)}
                    >
                      Didn't receive the email? Try again
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
