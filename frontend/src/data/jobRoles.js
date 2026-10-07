import careerData from "../../../shared/career_data.json" with { type: "json" };

// These definitions are shared with the API to prevent frontend/backend drift.
export const JOB_ROLES = careerData.roles;
export const SKILL_NORMALIZATION_MAP = careerData.skill_normalization;
export const SKILL_RECOMMENDATIONS = careerData.skill_recommendations;

const PROGRAMMING_LANGUAGE_ALIASES = new Set([
  "python", "python3", "python 3", "java", "javascript", "ecmascript", "typescript", "ts", "c++", "c#",
]);
const RELATIONAL_DATABASE_ALIASES = new Set(["sql", "mysql", "postgresql", "postgres", "sqlite"]);
const DATABASE_ALIASES = new Set(["database", "dbms", "rdbms", "mongodb"]);
const DSA_ALIASES = new Set([
  "dsa", "data structures and algorithms", "data structures & algorithms",
]);

/** Normalize raw skill strings and aliases to canonical labels. */
export function normalizeSkills(skills = []) {
  const values = Array.isArray(skills) ? skills : (typeof skills === "string" ? [skills] : []);
  const normalized = new Set();

  values.forEach((raw) => {
    if (typeof raw !== "string" || !raw.trim()) return;
    const clean = raw.trim().replace(/\s+/g, " ").toLowerCase();
    const canonical = SKILL_NORMALIZATION_MAP[clean] || raw.trim().replace(/\s+/g, " ");
    normalized.add(canonical);

    if (RELATIONAL_DATABASE_ALIASES.has(clean)) {
      normalized.add("Database");
      normalized.add("SQL");
    } else if (DATABASE_ALIASES.has(clean)) {
      normalized.add("Database");
    }
    if (DSA_ALIASES.has(clean)) {
      normalized.add("Data Structures");
      normalized.add("Algorithms");
    }
    if (PROGRAMMING_LANGUAGE_ALIASES.has(clean) || ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#"].includes(canonical)) {
      normalized.add("Programming");
    }
  });

  return Array.from(normalized).sort();
}

/**
 * Compare resume skills with a target role.
 * Match percentage = matched required skills / all required skills.
 */
export function calculateSkillGap(resumeSkills = [], targetRole = "Data Analyst") {
  const roleName = Object.hasOwn(JOB_ROLES, targetRole) ? targetRole : "Data Analyst";
  const requiredSkills = JOB_ROLES[roleName].skills;
  const normalizedResume = normalizeSkills(resumeSkills);
  const matchedSkills = requiredSkills.filter((skill) => normalizedResume.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !normalizedResume.includes(skill));
  const rawPercentage = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 0;
  const roundedPercentage = Math.round(rawPercentage * 10) / 10;
  const matchPercentage = Number.isInteger(roundedPercentage) ? Math.round(roundedPercentage) : roundedPercentage;

  const recommendations = missingSkills.map(
    (skill) => SKILL_RECOMMENDATIONS[skill] || `Learn and build hands-on practical projects with ${skill}.`,
  );
  if (!recommendations.length) {
    recommendations.push(
      `Strong listed-skill match for ${roleName}. Keep building project evidence and prepare role-specific interview examples.`,
    );
  }

  return {
    targetRole: roleName,
    requiredSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
    recommendations,
    normalizedResumeSkills: normalizedResume,
  };
}
