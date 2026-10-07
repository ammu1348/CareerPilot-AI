import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiChevronDown,
  FiCpu,
  FiDatabase,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiLayers,
  FiLock,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import "./Admin.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
const ADMIN_PATH = "/admin";

async function parseResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `The admin service returned an error (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

function Brand({ light = false }) {
  return (
    <a className={`admin-brand${light ? " is-light" : ""}`} href="/" aria-label="CareerPilot home">
      <span className="admin-brand-mark"><FiActivity aria-hidden="true" /></span>
      <span>careerpilot<span>AI</span></span>
    </a>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [serviceStatus, setServiceStatus] = useState("Checking API…");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal, cache: "no-store" })
      .then((response) => setServiceStatus(response.ok ? "Online" : "Unavailable"))
      .catch(() => {
        if (!controller.signal.aborted) setServiceStatus("Unavailable");
      });
    fetch(`${API_BASE_URL}/admin/auth/me`, { signal: controller.signal, cache: "no-store", credentials: "include" })
      .then((response) => {
        if (response.ok) window.location.replace(ADMIN_PATH);
        else if (response.status === 503) setError("Admin access is not configured for this deployment yet. Ask the deployment owner to set up the admin credentials.");
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setCheckingSession(false);
      });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await parseResponse(await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ email: email.trim(), password }),
      }));
      window.location.replace(ADMIN_PATH);
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError("We couldn't reach the admin service. Check that the API is running and the /api proxy is configured.");
      } else {
        setError(requestError?.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="login-showcase" aria-label="CareerPilot administrator workspace">
        <div className="login-showcase-orb orb-one" />
        <div className="login-showcase-orb orb-two" />
        <div className="login-showcase-grid" />
        <Brand light />
        <div className="showcase-content">
          <span className="showcase-eyebrow"><span /> PRIVATE WORKSPACE</span>
          <h1>Clarity for your<br /><span>career platform.</span></h1>
          <p>A calmer way to oversee career guidance, AI availability, and the role library—without storing anyone’s resume.</p>
          <div className="showcase-metric-card">
            <div className="showcase-metric-top"><span className={`showcase-live-dot${serviceStatus === "Online" ? "" : " is-pending"}`} /> API SERVICE <FiArrowUpRight aria-hidden="true" /></div>
            <div className="showcase-metric-value">{serviceStatus}<span>.</span></div>
            <div className="showcase-metric-foot"><span><FiShield aria-hidden="true" /> Private by design</span><span>Admin only</span></div>
          </div>
          <div className="showcase-points">
            <span><FiCheckCircle aria-hidden="true" /> Admin-only access</span>
            <span><FiDatabase aria-hidden="true" /> No resume archive</span>
            <span><FiZap aria-hidden="true" /> Optional Gemini AI</span>
          </div>
        </div>
        <div className="showcase-footer">CAREERPILOT AI <span>•</span> ADMIN WORKSPACE</div>
      </section>

      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><Brand /></div>
          <div className="login-form-kicker"><FiLock aria-hidden="true" /> SECURE ADMIN SIGN-IN</div>
          <h2>Welcome back<span>.</span></h2>
          <p className="login-intro">Sign in with the administrator account configured for this deployment.</p>

          {error && <div className="admin-form-error" role="alert"><FiX aria-hidden="true" /><span>{error}</span></div>}

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Email address</label>
            <div className="admin-input-wrap">
              <FiUsers aria-hidden="true" />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
              />
            </div>

            <div className="admin-password-heading"><label htmlFor="admin-password">Password</label></div>
            <div className="admin-input-wrap password-input-wrap">
              <FiLock aria-hidden="true" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your admin password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                maxLength={256}
              />
              <button
                className="password-visibility"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>

            <div className="login-security-note"><FiShield aria-hidden="true" /><span>Protected with an expiring, HTTP-only admin session.</span></div>
            <button className="admin-submit-button" type="submit" disabled={busy || checkingSession}>
              {busy ? <><span className="button-spinner" /> Verifying access</> : <>Sign in to workspace <FiArrowRight aria-hidden="true" /></>}
            </button>
          </form>

          <div className="login-help-card">
            <span className="login-help-icon"><FiLock aria-hidden="true" /></span>
            <p><strong>First time here?</strong><br />Admin access is enabled by your deployment owner. There are no default or shared demo passwords.</p>
          </div>
          <a className="back-to-app" href="/">Back to CareerPilot <FiArrowUpRight aria-hidden="true" /></a>
          <p className="login-legal">Sessions expire automatically. Never sign in on a shared or untrusted device.</p>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status = "good", children }) {
  return <span className={`status-pill status-${status}`}><span />{children}</span>;
}

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const roleSearchRef = useRef(null);

  const loadConsole = useCallback(async (signal) => {
    try {
      const identity = await parseResponse(await fetch(`${API_BASE_URL}/admin/auth/me`, {
        signal,
        cache: "no-store",
        credentials: "include",
      }));
      setError("");
      setAdminEmail(identity.email || "Administrator");
      const data = await parseResponse(await fetch(`${API_BASE_URL}/admin/overview`, {
        signal,
        cache: "no-store",
        credentials: "include",
      }));
      setOverview(data);
    } catch (requestError) {
      if (requestError?.name === "AbortError") return;
      if (requestError?.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      setError(requestError?.message || "The admin overview could not be loaded.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const startId = window.setTimeout(() => void loadConsole(controller.signal), 0);
    return () => {
      window.clearTimeout(startId);
      controller.abort();
    };
  }, [loadConsole]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        roleSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleRoles = useMemo(() => {
    const roles = overview?.roles || [];
    const query = roleSearch.trim().toLowerCase();
    return query
      ? roles.filter((role) => `${role.name} ${role.skills.join(" ")}`.toLowerCase().includes(query))
      : roles;
  }, [overview?.roles, roleSearch]);

  const refresh = () => {
    setRefreshing(true);
    void loadConsole(undefined);
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      window.location.replace("/admin/login");
    }
  };

  if (loading) {
    return <main className="admin-loading-screen"><span className="admin-loading-mark"><FiActivity aria-hidden="true" /></span><div className="admin-loading-line" /><p>Securing your workspace…</p></main>;
  }

  if (error && !overview) {
    return (
      <main className="admin-error-screen">
        <div className="admin-error-card"><Brand /><span className="admin-error-icon"><FiShield aria-hidden="true" /></span><h1>Workspace unavailable</h1><p>{error}</p><button className="admin-submit-button" type="button" onClick={refresh}>Try again <FiRefreshCw aria-hidden="true" /></button><a href="/">Return to CareerPilot</a></div>
      </main>
    );
  }

  const system = overview?.system || {};
  const ai = overview?.ai || {};
  const roles = overview?.roles || [];
  const initials = adminEmail.split("@")[0].split(/[._-]/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "CP";
  const formattedDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="admin-app-shell">
      {sidebarOpen && <button className="admin-sidebar-backdrop" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="admin-sidebar-brand"><Brand /><button className="admin-mobile-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><FiX /></button></div>
        <div className="sidebar-workspace-label">WORKSPACE</div>
        <div className="sidebar-workspace-card"><span className="workspace-avatar"><FiActivity aria-hidden="true" /></span><span><strong>CareerPilot</strong><small>Administrator</small></span><FiChevronDown aria-hidden="true" /></div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          <span className="sidebar-nav-label">OVERVIEW</span>
          <a className="sidebar-link is-active" href="#overview" onClick={() => setSidebarOpen(false)}><FiActivity aria-hidden="true" /><span>Dashboard</span><span className="sidebar-active-dot" /></a>
          <a className="sidebar-link" href="#health" onClick={() => setSidebarOpen(false)}><FiCpu aria-hidden="true" /><span>System health</span></a>
          <a className="sidebar-link" href="#ai-services" onClick={() => setSidebarOpen(false)}><FiZap aria-hidden="true" /><span>AI services</span></a>
          <a className="sidebar-link" href="#role-library" onClick={() => setSidebarOpen(false)}><FiLayers aria-hidden="true" /><span>Role library</span><span className="sidebar-link-count">{roles.length}</span></a>
          <span className="sidebar-nav-label sidebar-nav-label-spaced">GOVERNANCE</span>
          <a className="sidebar-link" href="#privacy-controls" onClick={() => setSidebarOpen(false)}><FiShield aria-hidden="true" /><span>Privacy controls</span></a>
        </nav>
        <div className="sidebar-bottom-card"><span className="sidebar-bottom-icon"><FiLock aria-hidden="true" /></span><div><strong>Protected console</strong><span>Admin-only · session expires in {system.session_ttl_hours || 8}h</span></div></div>
        <div className="sidebar-footer"><span className="sidebar-footer-dot" /> Platform ready <span className="sidebar-footer-version">v{system.api_version || "1.0"}</span></div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-topbar">
          <div className="admin-topbar-left"><button className="admin-menu-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><FiMenu /></button><div className="admin-breadcrumb"><a href="/">CareerPilot</a><span>/</span><strong>Admin overview</strong></div></div>
          <div className="admin-topbar-actions"><StatusPill>System online</StatusPill><span className="topbar-divider" /><button className={`admin-refresh-button${refreshing ? " is-refreshing" : ""}`} type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh overview"><FiRefreshCw /></button><div className="admin-account"><span className="admin-avatar">{initials}</span><span className="admin-account-copy"><strong>{adminEmail.split("@")[0]}</strong><small>Administrator</small></span></div><button className="admin-logout-button" type="button" onClick={signOut} disabled={signingOut}>{signingOut ? <span className="button-spinner" /> : <FiLogOut aria-hidden="true" />}<span>Sign out</span></button></div>
        </header>

        <main className="admin-dashboard-content" id="overview">
          <div className="admin-page-intro"><div><span className="admin-page-kicker">{formattedDate.toUpperCase()} <span>•</span> ADMIN WORKSPACE</span><h1>Good to see you<span>.</span></h1><p>Your platform is running with privacy at its core. Here’s the current operational picture.</p></div><div className="intro-status-card"><span className="intro-pulse"><FiActivity aria-hidden="true" /></span><span><strong>Everything in view</strong><small>Live configuration snapshot</small></span><FiArrowUpRight aria-hidden="true" /></div></div>

          {error && <div className="admin-inline-error" role="status"><FiX aria-hidden="true" />{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}

          <section className="admin-stat-grid" aria-label="Platform summary">
            <article className="admin-stat-card stat-purple"><div className="admin-stat-top"><span className="admin-stat-icon"><FiLayers aria-hidden="true" /></span><span className="admin-stat-tag">CATALOG</span></div><div className="admin-stat-value">{roles.length}<span className="admin-stat-unit">tracks</span></div><p>Career pathways available to explore</p><a href="#role-library">View role library <FiArrowUpRight aria-hidden="true" /></a></article>
            <article className={`admin-stat-card ${ai.configured ? "stat-mint" : "stat-amber"}`}><div className="admin-stat-top"><span className="admin-stat-icon"><FiZap aria-hidden="true" /></span><span className="admin-stat-tag">GENAI</span></div><div className="admin-stat-value admin-stat-value-text">{ai.configured ? "Configured" : "Optional"}</div><p>{ai.configured ? "Gemini key is present for consented requests" : "Core analysis works without a model key"}</p><a href="#ai-services">AI configuration <FiArrowUpRight aria-hidden="true" /></a></article>
            <article className="admin-stat-card stat-blue"><div className="admin-stat-top"><span className="admin-stat-icon"><FiFileText aria-hidden="true" /></span><span className="admin-stat-tag">UPLOAD</span></div><div className="admin-stat-value">{system.upload_limit_mb || 10}<span className="admin-stat-unit">MB max</span></div><p>Selectable-text PDF, bounded extraction</p><a href="#health">Review safeguards <FiArrowUpRight aria-hidden="true" /></a></article>
            <article className="admin-stat-card stat-dark"><div className="admin-stat-top"><span className="admin-stat-icon"><FiDatabase aria-hidden="true" /></span><span className="admin-stat-tag">DATA POLICY</span></div><div className="admin-stat-value admin-stat-value-text">No archive</div><p>Resume text is not kept as a user record</p><a href="#privacy-controls">Privacy details <FiArrowUpRight aria-hidden="true" /></a></article>
          </section>

          <div className="admin-content-grid">
            <section className="admin-panel health-panel" id="health">
              <div className="admin-panel-heading"><div><span className="admin-section-eyebrow">LIVE OPERATIONS</span><h2>System health</h2></div><StatusPill>All checks passed</StatusPill></div>
              <div className="health-check-list">
                <div className="health-check-row"><span className="health-check-icon check-green"><FiActivity aria-hidden="true" /></span><span className="health-check-copy"><strong>CareerPilot API</strong><small>Health endpoint responding normally</small></span><StatusPill>Operational</StatusPill></div>
                <div className="health-check-row"><span className={`health-check-icon ${ai.configured ? "check-purple" : "check-amber"}`}><FiZap aria-hidden="true" /></span><span className="health-check-copy"><strong>Gemini provider</strong><small>{ai.configured ? `Configured · ${ai.model}` : "Not configured · deterministic analysis remains active"}</small></span><StatusPill status={ai.configured ? "good" : "neutral"}>{ai.configured ? "Key present" : "Optional"}</StatusPill></div>
                <div className="health-check-row"><span className="health-check-icon check-blue"><FiFileText aria-hidden="true" /></span><span className="health-check-copy"><strong>PDF extraction</strong><small>Up to {system.max_pdf_pages || 40} pages and {(system.max_extracted_characters || 100000).toLocaleString()} characters</small></span><StatusPill>Bounded</StatusPill></div>
                <div className="health-check-row"><span className="health-check-icon check-mint"><FiShield aria-hidden="true" /></span><span className="health-check-copy"><strong>Resume retention</strong><small>Temporary processing only · no resume archive</small></span><StatusPill>Protected</StatusPill></div>
              </div>
              <div className="health-panel-footer"><span><span className="health-footer-dot" /> Updated just now</span><button type="button" onClick={refresh} disabled={refreshing}><FiRefreshCw aria-hidden="true" /> Refresh status</button></div>
            </section>

            <section className="admin-panel ai-service-panel" id="ai-services">
              <div className="ai-panel-glow" />
              <div className="ai-panel-heading"><span className="ai-orb"><FiZap aria-hidden="true" /></span><span className="ai-panel-label">OPTIONAL GENERATIVE AI</span><StatusPill status={ai.configured ? "good" : "neutral"}>{ai.configured ? "Configured" : "Not configured"}</StatusPill></div>
              <h2>Useful intelligence.<br /><span>Always by consent.</span></h2>
              <p>{ai.configured ? "Gemini is available for users who choose to share their resume text or explicitly submit a career-coach question." : "Set GEMINI_API_KEY in the backend environment to enable Gemini. Deterministic scoring, role matching, and learning plans stay available."}</p>
              <div className="ai-model-row"><span>PROVIDER</span><strong><span className="provider-dot" /> {ai.provider || "Google Gemini"}</strong></div>
              <div className="ai-model-row"><span>MODEL</span><strong>{ai.model || "gemini-2.5-flash-lite"}</strong></div>
              <div className="ai-panel-callout"><FiLock aria-hidden="true" /><span>API keys stay on the server. The admin console never exposes secret values.</span></div>
              <a className="admin-outline-action" href="/#analyzer">Open CareerPilot <FiArrowRight aria-hidden="true" /></a>
            </section>
          </div>

          <section className="admin-panel role-library-panel" id="role-library">
            <div className="admin-panel-heading role-library-heading"><div><span className="admin-section-eyebrow">CAREER CATALOG</span><h2>Role library <span className="role-total-pill">{roles.length} tracks</span></h2><p>Shared skill definitions power matching in both the API and the client.</p></div><label className="role-search"><FiSearch aria-hidden="true" /><input ref={roleSearchRef} type="search" placeholder="Search roles or skills" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} aria-label="Search roles or skills" /><kbd>⌘/Ctrl K</kbd></label></div>
            <div className="role-table-wrap"><table className="role-admin-table"><thead><tr><th>CAREER TRACK</th><th>CORE SKILLS</th><th>REQUIREMENTS</th><th>STATUS</th></tr></thead><tbody>{visibleRoles.map((role, index) => <tr key={role.name} style={{ "--row-index": index }}><td><span className="role-table-icon"><FiLayers aria-hidden="true" /></span><span className="role-table-name"><strong>{role.name}</strong><small>{role.description}</small></span></td><td><div className="role-skill-tags">{role.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}{role.skills.length > 4 && <span className="role-more-skills">+{role.skills.length - 4}</span>}</div></td><td><span className="requirement-count">{role.skills.length} skills</span></td><td><StatusPill>Active</StatusPill></td></tr>)}</tbody></table>{visibleRoles.length === 0 && <div className="role-empty-state"><FiSearch aria-hidden="true" /><strong>No career tracks found</strong><span>Try searching for another role or skill.</span></div>}</div>
            <div className="role-table-footer"><span>Showing <strong>{visibleRoles.length}</strong> of <strong>{roles.length}</strong> supported role tracks</span><span><FiCheckCircle aria-hidden="true" /> Synchronized with shared career data</span></div>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-panel privacy-controls-panel" id="privacy-controls"><div className="privacy-panel-mark"><FiShield aria-hidden="true" /></div><div><span className="admin-section-eyebrow">TRUST BY DEFAULT</span><h2>Privacy controls</h2><p>Resume files are processed temporarily. The API returns summary signals, not extracted resume text. Optional Gemini analysis is off unless a user actively opts in.</p></div><span className="privacy-control-badge"><FiCheckCircle aria-hidden="true" /> Policy active</span></article>
            <article className="admin-panel admin-quick-panel"><div className="quick-panel-heading"><span className="admin-section-eyebrow">ADMIN SHORTCUTS</span><FiArrowDownRight aria-hidden="true" /></div><a href="/" className="quick-link"><span className="quick-link-icon"><FiActivity aria-hidden="true" /></span><span><strong>Open resume analyzer</strong><small>Review the public career experience</small></span><FiArrowRight aria-hidden="true" /></a><a href={`${API_BASE_URL}/docs`} className="quick-link"><span className="quick-link-icon"><FiFileText aria-hidden="true" /></span><span><strong>API documentation</strong><small>Browse the available endpoints</small></span><FiArrowRight aria-hidden="true" /></a><div className="quick-panel-note"><FiLock aria-hidden="true" /> Admin sessions expire after {system.session_ttl_hours || 8} hours.</div></article>
          </section>
          <footer className="admin-footer"><Brand /><span>Career guidance should inform decisions—not make them.</span><a href="/">Back to public app <FiArrowUpRight aria-hidden="true" /></a></footer>
        </main>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const isLogin = window.location.pathname === "/admin/login" || window.location.pathname === "/admin/login/";
  useEffect(() => {
    const originalTitle = document.title;
    document.title = isLogin ? "Admin sign-in · CareerPilot AI" : "Admin overview · CareerPilot AI";
    return () => { document.title = originalTitle; };
  }, [isLogin]);
  return isLogin ? <LoginScreen /> : <AdminDashboard />;
}
