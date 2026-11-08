import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  notification,
  Typography,
  Space,
  Alert,
} from "antd";
import {
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Save,
  ShieldAlert,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { ResetPasswordThunkApi } from "../../slice/Auth.Slice";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [message, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  // Real-time strength criteria check
  const hasMinLength = newPasswordValue.length >= 8;
  const hasNumber = /\d/.test(newPasswordValue);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPasswordValue);

  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  const onFinish = (values) => {
    setLoading(true);
    const data = {
      old_password: values.old_password,
      new_password: values.new_password,
      confirm_password: values.confirm_password,
    };

    dispatch(ResetPasswordThunkApi(data))
      .unwrap()
      .then((res) => {
        message.success({
          title: "Success",
          description: res.message,
        });
        form.resetFields()
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
    <div className="settings-page-container">
      {contextHolder}

      <Card className="settings-card" bordered={false}>
        {/* Header */}
        <div className="settings-header">
          <Space size={14} align="center">
            <div className="settings-icon-badge">
              <KeyRound size={22} className="settings-icon" />
            </div>
            <div>
              <Title level={4} className="settings-title">
                Reset Password
              </Title>
              <Text className="settings-subtitle">
                Update your account password to maintain security integrity
                across workspaces.
              </Text>
            </div>
          </Space>
        </div>

        <Alert
          message="Security Notice"
          description="Changing your password will require you to re-authenticate on other active sessions."
          type="info"
          showIcon
          icon={<ShieldAlert size={18} />}
          className="settings-alert"
        />

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="settings-form"
        >
          {/* Current Password */}
          <Form.Item
            name="old_password"
            label={<span className="settings-label">Current Password</span>}
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} className="settings-input-icon" />}
              placeholder="Enter current password"
              size="large"
              className="settings-input"
            />
          </Form.Item>

          {/* New Password */}
          <Form.Item
            name="new_password"
            label={<span className="settings-label">New Password</span>}
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<ShieldCheck size={16} className="settings-input-icon" />}
              placeholder="Enter new password"
              size="large"
              onChange={(e) => setNewPasswordValue(e.target.value)}
              className="settings-input"
            />
          </Form.Item>

          {/* Password Validation Indicators */}
          {newPasswordValue && (
            <div className="password-criteria-box">
              <Text className="criteria-header">Password Requirements:</Text>
              <div className="criteria-list">
                <div className={`criteria-item ${hasMinLength ? "valid" : ""}`}>
                  {hasMinLength ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>At least 8 characters long</span>
                </div>
                <div className={`criteria-item ${hasNumber ? "valid" : ""}`}>
                  {hasNumber ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>Includes at least 1 number</span>
                </div>
                <div
                  className={`criteria-item ${hasSpecialChar ? "valid" : ""}`}
                >
                  {hasSpecialChar ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>Includes at least 1 special character</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm New Password */}
          <Form.Item
            name="confirm_password"
            label={<span className="settings-label">Confirm New Password</span>}
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<ShieldCheck size={16} className="settings-input-icon" />}
              placeholder="Re-enter new password"
              size="large"
              className="settings-input"
            />
          </Form.Item>

          {/* Submit Action */}
          <div className="settings-action-wrapper">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              disabled={!isPasswordValid}
              icon={<Save size={16} />}
              className="settings-submit-btn"
            >
              Update Password
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
