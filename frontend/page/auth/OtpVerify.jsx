import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  notification,
} from "antd";
import {
  ThunderboltFilled,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { OtpResendThunkApi, OtpVerifyThunkApi } from "../../slice/Auth.Slice";
const { Title, Text } = Typography;

export const OtpVerify = () => {
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [message, contextHolder] = notification.useNotification();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const dispatch = useDispatch();
  const params = useParams();
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle individual character inputs
  const handleChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last entered character
    setOtp(newOtp);

    // Auto-advance to next input field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keypresses (Backspace navigation)
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasted 6-digit codes
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const onFinish = () => {
    const code = otp.join("");
    const token = params.token;

    const data = {
      otp: code,
      token: token,
    };
    setLoading(true);
    dispatch(OtpVerifyThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        localStorage.setItem("access", res.token.access);
        localStorage.setItem("refresh", res.token.refresh);
        setTimeout(() => {
          navigate("/workspace-on-boarding/");
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

  const handleResend = () => {
    setLoadingResend(true);
    const data = {
      token: params.token,
    };
    dispatch(OtpResendThunkApi(data))
      .unwrap()
      .then((res) => {
        console.log(res)
        message.success({
          title: "Success",
          description: res.message,
        });
      })
      .catch((error) => {
        message.error({
          title: "Error",
          description: error,
        });
      })
      .finally(() => {
        
        setLoadingResend(false);
      });
  };

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
              Secure multi-factor authentication.
            </Title>
            <Text className="brand-description">
              Protecting your workspace, prompt benchmarks, and team insights
              with enterprise-grade security verification.
            </Text>

            <div className="brand-features">
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  End-to-end encrypted session access
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Zero-trust workspace security controls
                </Text>
              </div>
              <div className="feature-item">
                <CheckCircleFilled className="feature-icon" />
                <Text className="feature-text">
                  Instant identity validation
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
              <div className="icon-badge">
                <SafetyCertificateOutlined className="security-icon" />
              </div>
              <Title level={2} className="form-title">
                Two-step verification
              </Title>
              <Text type="secondary" className="form-subtitle">
                We've sent a 6-digit verification code to{" "}
                <Text strong className="user-email">
                  name@company.com
                </Text>
              </Text>
            </div>

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item label="Enter 6-digit code" className="otp-form-item">
                <div className="otp-input-container" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="otp-digit-input"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </Form.Item>

              <Form.Item className="submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  className="primary-login-btn"
                >
                  Verify Code
                </Button>
              </Form.Item>
            </Form>

            <div className="resend-wrapper">
              <Text type="secondary">Didn't receive the code? </Text>
              {canResend ? (
                <Link onClick={handleResend} className="signup-link">
                  Resend Code
                </Link>
              ) : (
                <Text type="secondary" disabled>
                  Resend in <span className="timer-count">{timer}s</span>
                </Text>
              )}
            </div>

            <div className="form-footer">
              <Link to="/register" className="back-link">
                <ArrowLeftOutlined /> Back to Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
