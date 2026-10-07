import assert from "node:assert/strict";
import { buildAnalysisReport } from "./src/utils/report.js";
import { calculateSkillGap } from "./src/data/jobRoles.js";

console.log("--- CareerPilot PDF report tests ---");

const result = {
  score: 76,
  score_breakdown: {
    technical_skills: 17.5,
    resume_sections: 20,
    length: 20,
    contact_details: 10,
    measurable_impact: 10,
  },
  skills: ["Python", "SQL", "Data Analytics", "Git", "React"],
  feedback: "A solid foundation. Add specific outcomes and tailor the resume to each role.",
  recommended_jobs: ["Data Analyst", "Python Developer", "Software Engineer"],
  ai_analysis: "AI insights were not requested.",
};
const gap = calculateSkillGap(result.skills, "Data Analyst");
const pdf = buildAnalysisReport(result, gap, new Date("2026-10-07T12:00:00Z"));
const bytes = Buffer.from(pdf.output("arraybuffer"));
assert.ok(bytes.length > 1_000, "Expected a non-empty PDF file");
assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
assert.ok(pdf.internal.getNumberOfPages() >= 1);

const longGap = {
  ...gap,
  recommendations: Array.from({ length: 24 }, (_, index) =>
    `Recommendation ${index + 1}: Build a practical project, explain the decisions you made, show the measurable outcome, and write a clear summary of the techniques and tools you used. `.repeat(4),
  ),
};
const longPdf = buildAnalysisReport(result, longGap, new Date("2026-10-07T12:00:00Z"));
assert.ok(longPdf.internal.getNumberOfPages() > 1, "Long reports should paginate instead of overflowing the page");

console.log(`PDF output is valid (${bytes.length} bytes); long reports use ${longPdf.internal.getNumberOfPages()} pages.`);
