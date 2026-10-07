import assert from "node:assert/strict";
import { JOB_ROLES, calculateSkillGap, normalizeSkills } from "./src/data/jobRoles.js";

console.log("--- CareerPilot role and skill tests ---");

const roles = Object.keys(JOB_ROLES);
assert.equal(roles.length, 10, "Expected ten supported roles");
assert.ok(roles.includes("Data Analyst"));
assert.ok(roles.includes("AI/ML Engineer"));
assert.ok(roles.includes("Full Stack Developer"));

const aliases = normalizeSkills([
  "ml", "ML", "js", "JS", "ReactJS", "react.js", "stats", "PowerBI", "py", "dsa", "C++", null,
]);
assert.ok(aliases.includes("Machine Learning"));
assert.ok(aliases.includes("JavaScript"));
assert.ok(aliases.includes("React"));
assert.ok(aliases.includes("Statistics"));
assert.ok(aliases.includes("Power BI"));
assert.ok(aliases.includes("Python"));
assert.ok(aliases.includes("Data Structures"));
assert.ok(aliases.includes("Algorithms"));
assert.ok(aliases.includes("Programming"));
assert.equal(normalizeSkills("python").includes("Python"), true);
assert.deepEqual(normalizeSkills(null), []);
assert.ok(normalizeSkills("py").includes("Programming"));
assert.ok(normalizeSkills("TypeScript").includes("Programming"));
assert.ok(normalizeSkills("DSA").includes("Algorithms"));
assert.equal(normalizeSkills(["SQL", "PostgreSQL", "SQL"]).filter((skill) => skill === "SQL").length, 1);

const gap = calculateSkillGap(["Python", "SQL", "Data Analytics"], "Data Analyst");
assert.deepEqual(gap.matchedSkills, ["Python", "SQL", "Data Analytics"]);
assert.deepEqual(gap.missingSkills, ["Excel", "Power BI", "Statistics"]);
assert.equal(gap.matchPercentage, 50);
assert.equal(gap.recommendations.length, 3);

const perfectGap = calculateSkillGap(JOB_ROLES["Data Analyst"].skills, "Data Analyst");
assert.equal(perfectGap.matchPercentage, 100);
assert.deepEqual(perfectGap.missingSkills, []);
assert.equal(perfectGap.recommendations.length, 1);

const zeroGap = calculateSkillGap(["C++", "Rust", "Ruby"], "Data Analyst");
assert.equal(zeroGap.matchPercentage, 0);
assert.equal(zeroGap.missingSkills.length, 6);

const fallbackGap = calculateSkillGap(["Python"], "Unsupported role");
assert.equal(fallbackGap.targetRole, "Data Analyst");
assert.equal(fallbackGap.requiredSkills.length, 6);

console.log("All frontend role and skill tests passed.");
