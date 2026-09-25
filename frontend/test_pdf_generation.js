import { jsPDF } from 'jspdf';
import { calculateSkillGap } from './src/data/jobRoles.js';
import fs from 'node:fs';

console.log('--- Testing PDF Generation with Skill Gap Analysis ---');

const mockResult = {
  score: 85,
  skills: ['Python', 'SQL', 'Data Analytics', 'Git', 'Machine Learning'],
  feedback: 'Good Resume. Add more projects and certifications to improve.',
  recommended_jobs: ['Data Analyst', 'AI/ML Engineer', 'Python Developer']
};

const selectedRole = 'Data Analyst';
const currentGap = calculateSkillGap(mockResult.skills, selectedRole);

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
doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.setTextColor(37, 99, 235);
doc.text('CareerPilot AI', 20, y);
y += 10;

doc.setFontSize(14);
doc.setTextColor(100, 116, 139);
doc.text('AI Resume & Job Skill Gap Analysis Report', 20, y);
y += 12;

doc.setDrawColor(226, 232, 240);
doc.line(20, y, pageWidth - 20, y);
y += 10;

// 1. Resume Score
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(21, 128, 61);
doc.text(`Resume Score: ${mockResult.score}/100`, 20, y);
y += 8;

doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
doc.setTextColor(51, 65, 85);
const feedbackLines = doc.splitTextToSize(`Feedback: ${mockResult.feedback}`, pageWidth - 40);
doc.text(feedbackLines, 20, y);
y += feedbackLines.length * 6 + 4;

// 2. Extracted Skills
checkPageBreak(30);
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(30, 41, 59);
doc.text(`Extracted Skills (${mockResult.skills.length}):`, 20, y);
y += 7;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(71, 85, 105);
const skillLines = doc.splitTextToSize(mockResult.skills.join(' • '), pageWidth - 40);
doc.text(skillLines, 20, y);
y += skillLines.length * 5 + 8;

// 3. Target Role & Skill Gap Analysis
checkPageBreak(50);
doc.setDrawColor(203, 213, 225);
doc.line(20, y, pageWidth - 20, y);
y += 10;

doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.setTextColor(67, 56, 202);
doc.text('Skill Gap Analysis', 20, y);
y += 8;

doc.setFontSize(12);
doc.setTextColor(30, 41, 59);
doc.text(`Target Job Role: ${currentGap.targetRole}`, 20, y);
y += 7;

doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(21, 128, 61);
doc.text(`Skill Match Percentage: ${currentGap.matchPercentage}% (${currentGap.matchedSkills.length} of ${currentGap.requiredSkills.length} required skills)`, 20, y);
y += 9;

// Matched Skills
checkPageBreak(25);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(21, 128, 61);
doc.text('Matched Required Skills:', 20, y);
y += 6;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(51, 65, 85);
currentGap.matchedSkills.forEach((skill) => {
  checkPageBreak(7);
  doc.text(`  [✓] ${skill}`, 24, y);
  y += 5.5;
});
y += 3;

// Missing Skills
checkPageBreak(25);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(185, 28, 28);
doc.text('Missing Skills for Role:', 20, y);
y += 6;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(51, 65, 85);
currentGap.missingSkills.forEach((skill) => {
  checkPageBreak(7);
  doc.text(`  [✕] ${skill}`, 24, y);
  y += 5.5;
});
y += 6;

// 4. Learning Recommendations
checkPageBreak(40);
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(180, 83, 9);
doc.text('Personalized Learning & Improvement Recommendations:', 20, y);
y += 7;

doc.setFont('helvetica', 'normal');
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
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(126, 34, 206);
doc.text('Recommended Job Roles:', 20, y);
y += 7;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(51, 65, 85);
mockResult.recommended_jobs.forEach((job) => {
  checkPageBreak(7);
  doc.text(`• ${job}`, 25, y);
  y += 6;
});

const pdfArrayBuffer = doc.output('arraybuffer');
fs.writeFileSync('test_output_report.pdf', Buffer.from(pdfArrayBuffer));
console.log(`  [OK] PDF generated successfully! File size: ${pdfArrayBuffer.byteLength} bytes`);
console.log('--- PDF Generation Test PASSED Successfully! 🎉 ---');
