import { jsPDF } from "jspdf";

const PAGE_MARGIN = 18;
const BODY_COLOR = [47, 56, 72];
const MUTED_COLOR = [102, 112, 128];
const BRAND_COLOR = [79, 70, 190];

function pdfSafeText(value) {
  return String(value ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[•·]/g, "-")
    .replace(/[✓✔]/g, "[x]")
    .replace(/[✕×]/g, "[x]")
    .replace(/\u00a0/g, " ")
    // jsPDF's built-in Helvetica font supports WinAnsi, not arbitrary emoji/CJK.
    .replace(/[^\u0020-\u00ff]/g, " ");
}

/** Build a paginated, text-only report from the current analysis. */
export function buildAnalysisReport(result = {}, skillGap = {}, generatedAt = new Date()) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const lineHeight = 5.1;
  let y = 19;

  const ensureSpace = (height = lineHeight) => {
    if (y + height > pageHeight - 18) {
      doc.addPage();
      y = 19;
    }
  };

  const addWrappedText = (value, options = {}) => {
    const {
      fontSize = 10,
      color = BODY_COLOR,
      bold = false,
      indent = 0,
      leading = lineHeight,
    } = options;
    const safeValue = pdfSafeText(value);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safeValue, contentWidth - indent);
    lines.forEach((line) => {
      ensureSpace(leading);
      doc.text(line, PAGE_MARGIN + indent, y);
      y += leading;
    });
  };

  const addSection = (title) => {
    ensureSpace(12);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_COLOR);
    doc.text(pdfSafeText(title), PAGE_MARGIN, y);
    y += 7;
  };

  const addList = (items, emptyMessage) => {
    const values = Array.isArray(items) ? items : [];
    if (!values.length) {
      addWrappedText(emptyMessage, { color: MUTED_COLOR, indent: 2 });
      return;
    }
    values.forEach((item) => addWrappedText(`- ${item}`, { indent: 2 }));
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND_COLOR);
  doc.text("CareerPilot AI", PAGE_MARGIN, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Resume signals and career skill-gap report", PAGE_MARGIN, y);
  y += 6;
  doc.text(`Generated ${generatedAt.toLocaleDateString()}`, PAGE_MARGIN, y);
  y += 5;
  doc.setDrawColor(224, 228, 237);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 8;

  const score = Number.isFinite(Number(result.score)) ? Number(result.score) : 0;
  addWrappedText(`Resume readiness signal: ${score}/100`, { fontSize: 14, color: BODY_COLOR, bold: true, leading: 7 });
  addWrappedText("This is a directional content heuristic, not an ATS score or a prediction of hiring outcomes.", {
    fontSize: 9,
    color: MUTED_COLOR,
    leading: 5,
  });
  addWrappedText(String(result.feedback || "No summary feedback was returned."), { leading: 5.5 });

  const breakdown = result.score_breakdown && typeof result.score_breakdown === "object"
    ? result.score_breakdown
    : {};
  if (Object.keys(breakdown).length) {
    addSection("How the score is composed");
    const labels = {
      technical_skills: "Technical skills (out of 35)",
      resume_sections: "Resume sections (out of 25)",
      length: "Readable length (out of 20)",
      contact_details: "Contact details (out of 10)",
      measurable_impact: "Measurable impact (out of 10)",
    };
    Object.entries(labels).forEach(([key, label]) => {
      if (key in breakdown) addWrappedText(`${label}: ${breakdown[key]}`);
    });
  }

  addSection(`Skills detected (${Array.isArray(result.skills) ? result.skills.length : 0})`);
  addWrappedText((Array.isArray(result.skills) && result.skills.length ? result.skills : ["No technical skills detected."]).join(", "));

  addSection(`Skill gap - ${skillGap.targetRole || "Data Analyst"}`);
  addWrappedText(
    `Role match: ${Number(skillGap.matchPercentage) || 0}% (${(skillGap.matchedSkills || []).length} of ${(skillGap.requiredSkills || []).length} required skills)`,
    { fontSize: 11, bold: true },
  );
  addWrappedText("Matched skills", { bold: true, leading: 6 });
  addList(skillGap.matchedSkills, "No required skills matched yet.");
  addWrappedText("Skills to build", { bold: true, leading: 6 });
  addList(skillGap.missingSkills, "All listed role skills matched.");

  addSection("Suggested next steps");
  addList(skillGap.recommendations, "Keep building projects and prepare role-specific examples for interviews.");

  addSection("Roles to explore");
  addList(result.recommended_jobs, "No role suggestions were returned.");

  if (result.ai_analysis) {
    addSection("Optional AI career insights");
    addWrappedText(result.ai_analysis, { leading: 5 });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text("CareerPilot AI - use this guidance as a starting point", PAGE_MARGIN, pageHeight - 9);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 9, { align: "right" });
  }

  return doc;
}

export function downloadAnalysisReport(result, skillGap) {
  const doc = buildAnalysisReport(result, skillGap);
  const roleSlug = String(skillGap?.targetRole || "career").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`careerpilot-${roleSlug || "career"}-report-${date}.pdf`);
}
