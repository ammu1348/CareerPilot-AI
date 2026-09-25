import { JOB_ROLES, normalizeSkills, calculateSkillGap } from './src/data/jobRoles.js';
import assert from 'node:assert';

console.log('--- Testing Frontend jobRoles.js ---');

// 1. Roles count check
const roles = Object.keys(JOB_ROLES);
console.log(`  Found ${roles.length} roles:`, roles);
assert(roles.length >= 10, 'Expected at least 10 roles');
assert(roles.includes('Data Analyst'), 'Missing Data Analyst');
assert(roles.includes('AI/ML Engineer'), 'Missing AI/ML Engineer');
assert(roles.includes('Software Engineer'), 'Missing Software Engineer');
assert(roles.includes('Web Developer'), 'Missing Web Developer');
assert(roles.includes('Java Developer'), 'Missing Java Developer');
assert(roles.includes('Python Developer'), 'Missing Python Developer');
assert(roles.includes('Data Scientist'), 'Missing Data Scientist');
assert(roles.includes('Frontend Developer'), 'Missing Frontend Developer');
assert(roles.includes('Backend Developer'), 'Missing Backend Developer');
assert(roles.includes('Full Stack Developer'), 'Missing Full Stack Developer');
console.log('  [OK] All 10 required roles present');

// 2. Normalization check
const rawSkills = ['ml', 'ML', 'js', 'JS', 'ReactJS', 'react.js', 'stats', 'PowerBI', 'py', 'dsa'];
const normalized = normalizeSkills(rawSkills);
console.log('  Raw:', rawSkills);
console.log('  Normalized:', normalized);
assert(normalized.includes('Machine Learning'));
assert(normalized.includes('JavaScript'));
assert(normalized.includes('React'));
assert(normalized.includes('Statistics'));
assert(normalized.includes('Power BI'));
assert(normalized.includes('Python'));
assert(normalized.includes('Data Structures'));
assert(normalized.includes('Algorithms'));
console.log('  [OK] Skill normalization handles aliases and composite terms');

// 3. Mathematical calculation check: Data Analyst with Python, SQL, Data Analytics
const gapResult = calculateSkillGap(['Python', 'SQL', 'Data Analytics'], 'Data Analyst');
console.log('  Data Analyst test result:', gapResult);
assert.deepStrictEqual(gapResult.matchedSkills, ['Python', 'SQL', 'Data Analytics']);
assert.deepStrictEqual(gapResult.missingSkills, ['Excel', 'Power BI', 'Statistics']);
assert.strictEqual(gapResult.matchPercentage, 50);
assert.strictEqual(gapResult.recommendations.length, 3);
console.log('  [OK] Mathematical match percentage is exactly 50% ((3 / 6) * 100)');
console.log('  [OK] Recommendations match missing skills:');
gapResult.recommendations.forEach(r => console.log('    •', r));

// 4. Test 100% match case
const perfectSkills = JOB_ROLES['Data Analyst'].skills;
const perfectGap = calculateSkillGap(perfectSkills, 'Data Analyst');
assert.strictEqual(perfectGap.matchPercentage, 100);
assert.strictEqual(perfectGap.missingSkills.length, 0);
console.log('  [OK] 100% match test passed');

// 5. Test 0% match case
const zeroGap = calculateSkillGap(['C++', 'Rust', 'Ruby'], 'Data Analyst');
assert.strictEqual(zeroGap.matchPercentage, 0);
assert.strictEqual(zeroGap.missingSkills.length, 6);
console.log('  [OK] 0% match test passed');

console.log('\nAll Frontend jobRoles.js Tests PASSED Successfully! 🎉');
