import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Divider,
  Alert,
  Space,
} from "antd";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
} from "@ant-design/icons";
import useNotification from "antd/es/notification/useNotification";
import { useSelector, useDispatch } from "react-redux";
import { RegisterThunkApi } from "../../slice/Auth.Slice";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const { Title, Text } = Typography;

export const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [message, contextHolder] = useNotification();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);
    const data = form.getFieldsValue();
    dispatch(RegisterThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        setLoading(false);
        setTimeout(() => {
          navigate(`/otp-verify/${res.verification_token}/`);
        }, 2000);
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
        setLoading(false);
      });
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",

    onSuccess: async (codeResponse) => {
      try {
        console.log("Google Code:", codeResponse.code);

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}google-social-auth/`,
          {
            code: codeResponse.code,
          },
        );

        console.log(response.data);

        const data = response.data;

        if (!data.success) {
          message.error(data.error || "Google login failed");
          return;
        } else {
          localStorage.setItem("access", data.token.access);

          localStorage.setItem("refresh", data.token.refresh);

          message.success({
            title: "Success",
            description: data.message,
          });

          return;
        }
      } catch (error) {
        console.error("Google Login Error:", error.response?.data || error);

        message.error(
          error.response?.data?.message ||
            "Something went wrong with Google login",
        );

        message.error({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Something went wrong with Google login",
        });
      }
    },

    onError: () => {
      message.error({
        title: "Error",
        description: "Google Login Failed",
      });
    },
  });

  return (
    <>
      {contextHolder}

      <div className="register-layout">
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
              Start Exploring AI Models Today.
            </Title>
            <Text className="brand-description">
              Create your account to compare AI model responses, evaluate their performance, and manage your projects in one place.
            </Text>

            <div className="brand-features">
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Compare responses from multiple AI models
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Create projects and collaborate with your team
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Save and review your model comparisons
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

            <div className="form-header">
              <Title level={2} className="form-title">
                Create account
              </Title>
              <Text type="secondary" className="form-subtitle">
                Get started with your personal developer account
              </Text>
            </div>

            <Form
              form={form}
              name="register_form"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please enter your username" },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className="field-icon" />}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="custom-input"
                />
              </Form.Item>

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

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter a password" },
                  { min: 8, message: "Password must be at least 8 characters" },
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
                label="Confirm Password"
                name="password2"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
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
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item
                name="terms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "You must accept the terms and conditions",
                            ),
                          ),
                  },
                ]}
              >
                <Checkbox>
                  I agree to the{" "}
                  <Link to="/terms-and-condition/" className="terms-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy/" className="terms-link">
                    Privacy Policy
                  </Link>
                </Checkbox>
              </Form.Item>

              <Form.Item className="submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  className="primary-register-btn"
                >
                  Create Account
                </Button>
              </Form.Item>
            </Form>

            <Divider plain className="auth-divider">
              or continue with
            </Divider>

            <div className="sso-group">
              <Button
                size="large"
                icon={<GoogleOutlined />}
                block
                className="sso-btn"
                onClick={() => googleLogin()}
              >
                Google
              </Button>
            </div>

            <div className="form-footer">
              <Text type="secondary">
                Already have an account?{" "}
                <Link to="/login" className="login-link">
                  Sign in
                </Link>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
