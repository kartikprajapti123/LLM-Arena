import React from "react";
import { Layout } from "antd";
import { Link } from "react-router-dom";
import { ThunderboltOutlined } from "@ant-design/icons";
import "../common/CommonHeadersStyle.css";

const { Footer } = Layout;

// Edit these to match your real routes.
const FOOTER_LINKS = [
  { label: "Dashboard", to: "/" },
  { label: "Privacy policy", to: "/privacy/" },
  { label: "Terms of service", to: "/terms-and-condition/" },
];

export default function CommonFooter() {
  const year = new Date().getFullYear();

  return (
    <Footer className="common-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo" aria-hidden="true">
            <ThunderboltOutlined />
          </span>
          <div className="footer-brand-text">
            <span className="footer-brand-name">LLM Arena</span>
            <span className="footer-brand-tagline">AI Benchmarking Hub</span>
          </div>
        </div>

        {/* Links */}
        <nav className="footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="footer-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <div className="footer-copy">
          &copy; {year} LLM Arena. All rights reserved.
        </div>
      </div>
    </Footer>
  );
}