import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, notification,Modal } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogoutThunkApi } from "../slice/Auth.Slice";
import {
  SafetyOutlined,
  BlockOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  LockOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ApiOutlined,
  UserAddOutlined,
  RobotOutlined,
  DashboardOutlined,
  MessageOutlined,
  LogoutOutlined,
  AppstoreOutlined ,
  EditOutlined,
} from "@ant-design/icons";
import "../common/CommonSiderStyle.css";

import { getSingleUserThunkApi } from "../slice/Auth.Slice";

const { Sider } = Layout;

export default function CommonSider({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const location = useLocation();
  const dispatch = useDispatch();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [message, contextHolder] = notification.useNotification();
  const navigate = useNavigate()
  const user_detail = useSelector((state) => state.auth?.user_detail || {});

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (mobile) {
        setCollapsed(false);
      } else {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed, setMobileOpen]);

  useEffect(() => {
    dispatch(getSingleUserThunkApi())
      .unwrap()
      .catch((error) => {
        message.error({
          message: "User Profile Error",
          description: String(error),
        });
      });
  }, [dispatch]);

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      content: "Are you sure you want to logout?",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        // Your logout logic here
        const data = {
          refresh: localStorage.getItem("refresh"),
        };
        dispatch(LogoutThunkApi(data))
          .unwrap()
          .then((res) => {
            message.success({
              title: "Success",
              description: res.message,
            });
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");

            setTimeout(() => {
              navigate("/login/");
            }, 1000);
          })
          .catch((error) => {
            message.error({
              title: "Error",
              description: error,
            });
          });

        console.log("Logging out...");
      },
    });
  };

const isAdmin = user_detail?.user_role === "admin";
const isUser = user_detail?.user_role === "user";

const isOwner = isUser && user_detail?.workspace_role === "owner";
const isMember = isUser && user_detail?.workspace_role === "member";

const items = [
  // Admin menu
  ...(isAdmin
    ? [
        {
          key: "/",
          icon: <DashboardOutlined />,
          label: <Link to="/">Admin Dashboard</Link>,
        },
        {
          key: "/llm-provider/",
          icon: <ApiOutlined />,
          label: <Link to="/llm-provider/">LLM Provider</Link>,
        },
        {
          key: "/llm-model/",
          icon: <RobotOutlined />,
          label: <Link to="/llm-model/">LLM Model</Link>,
        },
      ]
    : []),

     ...(isOwner || isMember
    ? [ {
          key: "/",
          icon: <TeamOutlined />,
          label: <Link to="/">Dashboard</Link>,
        }, {
          key: "/workspace-member/",
          icon: <TeamOutlined />,
          label: <Link to="/workspace-member/">Workspace Members</Link>,
        }, ] :[]),

  // Workspace owner menu
  ...(isOwner
    ? [
      
       
        {
          key: "/workspace-credential/",
          icon: <SafetyOutlined />,
          label: (
            <Link to="/workspace-credential/">
              Workspace Credential
            </Link>
          ),
        },
        {
          key: "/llm-project-model/",
          icon: <AppstoreOutlined  />,
          label: <Link to="/llm-project-model/">LLM Project Selection</Link>,
        },
        
      ]
    : []),

  // Workspace owner and member menu
  ...(isOwner || isMember
    ? [
      
        {
          key: "/project/",
          icon: <FolderOpenOutlined/>,
          label: <Link to="/project/">Workspace Projects</Link>,
        },
        
        {
          key: "/workspace-invite/",
          icon: <UserAddOutlined />,
          label: <Link to="/workspace-invite/">Workspace Invite</Link>,
        },
        {
          key: "/chat/",
          icon: <MessageOutlined />,
          label: <Link to="/chat/">Conversation</Link>,
        },
      ]
    : []),

  // Common settings for admins and users
  ...(isAdmin || isUser
    ? [
        {
          key: "account-settings",
          icon: <SettingOutlined />,
          label: "Settings",
          children: [
            {
              key: "/update-profile/",
              icon: <UserOutlined />,
              label: <Link to="/update-profile/">Update Profile</Link>,
            },
            ...(isOwner ? [{
          key: "/update-workspace/",
          icon: <EditOutlined />,
          label: <Link to="/update-workspace/">Update Workspace</Link>,
        },] :[]),
            {
              key: "/reset-password/",
              icon: <LockOutlined />,
              label: <Link to="/reset-password/">Reset Password</Link>,
            },
          ],
        },
        {
          key: "/logout/",
          icon: <LogoutOutlined />,
          label: <Link>Logout</Link>,
          onClick: handleLogout,
        },
      ]
    : []),
];


  const getOpenKeys = () => {
    if (
      [
        "/workspace-member/",
        "/workspace-invite/",
        "/workspace-credential/",
      ].includes(location.pathname)
    ) {
      return ["workspace-manage"];
    }

    if (
      ["/update-profile/", "/update-workspace/", "/reset-password/"].includes(
        location.pathname,
      )
    ) {
      return ["account-settings"];
    }

    return [];
  };

  return (
    <>
      {contextHolder}

      {/* Mobile hamburger button: visible while sidebar is closed */}
      {isMobile && !mobileOpen && (
        <Button
          type="primary"
          className="sidebar-trigger"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        />
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <Sider
        width={270}
        collapsedWidth={80}
        trigger={null}
        collapsed={!isMobile && collapsed}
        className={`common-sider ${
          isMobile ? (mobileOpen ? "mobile-open" : "mobile-close") : ""
        }`}
      >
        {/* Desktop collapse button */}
        {!isMobile && (
          <Button
            type="primary"
            shape="circle"
            className="sidebar-trigger"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        )}

        {/* Brand */}
        <div className="sidebar-logo">
          <img
            src="/src/assets/logo_without_background.png"
            alt="LLM Arena"
            className="logo-image"
          />

          {(!isMobile || mobileOpen) && !collapsed && (
            <div className="logo-text-wrapper">
              <div className="logo-title">LLM Arena</div>
              <div className="logo-subtitle">AI Benchmarking Hub</div>
            </div>
          )}
        </div>

        {/* Workspace */}
        {(!isMobile || mobileOpen) && !collapsed && (
          <div className="workspace-selector-container">
            <span className="workspace-label">ACTIVE WORKSPACE</span>
            <div className="workspace-name"> {user_detail.workspace_name || "Admin Workspace"}</div>
          </div>
        )}

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={items}
          className="sider-menu"
          onClick={({ key }) => {
            if (isMobile && key.startsWith("/")) {
              setMobileOpen(false);
            }
          }}
        />
      </Sider>
    </>
  );
}
