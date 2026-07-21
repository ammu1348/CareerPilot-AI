import { useState } from "react";
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
} from "react-icons/fa";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://careerpilot-ai-voej.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server Error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("❌ Unable to connect to backend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // PDF Download
  const downloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CareerPilot AI", 20, 20);

    doc.setFontSize(16);
    doc.text("Resume Analysis Report", 20, 32);

    doc.setFontSize(14);
    doc.text(`Resume Score: ${result.score}/100`, 20, 50);

    doc.text("Skills:", 20, 65);

    result.skills.forEach((skill, index) => {
      doc.text(`• ${skill}`, 30, 75 + index * 8);
    });

    let y = 80 + result.skills.length * 8;

    doc.text("Feedback:", 20, y);
    doc.text(result.feedback, 30, y + 10);

    y += 30;

    doc.text("Recommended Jobs:", 20, y);

    result.recommended_jobs.forEach((job, index) => {
      doc.text(`• ${job}`, 30, y + 10 + index * 8);
    });

    doc.save("CareerPilot_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-10">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-4xl">

        <h1 className="text-4xl font-bold text-center text-blue-600">
          🚀 CareerPilot AI
        </h1>

        <p className="text-center text-gray-500 mt-2">
          AI Resume Analyzer
        </p>

        {/* Upload */}

        <div className="flex gap-3 mt-8">
          <input
            type="file"
            accept=".pdf"
            className="border rounded-lg p-2 w-full"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 rounded-lg flex items-center"
          >
            <FaFileUpload className="mr-2" />
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Error */}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <>
            {/* Score */}

            <div className="mt-8 bg-green-100 rounded-xl p-6 flex justify-between items-center">

              <div>
                <h2 className="text-xl font-bold">
                  📊 Resume Score
                </h2>

                <p className="text-gray-600 mt-2">
                  Your resume has been analyzed successfully.
                </p>
              </div>

              <div className="w-28 h-28">
                <CircularProgressbar
                  value={result.score}
                  text={`${result.score}%`}
                  styles={buildStyles({
                    textColor: "#15803d",
                    pathColor: "#16a34a",
                    trailColor: "#d1fae5",
                  })}
                />
              </div>

            </div>

            {/* Skills */}

            <div className="mt-6">
              <h2 className="text-xl font-bold flex items-center">
                <FaTools className="mr-2" />
                Skills
              </h2>

              <div className="flex flex-wrap gap-2 mt-3">
                {result.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Feedback */}

            <div className="mt-6 bg-yellow-100 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center">
                <FaCommentDots className="mr-2" />
                Feedback
              </h2>

              <p className="mt-2">
                {result.feedback}
              </p>
            </div>

            {/* Jobs */}

            <div className="mt-6 bg-purple-100 rounded-xl p-5">
              <h2 className="text-xl font-bold flex items-center">
                <FaBriefcase className="mr-2" />
                Recommended Jobs
              </h2>

              <ul className="list-disc ml-6 mt-3">
                {result.recommended_jobs.map((job, index) => (
                  <li key={index}>{job}</li>
                ))}
              </ul>
            </div>

            {/* AI Analysis */}

            <div className="mt-6 bg-cyan-100 rounded-xl p-5">
              <h2 className="text-xl font-bold">
                🤖 AI Analysis
              </h2>

              <p className="mt-2 text-gray-700">
                AI Analysis is temporarily unavailable because the Gemini API quota has been exceeded.
              </p>

              <p className="text-sm text-gray-500 mt-2">
                This feature will be enabled once the API quota is restored.
              </p>
            </div>

            {/* Download Button */}

            <div className="mt-6 text-center">
              <button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                📄 Download Report
              </button>
            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default App;