import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Segmented,
  Button,
  Space,
  Typography,
  Skeleton,
  Empty,
  Result,
  Input,
  Switch,
  Avatar,
  notification,
} from "antd";
import {
  TeamOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  ApiOutlined,
  RobotOutlined,
  SwapOutlined,
  TrophyOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import {
  adminDashboardThunkApi,
  ownerDashboardThunkApi,
  memberDashboardThunkApi,
} from "../slice/Auth.Slice";

const { Text } = Typography;

/* ================= helpers ================= */
const fmt = (n) => Number(n || 0).toLocaleString();
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const ago = (d) => {
  if (!d) return "";
  const s = (new Date(d) - Date.now()) / 1000;
  const a = Math.abs(s);
  if (a < 60) return "just now";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
};
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const THUNKS = {
  admin: adminDashboardThunkApi,
  owner: ownerDashboardThunkApi,
  member: memberDashboardThunkApi,
};

const ROLE_META = {
  admin: { label: "Admin", sub: "Platform-wide users, workspaces and LLM activity." },
  owner: { label: "Workspace owner", sub: "Everything happening in the workspaces you own." },
  member: { label: "Workspace member", sub: "Projects and activity in the workspaces you have joined." },
};

const STATUS_COLORS = {
  completed: "#16a34a",
  running: "#2563eb",
  pending: "#d97706",
  failed: "#dc2626",
};

// Decide which dashboard to load from the user's roles (no guessing, one API call)
const resolveRole = (u) => {
  if (!u) return null;
  if (u.user_role === "admin") return "admin";
  if (u.workspace_role === "owner") return "owner";
  if (u.workspace_role === "member") return "member";
  return "none";
};

/* ================= building blocks ================= */
const Sparkline = ({ data = [], color = "#2563eb" }) => {
  if (data.length < 2) return null;
  const w = 84;
  const h = 32;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6) - 3}`)
    .join(" ");
  return (
   <svg
  width={w}
  height={h}
  className="dash-spark"
  aria-hidden="true"
>
  <polyline
    points={pts}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
  );
};

const StatCard = ({ icon, title, value, suffix, tone = "blue", delta, deltaLabel, hint, spark, sparkColor }) => (
  <Card bordered={false} className="dash-stat-card">
    <div className="dash-stat-top">
      <div className={`dash-stat-icon dash-tone-${tone}`}>{icon}</div>
      {delta !== undefined && (
        <span className={`dash-delta ${delta > 0 ? "up" : "flat"}`}>
          {delta > 0 ? "+" : ""}
          {fmt(delta)} {deltaLabel}
        </span>
      )}
    </div>
    <div className="dash-stat-bottom">
      <div>
        <div className="dash-stat-value">
          {fmt(value)}
          {suffix}
        </div>
        <div className="dash-stat-title">{title}</div>
        {hint && <div className="dash-stat-hint">{hint}</div>}
      </div>
      <Sparkline data={spark} color={sparkColor} />
    </div>
  </Card>
);

const Panel = ({ title, extra, children, className = "" }) => (
  <Card bordered={false} className={`dash-panel ${className}`} title={title} extra={extra}>
    {children}
  </Card>
);

const TrendPanel = ({ title, series = [], color, label, id }) => {
  const [range, setRange] = useState(30);
  const data = useMemo(() => series.slice(-range), [series, range]);
  const total = data.reduce((s, d) => s + d.total, 0);
  const peak = data.reduce((p, d) => (d.total > p.total ? d : p), { total: 0, date: "" });
  const avg = data.length ? (total / data.length).toFixed(1) : 0;

  return (
    <Panel
      title={title}
      extra={
        <Segmented
          size="small"
          value={range}
          onChange={setRange}
          options={[
            { label: "7d", value: 7 },
            { label: "14d", value: 14 },
            { label: "30d", value: 30 },
          ]}
        />
      }
    >
      <div className="dash-trend-summary">
        <div><b>{fmt(total)}</b><span>Total in period</span></div>
        <div><b>{avg}</b><span>Daily average</span></div>
        <div><b>{peak.total ? fmt(peak.total) : "—"}</b><span>{peak.total ? `Peak · ${peak.date.slice(5)}` : "Peak day"}</span></div>
      </div>
      {total === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${label.toLowerCase()} in this period`} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 12, fill: "#8c93a3" }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8c93a3" }} axisLine={false} tickLine={false} />
            <RTooltip formatter={(v) => [v, label]} labelFormatter={fmtDate} contentStyle={{ borderRadius: 10, border: "1px solid #eef0f4" }} />
            <Area type="monotone" dataKey="total" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
};

