import { useState, useRef } from "react";
import jsPDF from "jspdf";

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import {
  FaFileUpload,
  FaTools,
  FaBriefcase,
  FaCommentDots,
  FaBullseye,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
  FaChartLine,
  FaArrowRight,
  FaRobot,
} from "react-icons/fa";

import {
  JOB_ROLES,
  calculateSkillGap,
} from "./data/jobRoles";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("Data Analyst");

  const skillGapSectionRef = useRef(null);

  // Dynamic API Base URL supporting local development and environment variables
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Calculate current deterministic skill gap based on extracted skills and selected target role
  const currentGap = result?.skills
    ? calculateSkillGap(result.skills, selectedRole)
    : calculateSkillGap([], selectedRole);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file (.pdf). Other formats are not supported.");
      setFile(null);
      return;
    }

    if (selected.size === 0) {
      setError("The selected file is empty. Please choose a valid resume document.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a valid PDF file before uploading.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });
      } catch (networkErr) {
        // If local API fails and it wasn't explicitly overridden, try the deployed endpoint as fallback
        if (API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1")) {
          try {
            response = await fetch("https://careerpilot-ai-3-fky4.onrender.com/upload", {
              method: "POST",
              body: formData,
            });
          } catch {
            throw networkErr;
          }
        } else {
          throw networkErr;
        }
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || "Unable to process this resume. Please ensure it is a valid text-based PDF.");
        return;
      }

      setResult(data);

      // Pre-select the first recommended job if it matches a valid target role
      if (data.recommended_jobs && data.recommended_jobs.length > 0) {
        const topJob = data.recommended_jobs[0];
        if (JOB_ROLES[topJob]) {
          setSelectedRole(topJob);
        } else {
          setSelectedRole("Data Analyst");
        }
      } else {
        setSelectedRole("Data Analyst");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("❌ Unable to connect to the backend server. Please make sure the backend service is running.");
    } finally {
      setLoading(false);
    }
  };

  // Switch role and optionally scroll to gap analysis section
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    if (skillGapSectionRef.current) {
      skillGapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Color helper for skill match progress bar
  const getProgressColors = (percentage) => {
    if (percentage >= 75) {
      return { textColor: "#15803d", pathColor: "#16a34a", trailColor: "#d1fae5", badgeBg: "bg-green-100 text-green-800 border-green-300" };
    } else if (percentage >= 45) {
      return { textColor: "#b45309", pathColor: "#d97706", trailColor: "#fef3c7", badgeBg: "bg-amber-100 text-amber-800 border-amber-300" };
    } else {
      return { textColor: "#b91c1c", pathColor: "#dc2626", trailColor: "#fee2e2", badgeBg: "bg-red-100 text-red-800 border-red-300" };
    }
  };

  // Extended PDF Download including Resume Analysis + Skill Gap Analysis
  const downloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const checkPageBreak = (neededSpace = 20) => {
      if (y + neededSpace > 275) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text("CareerPilot AI", 20, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text("AI Resume & Job Skill Gap Analysis Report", 20, y);
    y += 12;

    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // 1. Resume Score
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(21, 128, 61); // Green 700
    doc.text(`Resume Score: ${result.score}/100`, 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const feedbackLines = doc.splitTextToSize(`Feedback: ${result.feedback}`, pageWidth - 40);
    doc.text(feedbackLines, 20, y);
    y += feedbackLines.length * 6 + 4;

    // 2. Extracted Skills
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`Extracted Skills (${result.skills.length}):`, 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const skillsText = result.skills.length > 0 ? result.skills.join(" • ") : "No technical skills detected.";
    const skillLines = doc.splitTextToSize(skillsText, pageWidth - 40);
    doc.text(skillLines, 20, y);
    y += skillLines.length * 5 + 8;

    // 3. Target Role & Skill Gap Analysis
    checkPageBreak(50);
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(67, 56, 202); // Indigo 700
    doc.text("Skill Gap Analysis", 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Target Job Role: ${currentGap.targetRole}`, 20, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(currentGap.matchPercentage >= 50 ? 21 : 185, currentGap.matchPercentage >= 50 ? 128 : 28, currentGap.matchPercentage >= 50 ? 61 : 28);
    doc.text(`Skill Match Percentage: ${currentGap.matchPercentage}% (${currentGap.matchedSkills.length} of ${currentGap.requiredSkills.length} required skills)`, 20, y);
    y += 9;

    // Matched Skills
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61); // Green 700
    doc.text("Matched Required Skills:", 20, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    if (currentGap.matchedSkills.length > 0) {
      currentGap.matchedSkills.forEach((skill) => {
        checkPageBreak(7);
        doc.text(`  [✓] ${skill}`, 24, y);
        y += 5.5;
      });
    } else {
      doc.text("  None currently matched.", 24, y);
      y += 6;
    }
    y += 3;

    // Missing Skills
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28); // Red 700
    doc.text("Missing Skills for Role:", 20, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    if (currentGap.missingSkills.length > 0) {
      currentGap.missingSkills.forEach((skill) => {
        checkPageBreak(7);
        doc.text(`  [✕] ${skill}`, 24, y);
        y += 5.5;
      });
    } else {
      doc.text("  All required skills matched! Ready to apply.", 24, y);
      y += 6;
    }
    y += 6;

    // 4. Learning Recommendations
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text("Personalized Learning & Improvement Recommendations:", 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    currentGap.recommendations.forEach((rec) => {
      checkPageBreak(12);
      const recLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 45);
      doc.text(recLines, 24, y);
      y += recLines.length * 5 + 2;
    });
    y += 6;

    // 5. Recommended Jobs
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(126, 34, 206); // Purple 700
    doc.text("Recommended Job Roles:", 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    result.recommended_jobs.forEach((job) => {
      checkPageBreak(7);
      doc.text(`• ${job}`, 25, y);
      y += 6;
    });

    doc.save(`CareerPilot_${selectedRole.replace(/\s+/g, "_")}_Gap_Report.pdf`);
  };

  const progressStyle = getProgressColors(currentGap.matchPercentage);
  const roleList = Object.keys(JOB_ROLES);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4 sm:p-10">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-4xl">

        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-600">
          🚀 CareerPilot AI
        </h1>

        <p className="text-center text-gray-500 mt-2 font-medium">
          AI Resume Analyzer & Job Skill Gap Analysis System
        </p>

        {/* Upload Form */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <input
            type="file"
            accept=".pdf"
            className="border border-slate-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700"
            onChange={handleFileChange}
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center transition cursor-pointer shadow-md"
          >
            <FaFileUpload className="mr-2" />
            {loading ? "Analyzing Resume..." : "Upload & Analyze"}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <FaTimesCircle className="text-red-500 text-lg mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <>
            {/* 1. Resume Score */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-green-900">
                  📊 Resume Score
                </h2>
                <p className="text-gray-600 mt-2 max-w-md">
                  Your resume has been parsed and evaluated across core technical competencies.
                </p>
                <div className="mt-2 text-xs font-semibold text-green-800 bg-green-200/60 px-3 py-1 rounded-full inline-block">
                  Detected {result.skills.length} Technical Skills
                </div>
              </div>

              <div className="w-28 h-28 shrink-0">
                <CircularProgressbar
                  value={result.score}
                  text={`${result.score}%`}
                  styles={buildStyles({
                    textColor: "#15803d",
                    pathColor: "#16a34a",
                    trailColor: "#d1fae5",
                    textSize: "24px",
                  })}
                />
              </div>
            </div>

            {/* 2. Extracted Skills */}
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center text-slate-800">
                <FaTools className="mr-2 text-blue-600" />
                Extracted Resume Skills
                <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {result.skills.length} detected
                </span>
              </h2>

              {result.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-full font-medium text-sm shadow-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  No technical skills were detected in the resume text. You can still select a target role below to see required skills.
                </p>
              )}
            </div>

            {/* 3. Target Job Role Selector */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold flex items-center text-blue-900">
                    <FaBullseye className="mr-2 text-blue-600" />
                    Target Job Role
                  </h2>
                  <p className="text-sm text-blue-700 mt-1">
                    Select a target job role to run instant skill gap analysis against required industry competencies:
                  </p>
                </div>

                <div className="w-full sm:w-64">
                  <select
                    value={selectedRole}
                    onChange={(e) => handleSelectRole(e.target.value)}
                    className="w-full bg-white border border-blue-300 text-blue-900 font-semibold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                  >
                    {roleList.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick-Select Role Chips */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-blue-200/60">
                {roleList.map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => handleSelectRole(role)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400"
                          : "bg-white text-slate-700 hover:bg-blue-100/70 border border-blue-200"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Skill Gap Analysis Section */}
            <div
              ref={skillGapSectionRef}
              className="mt-6 bg-indigo-50/70 border-2 border-indigo-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-indigo-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    <FaChartLine /> Skill Gap Analysis
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    Target Role: <span className="text-indigo-600">{currentGap.targetRole}</span>
                  </h2>

                  <p className="text-sm text-slate-600 mt-1">
                    {JOB_ROLES[selectedRole]?.description || "Job role competency evaluation."}
                  </p>
                </div>

                {/* Skill Match Visual Progress Indicator */}
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs shrink-0">
                  <div className="w-18 h-18">
                    <CircularProgressbar
                      value={currentGap.matchPercentage}
                      text={`${currentGap.matchPercentage}%`}
                      styles={buildStyles({
                        textColor: progressStyle.textColor,
                        pathColor: progressStyle.pathColor,
                        trailColor: progressStyle.trailColor,
                        textSize: "26px",
                      })}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase">
                      Skill Match
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {currentGap.matchPercentage}%
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      {currentGap.matchedSkills.length} / {currentGap.requiredSkills.length} Skills Matched
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Horizontal Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${currentGap.matchPercentage}%`,
                      backgroundColor: progressStyle.pathColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                  <span>Mathematical Score: ({currentGap.matchedSkills.length} matched / {currentGap.requiredSkills.length} required) × 100</span>
                  <span>{currentGap.matchPercentage}% Match</span>
                </div>
              </div>

              {/* Matched vs Missing Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Matched Skills */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-900 flex items-center text-base">
                    <FaCheckCircle className="text-emerald-600 mr-2" />
                    Matched Skills ({currentGap.matchedSkills.length})
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentGap.matchedSkills.length > 0 ? (
                      currentGap.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                        >
                          <span className="text-emerald-600 font-bold">✓</span> {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-emerald-800 italic">
                        No required skills currently matched. Review the recommendations below to bridge this gap.
                      </p>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4">
                  <h3 className="font-bold text-rose-900 flex items-center text-base">
                    <FaTimesCircle className="text-rose-600 mr-2" />
                    Missing Skills ({currentGap.missingSkills.length})
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentGap.missingSkills.length > 0 ? (
                      currentGap.missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-100 text-rose-800 border border-rose-300 text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                        >
                          <span className="text-rose-600 font-bold">✕</span> {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-emerald-800 font-medium">
                        ✓ All required skills matched for this role!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Recommended Learning / Improvement Areas */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center text-amber-900">
                <FaLightbulb className="mr-2 text-amber-600" />
                Recommended Learning / Improvement Areas
              </h2>
              <p className="text-sm text-amber-800 mt-1">
                Targeted recommendations to close skill gaps for <span className="font-semibold">{selectedRole}</span>:
              </p>

              <div className="mt-4 space-y-2.5">
                {currentGap.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="bg-white border border-amber-200/80 rounded-lg p-3 text-sm text-slate-800 flex items-start gap-3 shadow-xs"
                  >
                    <span className="bg-amber-100 text-amber-800 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Feedback */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center text-yellow-900">
                <FaCommentDots className="mr-2 text-yellow-600" />
                Resume Feedback
              </h2>
              <p className="mt-2 text-slate-700 leading-relaxed font-medium">
                {result.feedback}
              </p>
            </div>

            {/* 7. Recommended Jobs with "Analyze Skill Gap" Action */}
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center text-purple-900">
                <FaBriefcase className="mr-2 text-purple-600" />
                Recommended Jobs
              </h2>
              <p className="text-sm text-purple-700 mt-1">
                Roles matching your resume profile. Click <span className="font-semibold">Analyze Skill Gap</span> to run instant gap analysis:
              </p>

              <div className="mt-4 space-y-2">
                {result.recommended_jobs.map((job, index) => {
                  const isCurrentRole = selectedRole === job;
                  return (
                    <div
                      key={index}
                      className="bg-white border border-purple-200 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs hover:border-purple-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span className="font-semibold text-slate-800 text-base">{job}</span>
                        {isCurrentRole && (
                          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                            Active Target Role
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectRole(job)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          isCurrentRole
                            ? "bg-indigo-600 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        Analyze Skill Gap <FaArrowRight className="text-2xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8. AI Analysis */}
            <div className="mt-6 bg-cyan-50 border border-cyan-200 rounded-xl p-5">
              <h2 className="text-xl font-bold text-cyan-900 flex items-center">
                <FaRobot className="mr-2 text-cyan-600" />
                AI Career Insights
              </h2>

              <div className="mt-3 text-slate-700 text-sm whitespace-pre-line leading-relaxed bg-white/70 p-4 rounded-lg border border-cyan-100">
                {result.ai_analysis || "AI Analysis unavailable. Deterministic skill gap analysis is active."}
              </div>
            </div>

            {/* 9. Download Report Button */}
            <div className="mt-8 text-center">
              <button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition cursor-pointer flex items-center justify-center mx-auto text-base gap-2"
              >
                📄 Download Complete Analysis Report (PDF)
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Includes Resume Score, Extracted Skills, Skill Gap Analysis for {selectedRole}, and Learning Roadmap.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;