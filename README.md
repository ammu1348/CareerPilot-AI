# CareerPilot AI

CareerPilot AI turns a text-based resume PDF into a practical, role-focused review. It extracts supported skills, shows how they overlap with ten career tracks, highlights gaps, and builds a downloadable report. Optional Gemini insights are **off by default**.

## What it does

- Validates PDF uploads (maximum 10 MB) and extracts selectable text without keeping the uploaded resume as a stored record.
- Identifies technical skills using conservative keyword boundaries and canonical aliases.
- Produces an explainable resume-readiness signal based on five visible content checks: skills (35 points), sections (25), readable length (20), contact details (10), and measurable impact (10). It is guidance—not an ATS score or hiring prediction.
- Ranks supported roles by overlap with detected skills and calculates exact skill-gap percentages and learning prompts.
- Exports the current analysis as a paginated PDF.
- Provides an opt-in AI career-coach Q&A using only the question, detected skill summary, and selected role—not the original PDF text.
- Includes a protected, single-admin operations console at `/admin/login` with live AI/service status, privacy controls, and a searchable role catalog.
- Works on mobile and desktop, with keyboard-accessible controls, clear error states, reduced-motion support, and polished but restrained animation.

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

For Gemini insights and the AI career coach, set `GEMINI_API_KEY` in the backend environment. Optionally set `GEMINI_MODEL`; the default is `gemini-2.5-flash-lite`. Upload-based insights send resume text only after the user opts in. The coach requires a separate confirmation and sends only the question, detected skills, and selected role. Without a key, deterministic analysis and learning guidance continue to work.

For a separately hosted frontend/API, set `CORS_ALLOW_ORIGINS` to a comma-separated list of exact trusted frontend origins. There is no permissive wildcard CORS default. Local development and Arena previews use the same-origin `/api` Vite proxy.

## Admin login and console

The admin console is a **single-operator control panel**, not public user registration. Resume analysis remains available without an account. There are no default passwords, demo credentials, or admin accounts stored in the repository. Admin routes are disabled until the deployment owner configures credentials.

From `backend/`, create a salted PBKDF2 password hash (the command prompts twice and prints only the hash):

```bash
python -m services.admin_auth
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set the generated values in the backend environment (for local development, use the ignored `backend/.env` file; in production, use the host's secret manager):

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=<hash printed by the password command>
ADMIN_SESSION_SECRET=<random value printed by secrets.token_urlsafe>
ADMIN_SESSION_TTL_SECONDS=28800
ADMIN_COOKIE_SECURE=false
```

`ADMIN_COOKIE_SECURE=false` is only for plain-HTTP localhost development. Use `true` over HTTPS. The default cookie is HTTP-only, SameSite strict, signed, and expires after eight hours. For a separately hosted frontend and API, configure an exact comma-separated `CORS_ALLOW_ORIGINS` allowlist and set `ADMIN_COOKIE_SAMESITE=none` with `ADMIN_COOKIE_SECURE=true`; same-origin deployment through the `/api` proxy is simpler and preferred. Do not use a wildcard origin with admin cookies.

The console shows live API configuration, optional Gemini availability, upload/extraction safeguards, and the shared role catalog. It intentionally does not store resumes, user accounts, or per-user analytics.

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
- `POST /career-coach` — requires `consent: true`; accepts a question, detected skill summary, and target role, never the PDF text.
- `POST /admin/auth/login`, `GET /admin/auth/me`, and `POST /admin/auth/logout` — single-admin session endpoints; require environment configuration.
- `GET /admin/overview` — session-protected operational status and career-role catalog; does not expose API keys or resume data.

## Privacy notes

Uploaded documents are processed temporarily; the API does not save resumes as user records, and analysis responses omit extracted resume text and personal details. If upload-based Gemini insights are enabled, up to the first 6,000 characters are sent to the configured Gemini service. The separate coach sends only the user's explicit question and a canonical skill/role summary. Avoid sharing information you are not comfortable sending to that optional service. The public analyzer has no end-user accounts or persistent report storage; the PDF report is created in the browser. The single admin credential is configured by the deployment owner and is not an end-user profile.
