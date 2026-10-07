# CareerPilot AI

CareerPilot AI turns a text-based resume PDF into a practical, role-focused review. It extracts supported skills, shows how they overlap with ten career tracks, highlights gaps, and builds a downloadable report. Optional Gemini insights are **off by default**.

## What it does

- Validates PDF uploads (maximum 10 MB) and extracts selectable text without keeping the uploaded resume as a stored record.
- Identifies technical skills using conservative keyword boundaries and canonical aliases.
- Produces an explainable resume-readiness signal based on five visible content checks: skills (35 points), sections (25), readable length (20), contact details (10), and measurable impact (10). It is guidance—not an ATS score or hiring prediction.
- Ranks supported roles by overlap with detected skills and calculates exact skill-gap percentages and learning prompts.
- Exports the current analysis as a paginated PDF.
- Works on mobile and desktop, with keyboard-accessible controls, clear error states, and optional AI consent.

Supported role tracks: Data Analyst, AI/ML Engineer, Software Engineer, Web Developer, Java Developer, Python Developer, Data Scientist, Frontend Developer, Backend Developer, and Full Stack Developer. Role requirements, aliases, and learning prompts live in `shared/career_data.json` and are imported by both client and API.

## Run locally

Requirements: Python 3.10+ and Node.js 22 LTS (Vite 8 requires a recent Node release).

### 1. Install backend dependencies

```bash
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements-dev.txt
```

### 2. Start the API

```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`; interactive docs are at `/docs` and the health check is `/health`.

### 3. Start the frontend in a second terminal

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Vite proxies browser requests from `/api` to `http://127.0.0.1:8000`, so the browser never needs to call a hard-coded localhost API address. Set `API_PROXY_TARGET` if your local backend runs elsewhere.

For a separately hosted API, create `frontend/.env.local` with:

```env
VITE_API_URL=https://your-api.example.com
```

For Gemini insights, set `GEMINI_API_KEY` in the backend environment. Optionally set `GEMINI_MODEL`; the default is `gemini-2.5-flash-lite`. The resume text is sent to Gemini only when the user checks the opt-in box before upload. Core skill analysis works without a key.

For production CORS, set `CORS_ALLOW_ORIGINS` to a comma-separated list of trusted frontend origins. Local development and the supported Netlify, Vercel, and Arena preview host patterns are allowed by default.

## Tests and checks

```bash
# Frontend
cd frontend
npm test
npm run lint
npm run build

# Backend (from the repository root, with the venv active)
python -m pytest backend
ruff check backend
ruff format --check backend
```

Backend tests generate small in-memory PDFs, so they do not depend on private or ignored resume fixtures.

## API overview

- `GET /health` — liveness check.
- `GET /roles` — available roles and required skills.
- `POST /skill-gap` — JSON body: `{ "skills": ["Python", "SQL"], "target_role": "Data Analyst" }`.
- `POST /upload` — multipart PDF field `file`; optional boolean `include_ai` (defaults to `false`). Returns summary signals only; extracted resume text is not returned.

## Privacy notes

Uploaded documents are processed in temporary storage and the API does not save them as user records. Analysis responses omit the extracted resume text and personal details. If Gemini insights are enabled, the resume text (up to the first 6,000 characters) is sent to the configured Gemini service. Avoid uploading sensitive documents if you are not comfortable with that optional processing. The app has no account system or persistent report storage; the PDF report is created in your browser.
