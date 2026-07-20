import os
from dotenv import load_dotenv
from google import genai

# .env file load karega
load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def analyze_with_ai(resume_text):
    prompt = f"""
    Analyze this resume.

    Resume:
    {resume_text}

    Give:
    1. ATS Score (out of 100)
    2. Missing Skills
    3. Strengths
    4. Weaknesses
    5. Improvements
    6. Recommended Job Roles
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text