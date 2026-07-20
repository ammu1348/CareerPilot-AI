import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_with_gemini(resume_text):
    try:
        prompt = f"""
You are an expert Resume Analyzer.

Analyze the following resume and provide:

1. Resume Score out of 100
2. Strengths
3. Weaknesses
4. Missing Skills
5. Career Suggestions
6. Interview Preparation Tips

Resume:
{resume_text}
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        return response.text

    except Exception as e:
        print("Gemini Error:", e)
        return str(e)