const ComparisonPanel = ({ data = {} }) => {
  const items = ["completed", "running", "pending", "failed"]
    .filter((k) => k in data)
    .map((k) => ({ name: k, value: data[k] || 0, color: STATUS_COLORS[k] }));
  const total = data.total || 0;
  const done = pct(data.completed || 0, total);

  return (
    <Panel title="Comparison status">
      {!total ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No comparisons yet" />
      ) : (
        <>
          <div className="dash-donut">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={items} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="none">
                  {items.map((i) => <Cell key={i.name} fill={i.color} />)}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-donut-center">
              <b>{done}%</b>
              <span>completed</span>
            </div>
          </div>
          <ul className="dash-legend">
            {items.map((i) => (
              <li key={i.name}>
                <span className="dash-dot" style={{ background: i.color }} />
                <span className="dash-legend-name">{i.name}</span>
                <b>{fmt(i.value)}</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
};

const AttentionPanel = ({ items }) => {
  const icons = {
    error: <ExclamationCircleOutlined />,
    warning: <WarningOutlined />,
    info: <InfoCircleOutlined />,
  };
  const active = items.filter((i) => i.count > 0);
  return (
    <Panel
      title="Needs attention"
      extra={active.length ? <Tag color="warning">{active.length}</Tag> : <Tag color="#4f46e5">All clear</Tag>}
    >
      {active.length === 0 ? (
        <div className="dash-clear" >
          <CheckCircleOutlined />
          <Text style={{"color":"white"}} >Nothing needs your attention right now.</Text>
        </div>
      ) : (
        <ul className="dash-attention">
          {active.map((i) => (
            <li key={i.key} className={`lvl-${i.level}`}>
              <span className="dash-att-icon">{icons[i.level]}</span>
              <span className="dash-att-text">{i.text}</span>
              <b>{fmt(i.count)}</b>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const ActiveSplit = ({ title, total, active, inactive }) => (
  <div className="dash-split">
    <div className="dash-split-head">
      <Text strong>{title}</Text>
      <Text type="secondary">{fmt(total)} total</Text>
    </div>
    <Progress percent={pct(active, total)} showInfo={false} strokeColor="#16a34a" trailColor="#e9ecf2" />
    <div className="dash-split-foot">
      <Tag color="success">{fmt(active)} active</Tag>
      <Tag>{fmt(inactive)} inactive</Tag>
    </div>
  </div>
);

const MiniMetric = ({ label, value, icon }) => (
  <div className="dash-mini">
    <span className="dash-mini-icon">{icon}</span>
    <div>
      <div className="dash-mini-value">{fmt(value)}</div>
      <div className="dash-mini-label">{label}</div>
    </div>
  </div>
);

const SearchableTable = ({ title, rows = [], columns, searchKeys, placeholder, emptyText }) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)));
  }, [rows, q, searchKeys]);

  return (
    <Panel
      title={title}
      extra={
        <Input
          allowClear
          size="middle"
          className="dash-search"
          prefix={<SearchOutlined />}
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      }
    >
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={filtered}
        pagination={filtered.length > 5 ? { pageSize: 5, size: "small", showSizeChanger: false } : false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={q ? "No matches found" : emptyText} /> }}
      />
    </Panel>
  );
};

/* ================= role views ================= */
const AdminView = ({ d }) => {
  const { overview = {}, users = {}, providers = {}, models = {}, comparisons = {}, evaluations = {}, analytics = {}, recent_activity = {} } = d;
  const regs = (analytics.user_registrations || []).map((x) => x.total);

  const attention = [
    { key: "unv", level: "warning", count: users.unverified, text: "Users have not verified their email" },
    { key: "ina", level: "info", count: users.inactive, text: "Inactive user accounts" },
    { key: "fail", level: "error", count: comparisons.failed, text: "Comparisons failed" },
  ];

  const columns = [
    {
      title: "User",
      dataIndex: "email",
      key: "email",
      render: (t) => (
        <Space>
          <Avatar size={30} className="dash-avatar">{(t || "?")[0].toUpperCase()}</Avatar>
          <Text strong>{t}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (a) => (
        <Tag icon={a ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={a ? "success" : "error"}>
          {a ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (
        <Space direction="vertical" size={0}>
          <Text>{fmtDate(v)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{ago(v)}</Text>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<TeamOutlined />} title="Total users" value={overview.total_users} delta={users.new_last_7_days} deltaLabel="this week" spark={regs} sparkColor="#4f46e5" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<ApartmentOutlined />} tone="#4f46e5" title="Workspaces" value={overview.total_workspaces} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<ProjectOutlined />} tone="#4f46e5" title="Projects" value={overview.total_projects} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<SwapOutlined />} tone="#4f46e5" title="Comparisons" value={overview.total_comparisons} hint={`${fmt(comparisons.running)} running now`} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<ApiOutlined />} tone="#4f46e5" title="LLM providers" value={overview.total_providers} hint={`${fmt(providers.active)} active`} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<RobotOutlined />} tone="#4f46e5" title="LLM models" value={overview.total_models} hint={`${fmt(models.active)} active`} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<TrophyOutlined />} tone="#4f46e5" title="Evaluations" value={overview.total_evaluations} hint={`${fmt(evaluations.with_winner)} with a winner`} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<SafetyCertificateOutlined />} tone="#4f46e5" title="Email verified" value={users.verification_rate} suffix="%" hint={`${fmt(users.verified)} of ${fmt(users.total)} users`} /></Col>
      </Row>

      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} lg={16}>
          <TrendPanel title="New user registrations" series={analytics.user_registrations} color="#4f46e5" label="New users" id="gradReg" />
        </Col>
        <Col xs={24} lg={8}>
          <AttentionPanel items={attention} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} lg={8}>
          <Panel title="User health">
            <div className="dash-ring">
              <Progress type="dashboard" percent={users.verification_rate || 0} strokeColor="#4f46e5" size={140} />
              <Text type="secondary">Email verification rate</Text>
            </div>
            <ActiveSplit title="Account status" total={users.total} active={users.active} inactive={users.inactive} />
          </Panel>
        </Col>
        <Col xs={24} lg={8}>
          <ComparisonPanel data={comparisons} />
        </Col>
        <Col xs={24} lg={8}>
          <Panel title="LLM catalogue">
            <ActiveSplit title="Providers" total={providers.total} active={providers.active} inactive={providers.inactive} />
            <ActiveSplit title="Models" total={models.total} active={models.active} inactive={models.inactive} />
            <div className="dash-divider" />
            <div className="dash-split-head">
              <Text strong>Evaluations with a winner</Text>
              <Text type="secondary">{pct(evaluations.with_winner, evaluations.total)}%</Text>
            </div>
            <Progress percent={pct(evaluations.with_winner, evaluations.total)} showInfo={false} strokeColor="#4f46e5" trailColor="#e9ecf2" />
          </Panel>
        </Col>
      </Row>

      <div className="dash-row">
        <SearchableTable
          title="Newest users"
          rows={recent_activity.users}
          columns={columns}
          searchKeys={["email"]}
          placeholder="Search by email"
          emptyText="No users yet"
        />
      </div>
    </>
  );
};

const WorkspaceView = ({ d, role }) => {
  const { overview = {}, projects = {}, comparisons = {}, evaluations = {}, analytics = {}, recent_activity = {}, providers, models } = d;
  const isOwner = role === "owner";
  const spark = (analytics.daily_projects || []).map((x) => x.total);

  const attention = [
    { key: "fail", level: "error", count: comparisons.failed, text: "Comparisons failed" },
    { key: "run", level: "info", count: comparisons.running, text: "Comparisons running now" },
    { key: "pend", level: "warning", count: comparisons.pending, text: "Comparisons waiting to start" },
  ];

  const columns = [
    {
      title: "Project",
      dataIndex: "name",
      key: "name",
      render: (t) => (
        <Space>
          <Avatar shape="square" size={30} className="dash-avatar #4f46e5">{(t || "?")[0].toUpperCase()}</Avatar>
          <Text strong>{t}</Text>
        </Space>
      ),
    },
    { title: "Workspace", dataIndex: "workspace_id", key: "workspace_id", render: (v) => <Tag>#{v}</Tag> },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (
        <Space direction="vertical" size={0}>
          <Text>{fmtDate(v)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{ago(v)}</Text>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard icon={<ApartmentOutlined />} tone="purple" title={isOwner ? "My workspaces" : "Joined workspaces"} value={overview.total_workspaces} hint={!isOwner ? `${fmt(overview.total_memberships)} active memberships` : undefined} />
        </Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<ProjectOutlined />} tone="purple" title="Projects" value={overview.total_projects} delta={projects.created_last_7_days} deltaLabel="this week" spark={spark} sparkColor="purple" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<SwapOutlined />} tone="purple" title="Comparisons" value={overview.total_comparisons} hint={`${fmt(overview.completed_comparisons)} completed`} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard icon={<TrophyOutlined />} tone="purple" title="Evaluations" value={overview.total_evaluations} hint={`${fmt(evaluations.with_winner)} with a winner`} /></Col>
      </Row>

      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} lg={16}>
          <TrendPanel title="Projects created" series={analytics.daily_projects} color="#4f46e5" label="Projects" id={`gradProj-${role}`} />
        </Col>
        <Col xs={24} lg={8}>
          <ComparisonPanel data={comparisons} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} lg={16}>
          <SearchableTable
            title="Recent projects"
            rows={recent_activity.projects}
            columns={columns}
            searchKeys={["name"]}
            placeholder="Search projects"
            emptyText="No projects yet"
          />
        </Col>
        <Col xs={24} lg={8}>
          <AttentionPanel items={attention} />
          {isOwner && (
            <Panel title="Integrations" className="dash-gap-top">
              <div className="dash-mini-grid two">
                <MiniMetric label="Providers" value={providers?.total} icon={<ApiOutlined />} />
                <MiniMetric label="Models" value={models?.total} icon={<RobotOutlined />} />
              </div>
            </Panel>
          )}
        </Col>
      </Row>
    </>
  );
};

