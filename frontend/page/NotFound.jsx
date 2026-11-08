import { Button, Card, Col, Row, Space, Typography } from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  ProjectOutlined,
  MessageOutlined,
  RobotOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import llmArenaLogo from "../src/assets/logo_without_background.png";

const { Title, Text, Paragraph } = Typography;

// Manually defined theme colors
const COLORS = {
  primary: "#4f46e5",
  primaryHover: "#4338ca",
  primaryBackground: "#eef2ff",

  pageBackground: "#f8fafc",
  cardBackground: "#ffffff",

  text: "#1e293b",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",

  border: "#e2e8f0",
  backgroundSecondary: "#f1f5f9",

  white: "#ffffff",
};

const QUICK_LINKS = [
  {
    label: "Projects",
    description: "Manage and compare runs",
    path: "/project/",
    icon: <ProjectOutlined />,
  },
  {
    label: "Chat",
    description: "Talk to your models",
    path: "/chat/",
    icon: <MessageOutlined />,
  },
  {
    label: "Models",
    description: "Browse LLM models",
    path: "/llm-model/",
    icon: <RobotOutlined />,
  },
];

export const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: COLORS.pageBackground,
        color: COLORS.text,
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          background: COLORS.cardBackground,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <img
          src={llmArenaLogo}
          alt="LLM Arena logo"
          style={{
            width: 36,
            height: 36,
            objectFit: "contain",
          }}
        />

        <div style={{ lineHeight: 1.2 }}>
          <Text
            strong
            style={{
              fontSize: 16,
              display: "block",
              color: COLORS.text,
            }}
          >
            LLM Arena
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: COLORS.textSecondary,
            }}
          >
            AI Benchmarking Hub
          </Text>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            textAlign: "center",
          }}
        >
          {/* 404 number */}
          <div
            aria-hidden="true"
            style={{
              fontSize: "clamp(88px, 22vw, 160px)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: COLORS.primary,
              opacity: 0.9,
              userSelect: "none",
            }}
          >
            404
          </div>

          <Title
            level={2}
            style={{
              margin: "8px 0",
              color: COLORS.text,
            }}
          >
            Page not found
          </Title>

          <Paragraph
            style={{
              fontSize: 15,
              maxWidth: 460,
              margin: "0 auto 16px",
              color: COLORS.textSecondary,
            }}
          >
            This page doesn't exist or has been moved. Check the address, or
            use one of the options below to get back on track.
          </Paragraph>

          {/* Requested URL */}
          <Text
            code
            style={{
              display: "inline-block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
              marginBottom: 24,
              padding: "4px 8px",
              background: COLORS.backgroundSecondary,
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
            }}
            title={location.pathname}
          >
            {location.pathname}
          </Text>

          {/* Action buttons */}
          <div>
            <Space
              wrap
              size="middle"
              style={{ justifyContent: "center" }}
            >
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                style={{
                  background: COLORS.cardBackground,
                  color: COLORS.text,
                  borderColor: COLORS.border,
                }}
              >
                Go back
              </Button>

              <Button
                size="large"
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => navigate("/dashboard/")}
                style={{
                  background: COLORS.primary,
                  color: COLORS.white,
                  borderColor: COLORS.primary,
                }}
              >
                Go to dashboard
              </Button>
            </Space>
          </div>

          {/* Quick links */}
          <div
            style={{
              marginTop: 40,
              textAlign: "left",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
              }}
            >
              Or jump to
            </Text>

            <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
              {QUICK_LINKS.map((item) => (
                <Col xs={24} sm={8} key={item.path}>
                  <Card
                    hoverable
                    size="small"
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(item.path)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(item.path);
                      }
                    }}
                    style={{
                      height: "100%",
                      background: COLORS.cardBackground,
                      borderColor: COLORS.border,
                      borderRadius: 10,
                    }}
                  >
                    <Space
                      align="start"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {/* Quick-link icon */}
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          fontSize: 18,
                          color: COLORS.primary,
                          background: COLORS.primaryBackground,
                          borderRadius: 8,
                        }}
                      >
                        {item.icon}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          strong
                          style={{
                            display: "block",
                            color: COLORS.text,
                          }}
                        >
                          {item.label}{" "}
                          <RightOutlined
                            style={{
                              fontSize: 10,
                              color: COLORS.textTertiary,
                            }}
                          />
                        </Text>

                        <Text
                          style={{
                            fontSize: 12,
                            color: COLORS.textSecondary,
                          }}
                        >
                          {item.description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 24px",
          textAlign: "center",
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.cardBackground,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
          }}
        >
          © {new Date().getFullYear()} LLM Arena. All rights reserved.
        </Text>
      </footer>
    </div>
  );
};

export default NotFound;