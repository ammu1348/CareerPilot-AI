import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiInfo,
  FiLayers,
  FiSun,
  FiLoader,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiTarget,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import { calculateSkillGap, JOB_ROLES } from "./data/jobRoles";
import "./App.css";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const SCORE_PARTS = [
  ["technical_skills", "Relevant skills", 35],
  ["resume_sections", "Resume sections", 25],
  ["length", "Readable length", 20],
  ["contact_details", "Contact details", 10],
  ["measurable_impact", "Measurable impact", 10],
];

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getScrollBehavior() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
}

function getScoreLabel(score) {
  if (score >= 80) return "Strong signals";
  if (score >= 60) return "Good foundation";
  if (score >= 40) return "Room to build";
  return "Early signals";
}

function normalizeAnalysis(data) {
  if (!data || data.status !== "success" || !Array.isArray(data.skills)) {
    throw new Error("The analyzer returned an incomplete response. Please try again.");
  }

  const skills = [...new Set(data.skills.filter((skill) => typeof skill === "string" && skill.trim()))];
  const recommendedJobs = Array.isArray(data.recommended_jobs)
    ? data.recommended_jobs.filter((role) => typeof role === "string" && Object.hasOwn(JOB_ROLES, role))
    : [];
  const numericScore = Number(data.score);
  const score = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0;

  return {
    filename: typeof data.filename === "string" ? data.filename : "Resume.pdf",
    score,
    score_breakdown: data.score_breakdown && typeof data.score_breakdown === "object" ? data.score_breakdown : {},
    word_count: Number.isFinite(Number(data.word_count)) ? Number(data.word_count) : 0,
    sections: Array.isArray(data.sections) ? data.sections.filter((section) => typeof section === "string") : [],
    has_contact_details: Boolean(data.has_contact_details),
    has_quantified_impact: Boolean(data.has_quantified_impact),
    skills,
    feedback: typeof data.feedback === "string" ? data.feedback : "Your resume was analyzed successfully.",
    recommended_jobs: recommendedJobs,
    ai_analysis: typeof data.ai_analysis === "string" ? data.ai_analysis : "AI career insights are not available for this analysis.",
    ai_enabled: Boolean(data.ai_enabled),
  };
}

