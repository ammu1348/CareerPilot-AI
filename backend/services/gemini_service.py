import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

def analyze_with_gemini(resume_text: str) -> str:
    """Analyze resume with Gemini, handling quota/network errors gracefully without crashing."""
    if not api_key:
        return "AI Analysis is disabled (API key not configured). Deterministic skill analysis completed successfully."

    if not resume_text or len(resume_text.strip()) < 20:
        return "Resume contains insufficient text for deep AI analysis."

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert Career and Resume Advisor.

Provide a brief, high-value analysis of this resume:
1. Top Strengths (2-3 bullet points)
2. High-Impact Career Advice (2-3 bullet points)
3. Interview Preparation Focus (1-2 sentences)

Keep the response concise, constructive, and professional.

Resume text:
{resume_text[:4000]}
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        if response and response.text:
            return response.text.strip()
        return "AI Analysis generated an empty response. Deterministic analysis completed successfully."

    except Exception as e:
        error_msg = str(e)
        print("Gemini API safe error catch:", error_msg)

        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return "AI Analysis is temporarily unavailable because the Gemini API quota has been reached. Deterministic skill gap analysis is active and fully functional."
        elif "503" in error_msg or "UNAVAILABLE" in error_msg:
            return "AI service is currently under high demand. Deterministic skill gap analysis is active and fully functional."
        else:
            return "AI Analysis is temporarily offline. Deterministic skill gap analysis is active and fully functional."