const DashboardSkeleton = () => (
  <>
    <Row gutter={[16, 16]}>
      {[0, 1, 2, 3].map((i) => (
        <Col key={i} xs={24} sm={12} xl={6}>
          <Card bordered={false} className="dash-stat-card"><Skeleton active paragraph={{ rows: 2 }} /></Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} className="dash-row">
      <Col xs={24} lg={16}><Card bordered={false} className="dash-panel"><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
      <Col xs={24} lg={8}><Card bordered={false} className="dash-panel"><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
    </Row>
  </>
);

/* ================= page ================= */
export default function Dashboard() {
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const user = useSelector((s) => s.auth?.user_detail);

  const role = resolveRole(user); // "admin" | "owner" | "member" | "none" | null

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [auto, setAuto] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      const thunk = THUNKS[role];
      if (!thunk) {
        setLoading(false);
        return;
      }
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const res = await dispatch(thunk()).unwrap(); // exactly ONE endpoint for this role
        setData(res);
        setError(null);
      } catch (e) {
        const msg = typeof e === "object" ? e?.message || e?.detail || JSON.stringify(e) : String(e);
        setError(msg);
        api.error({ title: "Could not load dashboard", description: msg });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch, role, api],
  );

  // reload when the role changes
  useEffect(() => {
    setData(null);
    setError(null);
    if (role) {
      setLoading(true);
      load(false);
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // optional auto refresh
  useEffect(() => {
    if (!auto || !THUNKS[role]) return undefined;
    const t = setInterval(() => load(true), 60000);
    return () => clearInterval(t);
  }, [auto, role, load]);

  const meta = ROLE_META[role];
  const name = user?.first_name || user?.username || user?.email?.split("@")[0] || "there";

  let body;
  if (!role || (loading && !data)) {
    body = <DashboardSkeleton />;
  } else if (role === "none") {
    body = (
      <Card bordered={false} className="dash-panel">
        <Empty
          description={
            <Space direction="vertical" size={0}>
              <Text strong>You are not part of a workspace yet</Text>
              <Text type="secondary">Create a workspace or ask an owner to invite you to see your dashboard.</Text>
            </Space>
          }
        />
      </Card>
    );
  } else if (error && !data) {
    body = (
      <Card bordered={false} className="dash-panel">
        <Result
          status="error"
          title="Dashboard failed to load"
          subTitle={error}
          extra={<Button type="primary" onClick={() => load(false)}>Try again</Button>}
        />
      </Card>
    );
  } else if (data) {
    body = role === "admin" ? <AdminView d={data} /> : <WorkspaceView d={data} role={role} />;
  }

  return (
    <>
      {contextHolder}
      <div className="admin-page-wrapper dash-page">
        <div className="dash-hero">
          <div className="dash-hero-text">
            {meta && <span className="dash-role-badge">{meta.label}</span>}
            <h1>{greeting()}, {name}</h1>
            <p>{meta?.sub || "Your workspace overview."}</p>
          </div>
          {THUNKS[role] && (
            <div className="dash-hero-actions">
              <label className="dash-auto">
                <Switch size="small" checked={auto} onChange={setAuto} />
                <span>Auto-refresh</span>
              </label>
              <Button icon={<ReloadOutlined />} onClick={() => load(true)} loading={refreshing}>
                Refresh
              </Button>
              {data?.generated_at && <span className="dash-updated">Updated {ago(data.generated_at)}</span>}
            </div>
          )}
        </div>

        <div className={`dash-body ${refreshing ? "dash-refreshing" : ""}`}>{body}</div>
      </div>
    </>
  );
}