function ScoreRing({ score }) {
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="score-ring" role="img" aria-label={`Resume readiness signal: ${score} out of 100`}>
      <svg viewBox="0 0 112 112" aria-hidden="true">
        <circle className="score-ring-track" cx="56" cy="56" r={radius} />
        <circle
          className="score-ring-progress"
          cx="56"
          cy="56"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-value">
        <strong>{score}</strong>
        <span>out of 100</span>
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [includeAi, setIncludeAi] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Data Analyst");
  const [dragActive, setDragActive] = useState(false);
  const [reportStatus, setReportStatus] = useState("");

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const skillGapRef = useRef(null);

  const roleList = Object.keys(JOB_ROLES);
  const currentGap = useMemo(
    () => calculateSkillGap(result?.skills || [], selectedRole),
    [result?.skills, selectedRole],
  );
  const score = result?.score ?? 0;
  const scoreBreakdown = result?.score_breakdown || {};
  const hasSuggestedRoleOverlap = Boolean(result?.recommended_jobs?.some(
    (role) => calculateSkillGap(result.skills, role).matchedSkills.length > 0,
  ));

  useEffect(() => {
    if (!result) return;
    resultsRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
    resultsHeadingRef.current?.focus({ preventScroll: true });
  }, [result]);

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setSelectedRole("Data Analyst");
    setError("");
    setReportStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAndSetFile = async (candidate) => {
    if (!candidate || loading) return;
    setResult(null);
    setSelectedRole("Data Analyst");
    setError("");
    setReportStatus("");

    if (!candidate.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please choose a PDF file. Other file formats are not supported yet.");
      return;
    }
    if (!candidate.size) {
      setFile(null);
      setError("This file is empty. Please choose a valid PDF resume.");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError("This PDF is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    try {
      const header = new TextDecoder().decode(await candidate.slice(0, 1024).arrayBuffer());
      if (!header.includes("%PDF-")) {
        setFile(null);
        setError("This file does not look like a PDF. Please select a valid PDF resume.");
        return;
      }
    } catch {
      setFile(null);
      setError("We couldn't read this file. Please choose another PDF and try again.");
      return;
    }

    setFile(candidate);
  };

  const handleFileInput = (event) => {
    const selected = event.currentTarget.files?.[0];
    // Clear the native value so choosing the same file a second time still fires change.
    event.currentTarget.value = "";
    void validateAndSetFile(selected);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) void validateAndSetFile(droppedFile);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setReportStatus("");
    setIncludeAi(false);
    setSelectedRole("Data Analyst");
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: getScrollBehavior() });
    fileInputRef.current?.focus({ preventScroll: true });
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setResult(null);
    setSelectedRole("Data Analyst");
    setError("");
    setReportStatus("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("include_ai", String(includeAi));
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail || data?.message;
        throw new Error(typeof detail === "string" ? detail : `The analyzer returned an error (${response.status}).`);
      }
      if (data?.status === "error") {
        throw new Error(data.message || "We couldn't analyze this resume. Please check the PDF and try again.");
      }

      const analysis = normalizeAnalysis(data);
      setResult(analysis);
      const suggestedRole = data.skill_gap?.target_role;
      setSelectedRole(
        Object.hasOwn(JOB_ROLES, suggestedRole)
          ? suggestedRole
          : (analysis.recommended_jobs[0] || "Data Analyst"),
      );
    } catch (requestError) {
      if (requestError?.name === "AbortError") {
        setError("The analysis took too long. Try a smaller PDF or disable optional AI insights and try again.");
      } else if (requestError instanceof TypeError) {
        setError("We couldn't reach the analyzer. Check that the backend is running and the API URL is configured correctly.");
      } else {
        setError(requestError?.message || "Something went wrong while analyzing this resume. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSelectRole = (role, scrollToGap = false) => {
    if (!Object.hasOwn(JOB_ROLES, role)) return;
    setSelectedRole(role);
    setReportStatus("");
    if (scrollToGap) {
      skillGapRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
    }
  };

  const handleDownloadReport = async () => {
    if (!result) return;
    setReportStatus("Preparing your PDF report...");
    try {
      const { downloadAnalysisReport } = await import("./utils/report.js");
      downloadAnalysisReport(result, currentGap);
      setReportStatus("Your PDF report is ready to download.");
    } catch {
      setReportStatus("We couldn't create the PDF report. Please try again.");
    }
  };

  return (
    <div className="app-shell" id="top">
      <header className="site-header">
        <div className="site-header-inner page-width">
          <a className="brand" href="#top" aria-label="CareerPilot AI home">
            <span className="brand-mark" aria-hidden="true"><FiActivity /></span>
            <span className="brand-name">careerpilot<span>AI</span></span>
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#privacy">Privacy</a>
            <a className="header-cta" href="#analyzer">Analyze a resume <FiArrowRight aria-hidden="true" /></a>
          </nav>
        </div>
      </header>

      <main className="page-width main-content">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> CAREER CLARITY, STARTING HERE</div>
            <h1 id="hero-title">Make your next career move with <span>more clarity.</span></h1>
            <p className="hero-description">
              Understand the strengths in your resume, compare your skills with roles you care about, and leave with a practical next step.
            </p>
            <div className="hero-proof-row">
              <span><FiCheckCircle aria-hidden="true" /> Clear skill gaps</span>
              <span><FiShield aria-hidden="true" /> AI is optional</span>
            </div>
          </div>
          <aside className="hero-roadmap" aria-label="How CareerPilot works">
            <div className="roadmap-label"><FiStar aria-hidden="true" /> A simpler way to get started</div>
            <div className="roadmap-step">
              <span className="roadmap-number">01</span>
              <div><strong>Upload your resume</strong><span>Start with a text-based PDF</span></div>
              <FiFileText className="roadmap-icon" aria-hidden="true" />
            </div>
            <div className="roadmap-connector" />
            <div className="roadmap-step">
              <span className="roadmap-number">02</span>
              <div><strong>See your skill signals</strong><span>Review what the parser found</span></div>
              <FiLayers className="roadmap-icon" aria-hidden="true" />
            </div>
            <div className="roadmap-connector" />
            <div className="roadmap-step">
              <span className="roadmap-number">03</span>
              <div><strong>Build a focused plan</strong><span>Choose a role and close the gaps</span></div>
              <FiTarget className="roadmap-icon" aria-hidden="true" />
            </div>
          </aside>
        </section>

        <section className="analyzer-layout" id="analyzer" aria-label="Resume analyzer">
          <div className="upload-card panel-card">
            <div className="section-kicker"><span>01</span> RESUME ANALYSIS</div>
            <div className="upload-title-row">
              <div>
                <h2>Start with your resume</h2>
                <p>Upload a PDF and get a clear, role-focused overview.</p>
              </div>
              <div className="upload-title-icon" aria-hidden="true"><FiUploadCloud /></div>
            </div>

            <form onSubmit={handleUpload}>
              <label
                className={`dropzone${dragActive ? " is-drag-active" : ""}${file ? " has-file" : ""}`}
                htmlFor="resume-file"
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false);
                }}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  className="dropzone-input"
                  id="resume-file"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  aria-describedby="file-hint"
                  disabled={loading}
                />
                <span className="dropzone-content">
                  <span className="dropzone-icon"><FiUploadCloud aria-hidden="true" /></span>
                  <span className="dropzone-title">Drag your PDF here</span>
                  <span className="dropzone-subtitle">or <span className="browse-link">browse files</span></span>
                  <span className="file-hint" id="file-hint">PDF only · up to 10 MB · text-based PDFs work best</span>
                </span>
              </label>

              {file && (
                <div className="selected-file" aria-live="polite">
                  <span className="selected-file-icon"><FiFileText aria-hidden="true" /></span>
                  <span className="selected-file-copy">
                    <strong title={file.name}>{file.name}</strong>
                    <span>{formatFileSize(file.size)} · Ready to analyze</span>
                  </span>
                  <button className="icon-button remove-file" type="button" onClick={clearFile} aria-label="Remove selected file" disabled={loading}>
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              )}

              <label className="ai-consent">
                <input
                  type="checkbox"
                  checked={includeAi}
                  onChange={(event) => setIncludeAi(event.target.checked)}
                  disabled={loading}
                />
                <span className="custom-checkbox"><FiCheck aria-hidden="true" /></span>
                <span className="ai-consent-copy">
                  <strong>Include optional Gemini career insights</strong>
                  <span>Your resume text will be sent to the configured Gemini service. Off by default.</span>
                </span>
                <FiInfo className="consent-info" aria-hidden="true" />
              </label>

              {error && (
                <div className="alert-message" role="alert">
                  <FiAlertCircle aria-hidden="true" />
                  <span>{error}</span>
                  <button type="button" className="alert-dismiss" onClick={() => setError("")} aria-label="Dismiss error"><FiX /></button>
                </div>
              )}

              <button className="primary-button analyze-button" type="submit" disabled={!file || loading}>
                {loading ? <><FiLoader className="spin" aria-hidden="true" /> Analyzing resume...</> : <><FiActivity aria-hidden="true" /> Analyze my resume <FiArrowRight aria-hidden="true" /></>}
              </button>
              <p className="form-footnote"><FiLock aria-hidden="true" /> Your PDF is processed for this analysis and is not kept by CareerPilot.</p>
            </form>
          </div>

          <aside className="privacy-card panel-card" id="privacy">
            <div className="privacy-icon"><FiShield aria-hidden="true" /></div>
            <div className="section-kicker">YOUR DATA, YOUR CHOICE</div>
            <h2>Private by default.<br /><span>Useful by design.</span></h2>
            <p>Core skill extraction and role matching run without generative AI. Your uploaded file is processed temporarily and not saved as a resume record.</p>
            <div className="privacy-divider" />
            <div className="privacy-detail">
              <span className="privacy-check"><FiCheck aria-hidden="true" /></span>
              <div><strong>AI is opt-in</strong><span>Only enable Gemini insights if you are comfortable sending resume text to that service.</span></div>
            </div>
            <div className="privacy-detail">
              <span className="privacy-check"><FiCheck aria-hidden="true" /></span>
              <div><strong>No hiring promises</strong><span>Scores are directional content signals, not ATS results or hiring predictions.</span></div>
            </div>
          </aside>
        </section>

        {loading && (
          <section className="loading-panel panel-card" role="status" aria-live="polite">
            <span className="loading-spinner"><FiLoader aria-hidden="true" /></span>
            <div>
              <h2>Reviewing your resume</h2>
              <p>Extracting readable text, identifying skills, and preparing your role comparison. This usually takes a few seconds.</p>
            </div>
            <span className="loading-pulse" aria-hidden="true" />
          </section>
        )}

        {!loading && (
          <section className="benefits-section" id="how-it-works" aria-labelledby="benefits-title">
            <div className="benefits-heading">
              <div className="section-kicker">A PRACTICAL FIRST STEP</div>
              <h2 id="benefits-title">A resume review you can act on.</h2>
              <p>Get grounded feedback without pretending a single number can tell your whole career story.</p>
            </div>
            <div className="benefit-grid">
              <article className="benefit-card">
                <span className="benefit-icon lavender"><FiLayers aria-hidden="true" /></span>
                <h3>See the skills we found</h3>
                <p>Review extracted skills and catch gaps in the parser's read before you use the results.</p>
              </article>
              <article className="benefit-card">
                <span className="benefit-icon mint"><FiTarget aria-hidden="true" /></span>
                <h3>Compare against a role</h3>
                <p>Match your current skills to a clear list of competencies for ten supported career tracks.</p>
              </article>
              <article className="benefit-card">
                <span className="benefit-icon peach"><FiSun aria-hidden="true" /></span>
                <h3>Know what to work on</h3>
                <p>Turn missing skills into specific learning prompts and export a report to keep handy.</p>
              </article>
            </div>
          </section>
        )}

        {result && (
          <section className="results-section" ref={resultsRef} aria-labelledby="results-title">
            <div className="results-header">
              <div>
                <div className="section-kicker"><span className="ready-dot" /> ANALYSIS COMPLETE</div>
                <h2 id="results-title" ref={resultsHeadingRef} tabIndex={-1}>Your resume, at a glance</h2>
                <p className="results-filename"><FiFileText aria-hidden="true" /> {result.filename} <span /> {result.word_count.toLocaleString()} words scanned</p>
              </div>
              <div className="results-actions">
                <button type="button" className="secondary-button" onClick={handleDownloadReport}><FiDownload aria-hidden="true" /> Download report</button>
                <button type="button" className="text-button" onClick={handleReset}><FiRefreshCw aria-hidden="true" /> New analysis</button>
              </div>
            </div>

            <div className="overview-grid">
              <article className="score-card panel-card">
                <div className="score-ring-wrap"><ScoreRing score={score} /></div>
                <div className="score-detail">
                  <div className="score-label"><FiAward aria-hidden="true" /> RESUME SIGNAL</div>
                  <h3>{getScoreLabel(score)}</h3>
                  <p>{result.feedback}</p>
                  <div className="score-disclaimer"><FiInfo aria-hidden="true" /> A directional signal, not an ATS score or hiring prediction.</div>
                </div>
              </article>

              <article className="stat-card panel-card">
                <span className="stat-icon stat-blue"><FiLayers aria-hidden="true" /></span>
                <div className="stat-value">{result.skills.length}</div>
                <div className="stat-title">Skills detected</div>
                <p>Unique skills identified in the readable text</p>
              </article>
              <article className="stat-card panel-card">
                <span className="stat-icon stat-green"><FiCheckCircle aria-hidden="true" /></span>
                <div className="stat-value">{result.sections.length}<span className="stat-denominator"> / 5</span></div>
                <div className="stat-title">Core sections found</div>
                <p>{result.sections.length ? `Found: ${result.sections.join(", ")}` : "No common section headings detected"}</p>
              </article>
            </div>

            {SCORE_PARTS.some(([key]) => key in scoreBreakdown) && (
              <details className="score-breakdown panel-card">
                <summary><span><FiActivity aria-hidden="true" /> How this score is composed</span><FiChevronDown className="details-chevron" aria-hidden="true" /></summary>
                <div className="score-parts-grid">
                  {SCORE_PARTS.map(([key, label, max]) => (
                    <div className="score-part" key={key}>
                      <div className="score-part-label"><span>{label}</span><strong>{scoreBreakdown[key] ?? 0}<small> / {max}</small></strong></div>
                      <div className="mini-track"><span style={{ width: `${Math.max(0, Math.min(100, ((Number(scoreBreakdown[key]) || 0) / max) * 100))}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className="score-method-note">Each detected skill is worth 3.5 points (up to 10); five common sections are worth 5 points each. A 250-1,000 word resume receives full length credit, while contact details and measurable outcomes are detected as simple signals. Keyword detection can miss context.</p>
              </details>
            )}

            <section className="result-card panel-card" aria-labelledby="skills-title">
              <div className="section-heading-row">
                <div className="section-icon blue-icon"><FiLayers aria-hidden="true" /></div>
                <div><div className="section-kicker">WHAT WE PICKED UP</div><h2 id="skills-title">Skills detected</h2></div>
                <span className="count-pill">{result.skills.length} {result.skills.length === 1 ? "skill" : "skills"}</span>
              </div>
              {result.skills.length ? (
                <div className="skill-chip-list">
                  {result.skills.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}
                </div>
              ) : (
                <div className="empty-notice"><FiInfo aria-hidden="true" /><p>No supported technical skills were detected. Check that the PDF contains selectable text, then choose a target role below to explore its requirements.</p></div>
              )}
            </section>

            <section className="result-card panel-card skill-gap-card" ref={skillGapRef} aria-labelledby="gap-title">
              <div className="section-heading-row gap-heading-row">
                <div className="section-icon purple-icon"><FiTarget aria-hidden="true" /></div>
                <div className="gap-title-copy"><div className="section-kicker">YOUR NEXT STEP</div><h2 id="gap-title">Compare your skills to a role</h2></div>
                <label className="role-select-wrap" htmlFor="target-role">
                  <span>Target role</span>
                  <select id="target-role" value={selectedRole} onChange={(event) => handleSelectRole(event.target.value)}>
                    {roleList.map((role) => <option value={role} key={role}>{role}</option>)}
                  </select>
                  <FiChevronDown className="select-chevron" aria-hidden="true" />
                </label>
              </div>

              <div className="target-role-summary">
                <div><h3>{currentGap.targetRole}</h3><p>{JOB_ROLES[currentGap.targetRole]?.description}</p></div>
                <div className="match-badge"><strong>{currentGap.matchPercentage}%</strong><span>skills matched</span></div>
              </div>
              <div
                className="match-progress"
                role="progressbar"
                aria-label={`${currentGap.matchPercentage}% of required ${currentGap.targetRole} skills matched`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={currentGap.matchPercentage}
              >
                <span style={{ width: `${currentGap.matchPercentage}%` }} />
              </div>
              <div className="match-caption"><span>{currentGap.matchedSkills.length} of {currentGap.requiredSkills.length} required skills present</span><span>Updated instantly when you change roles</span></div>

              <div className="gap-columns">
                <div className="gap-column matched-column">
                  <div className="gap-column-title"><FiCheckCircle aria-hidden="true" /><h3>Already on your resume</h3><span>{currentGap.matchedSkills.length}</span></div>
                  {currentGap.matchedSkills.length ? (
                    <ul className="gap-skill-list">
                      {currentGap.matchedSkills.map((skill) => <li key={skill}><FiCheck aria-hidden="true" />{skill}</li>)}
                    </ul>
                  ) : <p className="gap-empty">No direct matches yet. Review the required skills and start with one manageable learning goal.</p>}
                </div>
                <div className="gap-column missing-column">
                  <div className="gap-column-title"><FiTarget aria-hidden="true" /><h3>Skills to strengthen</h3><span>{currentGap.missingSkills.length}</span></div>
                  {currentGap.missingSkills.length ? (
                    <ul className="gap-skill-list">
                      {currentGap.missingSkills.map((skill) => <li key={skill}><span className="missing-dot" />{skill}</li>)}
                    </ul>
                  ) : <p className="gap-empty">Every listed requirement is represented in the skills we found. Keep building evidence through projects and experience.</p>}
                </div>
              </div>

              <div className="recommendations-block">
                <div className="recommendation-heading"><span className="recommendation-icon"><FiSun aria-hidden="true" /></span><div><h3>Your learning focus</h3><p>{currentGap.missingSkills.length ? `Suggestions based on the ${currentGap.missingSkills.length} skill gaps for ${currentGap.targetRole}.` : `You have a strong listed-skill match for ${currentGap.targetRole}. Keep deepening your evidence.`}</p></div></div>
                <ol className="recommendation-list">
                  {currentGap.recommendations.map((recommendation, index) => (
                    <li key={`${currentGap.targetRole}-${index}`}><span className="recommendation-number">{String(index + 1).padStart(2, "0")}</span><span>{recommendation}</span></li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="result-card roles-card panel-card" aria-labelledby="roles-title">
              <div className="section-heading-row">
                <div className="section-icon green-icon"><FiBriefcase aria-hidden="true" /></div>
                <div><div className="section-kicker">OTHER PATHS TO EXPLORE</div><h2 id="roles-title">Suggested roles</h2></div>
              </div>
              <p className="roles-intro">{hasSuggestedRoleOverlap ? "Suggestions are ordered by overlap with skills found in this PDF. Compare the percentage, then choose the role that fits your goals." : "No direct role overlap was detected, so these are starter roles rather than personalized matches. Choose one to explore its required skills."}</p>
              {result.recommended_jobs.length ? (
                <div className="role-suggestion-grid">
                  {result.recommended_jobs.map((role) => {
                    const gap = calculateSkillGap(result.skills, role);
                    const active = role === selectedRole;
                    return (
                      <button
                        type="button"
                        className={`role-suggestion${active ? " is-selected" : ""}`}
                        key={role}
                        onClick={() => handleSelectRole(role, true)}
                        aria-pressed={active}
                      >
                        <span className="role-suggestion-top"><span className="role-suggestion-icon"><FiBriefcase aria-hidden="true" /></span><span className="role-match-number">{gap.matchPercentage}%<small>match</small></span></span>
                        <strong>{role}</strong>
                        <span className="role-suggestion-description">{JOB_ROLES[role].description}</span>
                        <span className="role-suggestion-action">{active ? "Current target" : "Compare this role"}<FiArrowRight aria-hidden="true" /></span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-notice"><FiInfo aria-hidden="true" /><p>No role suggestions are available yet. You can still choose any supported target role above.</p></div>
              )}
            </section>

            <div className="insight-grid">
              <section className="insight-card panel-card" aria-labelledby="feedback-title">
                <div className="section-heading-row">
                  <div className="section-icon peach-icon"><FiAward aria-hidden="true" /></div>
                  <div><div className="section-kicker">A QUICK READ</div><h2 id="feedback-title">Resume feedback</h2></div>
                </div>
                <p>{result.feedback}</p>
                <div className="insight-note"><FiInfo aria-hidden="true" /> Score signals use skills, sections, length, contact details, and measurable outcomes.</div>
              </section>

              <section className="insight-card ai-card panel-card" aria-labelledby="ai-title">
                <div className="section-heading-row">
                  <div className="section-icon purple-icon"><FiStar aria-hidden="true" /></div>
                  <div><div className="section-kicker">{result.ai_enabled ? "OPTIONAL GEMINI ANALYSIS" : "DETERMINISTIC ANALYSIS"}</div><h2 id="ai-title">Career insights</h2></div>
                </div>
                <p className="ai-result-text">{result.ai_analysis}</p>
                {!result.ai_enabled && <div className="insight-note"><FiLock aria-hidden="true" /> Gemini was not used for this analysis. You can opt in before your next upload.</div>}
              </section>
            </div>

            <div className="results-footer-actions">
              <div className="report-status" aria-live="polite">{reportStatus}</div>
              <button type="button" className="primary-button" onClick={handleDownloadReport}><FiDownload aria-hidden="true" /> Download your PDF report</button>
              <p>Includes your score breakdown, detected skills, role match, and learning focus.</p>
            </div>
          </section>
        )}

        <footer className="site-footer">
          <a className="brand brand-small" href="#top"><span className="brand-mark" aria-hidden="true"><FiActivity /></span><span className="brand-name">careerpilot<span>AI</span></span></a>
          <p>Designed to support your next step - not make the decision for you.</p>
          <a href="#how-it-works">How the analysis works <FiArrowRight aria-hidden="true" /></a>
        </footer>
      </main>
    </div>
  );
}

export default App;
