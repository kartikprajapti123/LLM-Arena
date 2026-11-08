import React, { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import CommonHeader from "./CommonHeaders.jsx";
import CommonSider from "./CommonSider.jsx";

const { Content } = Layout;

export default function CommonLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = window.innerWidth < 992;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <CommonSider
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <Layout style={{ background: "#f8fafc", height: "100vh"}}>
        <CommonHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <Content
          className="content-area hide-scrollbar"
          style={{
            margin: "16px",
            padding: "20px",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #edf2f7",
            minHeight: "calc(100vh - 104px)",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: 24,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}