import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Alert,
  notification,
  Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  Camera,
  Save,
  LockKeyhole,
  Globe,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getSingleUserThunkApi,
  updateUserThunkApi,
} from "../../slice/Auth.Slice";
import { listCountryThunkApi } from "../../slice/Country.Slice";
import { listStateThunkApi } from "../../slice/State.Slice";
import { listCityThunkApi } from "../../slice/City.Slice";
const { Option } = Select;

export const UpdateProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [message, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const user_detail = useSelector((state) => state.auth.user_detail);

  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj || info.file;
    console.log(file);
    if (file) {
      setProfileImage(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const countriesRes = await dispatch(listCountryThunkApi())
        .unwrap()
        .then((res) => {
          setCountries(res.results || []);
        });

      const userRes = await dispatch(getSingleUserThunkApi()).unwrap();
      const userData = userRes.data;

      form.setFieldsValue(userData);
      setImageUrl(userData?.profile_image);

      if (userData?.country) {
        const params = {
      country_name: userData.country_name,
      no_pagination: true,
    };
        const statesRes = await dispatch(
          listStateThunkApi(params),
        ).unwrap();
        setStates(statesRes.data || []);
      }

      if (userData?.state) {
        const params = {
      state_name: userData.state_name,
      no_pagination: true,
    };
        const citiesRes = await dispatch(
          listCityThunkApi(params),
        ).unwrap();
        setCities(citiesRes.data || []);
      }
    } catch (error) {
      message.error({
        title: "Initialization Error",
        description: error || "Failed to load account settings.",
      });
    }
  };

  const handleCountryChange = (country_name) => {
    console.log(country_name);
    form.setFieldsValue({ state_name: undefined, city_name: undefined });
    setStates([]);
    setCities([]);

    const params = {
      country_name: country_name,
      no_pagination: true,
    };
    dispatch(listStateThunkApi(params))
      .unwrap()
      .then((res) => setStates(res.data || []))
      .catch(() =>
        message.error({
          title: "Error",
          description: "Failed to fetch states list.",
        }),
      );
  };

  const handleStateChange = (state_name) => {
    form.setFieldsValue({ city_name: undefined });
    setCities([]);

    const params = {
      state_name: state_name,
      no_pagination: true,
    };
    dispatch(listCityThunkApi(params))
      .unwrap()
      .then((res) => setCities(res.data || []))
      .catch(() =>
        message.error({
          title: "Error",
          description: "Failed to fetch cities list.",
        }),
      );
  };

  const onFinish = () => {
    setLoading(true);
    const values = form.getFieldsValue();

    const selectedCountry = countries.find(
      (item) => item.name === values.country_name,
    );

    const selectedState = states.find((item) => item.name === values.state_name);

    const selectedCity = cities.find((item) => item.name === values.city_name);

    const userData = {
      ...values,

      country: selectedCountry?.id || null,
      state: selectedState?.id || null,
      city: selectedCity?.id || null,
    };
    delete userData.country_name;
  delete userData.state_name;
  delete userData.city_name;
    console.log(userData)

    const formData = new FormData();

    formData.append("user_data", JSON.stringify(userData));

    if (profileImage) {
      formData.append("profile_image", profileImage);
    }

    dispatch(updateUserThunkApi({ id: user_detail?.id, data: formData }))
      .unwrap()
      .then((res) => {
        setLoading(false);
        message.success({
          title: "Profile Updated",
          description:
            res.message || "Your settings have been saved successfully.",
        });
        form.setFieldsValue(res.data);
        setImageUrl(res.data?.profile_image);
      })
      .catch((error) => {
        setLoading(false);
        message.error({
          title: "Update Failed",
          description: error || "Could not save profile changes.",
        });
      });
  };

  return (
    <>
      {contextHolder}
      <div
        className="profile-page-container"
        style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto" }}
      >
        {/* Page Header */}
        <div className="profile-header-bar" style={{ marginBottom: "28px" }}>
          <Space size={16} align="center">
            <div
              style={{
                padding: "10px",
                borderRadius: "10px",
                background: "var(--ant-color-bg-container, #ffffff)",
                border: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Settings size={22} style={{ color: " #722ED1" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: "600",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Account Settings
              </h1>
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--ant-color-text-description, #8c8c8c)",
                }}
              >
                Manage your profile identity, contact preferences, and regional
                parameters
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
            {/* Left Column: Avatar & Account Meta Info */}
            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: "12px",
                  boxShadow:
                    "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    margin: "16px 0",
                  }}
                >
                  <Upload
                    name="profile_image"
                    listType="picture-circle"
                    showUploadList={false}
                    beforeUpload={() => false}
                    maxCount={1}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ margin: 0 }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Profile Avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: "600",
                          color: "#595959",
                        }}
                      >
                        {user_detail?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </Upload>
                  <Tooltip title="Upload new photo">
                    <div
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        right: "4px",
                        background: "#722ED1",
                        color: "#ffffff",
                        borderRadius: "50%",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                      }}
                    >
                      <Camera size={14} />
                    </div>
                  </Tooltip>
                </div>

                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "8px 0 4px 0",
                  }}
                >
                  {user_detail?.username || "Account User"}
                </h2>

                <div style={{ marginBottom: "20px" }}>
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: "12px",
                      padding: "2px 10px",
                      fontWeight: 500,
                    }}
                  >
                    {
  user_detail?.user_role === "admin"
    ? "Admin"
    : user_detail?.workspace_role === "owner"
      ? "Owner"
      : "Member"
}
                  </Tag>
                </div>

                <div
                  style={{
                    borderTop:
                      "1px solid var(--ant-color-border-secondary, #f0f0f0)",
                    paddingTop: "16px",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#8c8c8c" }}>
                      System Status
                    </span>
                    {user_detail?.is_active ? (
                      <Tag
                        icon={<CheckCircle2 size={12} />}
                        color="success"
                        style={{ margin: 0, borderRadius: "10px" }}
                      >
                        Active
                      </Tag>
                    ) : (
                      <Tag
                        icon={<XCircle size={12} />}
                        color="error"
                        style={{ margin: 0, borderRadius: "10px" }}
                      >
                        Inactive
                      </Tag>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#8c8c8c" }}>
                      Authentication Level
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      Root {user_detail?.user_type || "User"}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column: Profile Form Details */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Modifiable Information */}
                <Card
                  title={
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>
                      Personal Details
                    </span>
                  }
                  bordered={false}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="username" label="Display Profile Name">
                        <Input
                          prefix={
                            <User
                              size={16}
                              style={{ color: "#bfbfbf", marginRight: 6 }}
                            />
                          }
                          placeholder="Enter display name"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item name="phone_number" label="Contact Number">
                        <Input
                          prefix={
                            <Phone
                              size={16}
                              style={{ color: "#bfbfbf", marginRight: 6 }}
                            />
                          }
                          placeholder="Enter phone number"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Location Parameters */}
                <Card
                  title={
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>
                      Location Parameters
                    </span>
                  }
                  bordered={false}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item name="country_name" label="Country">
                        <Select
                          showSearch
                          size="large"
                          placeholder="Select Country"
                          optionFilterProp="children"
                          onChange={handleCountryChange}
                          suffixIcon={
                            <Globe size={16} style={{ color: "#bfbfbf" }} />
                          }
                        >
                          {countries.map((item) => (
                            <Option key={item.id} value={item.name}>
                              {item.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item name="state_name" label="State / Province">
                        <Select
                          showSearch
                          size="large"
                          placeholder="Select State"
                          optionFilterProp="children"
                          disabled={!states.length}
                          onChange={handleStateChange}
                          suffixIcon={
                            <MapPin size={16} style={{ color: "#bfbfbf" }} />
                          }
                        >
                          {states.map((item) => (
                            <Option key={item.id} value={item.name}>
                              {item.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item name="city_name" label="City">
                        <Select
                          showSearch
                          size="large"
                          placeholder="Select City"
                          optionFilterProp="children"
                          disabled={!cities.length}
                          suffixIcon={
                            <Building2 size={16} style={{ color: "#bfbfbf" }} />
                          }
                        >
                          {cities.map((item) => (
                            <Option key={item.id} value={item.name}>
                              {item.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* System Identity & Security Notice */}
                <Card
                  title={
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>
                      System Identity
                    </span>
                  }
                  bordered={false}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item name="email" label="Email Address (System ID)">
                        <Input
                          prefix={
                            <Mail
                              size={16}
                              style={{ color: "#bfbfbf", marginRight: 6 }}
                            />
                          }
                          disabled
                          size="large"
                          suffix={
                            user_detail?.is_email_verified ? (
                              <Tag
                                color="success"
                                style={{ borderRadius: "10px", margin: 0 }}
                              >
                                <Space size={4}>
                                  <ShieldCheck size={12} /> Verified
                                </Space>
                              </Tag>
                            ) : null
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Alert
  style={{
    borderRadius: "8px",
    marginTop: "8px",
    background: "#746ee9",
    border: "none",
  }}
  message={
    <span style={{ color: "#ffffff", fontWeight: 600 }}>
      System Protected Information
    </span>
  }
  description={
    <span style={{ color: "#ffffff" }}>
      Your primary email address and administrative permissions are managed at the organization level to uphold workspace security integrity.
    </span>
  }
  type="info"
  showIcon
  icon={<LockKeyhole size={18} color="#ffffff" />}
/>
                </Card>

                {/* Action Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<Save size={16} />}
                    size="large"
                    style={{
                      borderRadius: "8px",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      background: "#4f46e5",
    color: "white"
                    }}
                  >
                    Save Changes
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
