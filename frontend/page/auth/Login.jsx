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
  notification,
} from "antd";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import {
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  GithubOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LoginThunkApi } from "../../slice/Auth.Slice";
const { Title, Text } = Typography;

export const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [message, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    dispatch(LoginThunkApi(values))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        localStorage.setItem("access", res.token.access);
        localStorage.setItem("refresh", res.token.refresh);

        setTimeout(() => {
          navigate("/");
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

          console.log(data.is_new_user)
          message.success({
            title: "Success",
            description: data.message,
          });
          if (data.user.is_new_user){
            navigate("/workspace-on-boarding/")
          }
          else{
            navigate("/")
          }

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
      <div className="login-layout">
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
              Compare AI Models. Find the Best.
            </Title>
            <Text className="brand-description">
              Run prompts across multiple AI models, compare their responses, and evaluate performance—all in one place.
            </Text>

            <div className="brand-features">
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Compare responses from multiple AI models side by side
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Evaluate model performance with AI-powered judging
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Organize projects and collaborate with your team
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
                Welcome back
              </Title>
              <Text type="secondary" className="form-subtitle">
                Sign in to access your workspaces and project arenas
              </Text>
            </div>

            <Form
              form={form}
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              initialValues={{ remember: true }}
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

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter your password" },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className="field-icon" />}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="custom-input"
                />
              </Form.Item>

              <div className="login-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Keep me signed in</Checkbox>
                </Form.Item>
                <Link className="forgot-password-link" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <Form.Item className="submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  className="primary-login-btn"
                >
                  Sign In
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
                Don't have an account?{" "}
                <Link to="/register" className="signup-link">
                  Create an account
                </Link>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
