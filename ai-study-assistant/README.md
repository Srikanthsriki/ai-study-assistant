# AI Study Assistant

**Learn Smarter. Study Better. Achieve More.**

A full-stack, Gemini-powered study platform built as a final-year BCA Data
Science project. Students can chat with an AI tutor, upload study material,
generate summaries and practice questions, take AI-generated quizzes, keep
notes, and track their progress — all in one clean, responsive app.

---

## 1. Project Overview

AI Study Assistant is a complete web application with:

- A **React + Vite** frontend (Tailwind CSS, light/dark mode, fully responsive)
- A **FastAPI** backend (Python) with JWT authentication
- A **SQLite** database (structured so it can be swapped for PostgreSQL later)
- **Google Gemini API** integration for all AI features, called only from the
  backend so the API key is never exposed to the browser

---

## 2. Features

1. **AI Chat Assistant** — conversational tutor with chat history, per-user sessions, quick prompts
2. **Study Material Upload** — PDF / DOCX / TXT upload with text extraction, used as AI context
3. **Smart Summarizer** — short / medium / detailed / bullet / exam-revision summaries
4. **Question Generator** — MCQ, short, long, true/false, or mixed questions from a topic or document
5. **Quiz Mode** — interactive AI-generated quizzes with instant scoring and review
6. **My Study Notes** — create, edit, pin, search, and organize notes (including saved AI summaries)
7. **Progress Dashboard** — charts for weekly activity, quiz scores, subject performance, streaks
8. **Profile** — edit personal info, change password, view account stats
9. **Settings** — theme, AI response style, notifications, delete account
10. **Authentication** — secure registration/login with hashed passwords and JWT-protected routes

---

## 3. Technologies Used

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide icons, react-hot-toast

**Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), Passlib (bcrypt), pypdf, python-docx

**Database:** SQLite (dev) — URL-based config so it can be pointed at PostgreSQL later

**AI:** Google Gemini API (`google-generativeai` SDK), called only from the backend

---

## 4. Folder Structure

```
ai-study-assistant/
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Logo, ProtectedRoute
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── layouts/         # DashboardLayout (sidebar + topbar)
│   │   ├── pages/           # Landing, Login, Register, Dashboard pages...
│   │   ├── services/        # api.js (axios client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Environment variable settings
│   │   ├── models/          # SQLAlchemy models (all tables)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routes/          # auth, ai, materials, notes, quiz, questions, progress, profile
│   │   ├── services/        # gemini_service.py, file_service.py, activity_service.py
│   │   ├── auth/            # security.py (JWT/bcrypt), dependencies.py (get_current_user)
│   │   └── database/        # db.py (engine/session)
│   ├── uploads/              # Uploaded study materials (per user)
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Requirements

- **Python** 3.10 or newer
- **Node.js** 18 or newer (includes npm)
- A **Google Gemini API key** (free tier available)
- VS Code (recommended) — the project works well with the Python and ES7 React extensions

---

## 6. How to Configure Gemini API

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account and click **Create API key**
3. Copy the generated key — you'll paste it into `backend/.env` in the next step

---

## 7. How to Create Your `.env` File

1. Copy the example file into the backend folder:

   **Windows (Command Prompt):**
   ```cmd
   copy .env.example backend\.env
   ```

   **Windows (PowerShell) / macOS / Linux:**
   ```bash
   cp .env.example backend/.env
   ```

2. Open `backend/.env` in VS Code and fill in real values:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=sqlite:///./study_assistant.db
   SECRET_KEY=change_this_secret_to_something_random_and_long
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ALGORITHM=HS256
   FRONTEND_ORIGIN=http://localhost:5173
   MAX_UPLOAD_MB=10
   ```

   > ⚠️ Never commit `backend/.env` to GitHub — it's already excluded in `.gitignore`.

---

## 8. Backend Setup (Windows commands shown; macOS/Linux equivalents noted)

Open a terminal in VS Code and run:

```cmd
cd backend

:: Create a virtual environment
python -m venv venv

:: Activate it (Windows)
venv\Scripts\activate

:: macOS/Linux instead:
:: source venv/bin/activate

:: Install dependencies
pip install -r requirements.txt
```

### Run the backend

```cmd
uvicorn app.main:app --reload
```

The API will be available at **http://localhost:8000**, with interactive docs
at **http://localhost:8000/docs**. Database tables are created automatically
on first run (`study_assistant.db` will appear inside `backend/`).

---

## 9. Frontend Setup

Open a **second terminal** (keep the backend running in the first):

```cmd
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**. The Vite dev server
proxies all `/api/*` requests to the backend at `http://localhost:8000`
(see `frontend/vite.config.js`), so no extra CORS configuration is needed
in development.

---

## 10. How Authentication Works

- Passwords are hashed with **bcrypt** before being stored — plain-text
  passwords are never saved.
- On register/login, the backend issues a **JWT access token**.
- The frontend stores this token in `localStorage` and attaches it as an
  `Authorization: Bearer <token>` header on every API request (see
  `frontend/src/services/api.js`).
- Protected backend endpoints use a `get_current_user` dependency that
  decodes the token and rejects invalid/expired ones (`401 Unauthorized`).
- Protected frontend routes (`/dashboard`, `/assistant`, etc.) are wrapped in
  `<ProtectedRoute>`, which redirects unauthenticated users to `/login`.
- Logging out simply clears the stored token.

---

## 11. Database Setup

No manual setup is needed for development — SQLAlchemy creates all tables
automatically the first time you run the backend (`Base.metadata.create_all`
in `app/main.py`).

**To use PostgreSQL:**
The Render deployment blueprint installs `psycopg2-binary` and connects the
backend to its managed PostgreSQL database automatically. For another host,
install `psycopg2-binary` and set `DATABASE_URL` to a PostgreSQL connection
string such as:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/study_assistant
   ```
All queries use SQLAlchemy, so no model changes are required.

---

## 12. How to Use the Application

1. Open **http://localhost:5173** and click **Sign Up** to create an account
   (or see "Creating a Test Account" below).
2. You'll land on the **Dashboard**, showing your stats and quick actions.
3. Go to **AI Assistant** to chat with the AI tutor about any topic.
4. Go to **Study Materials** to upload a PDF/DOCX/TXT file.
5. Use **Summarizer** or **Question Generator**, optionally selecting an
   uploaded file as the source.
6. Use **Quiz** to generate and take an interactive AI quiz — your score is
   saved automatically and reflected on the **Progress** page.
7. Save notes manually or directly from a generated summary in **My Notes**.
8. Update your details in **Profile**, and app preferences in **Settings**.

### Creating a Test Account

Just register normally through the UI with any name/email/password (6+
characters) — there's no separate "demo mode" required. You can create as
many test accounts as you like since each account's data (chats, notes,
materials, quizzes) is completely isolated.

---

## 13. Building for Production

**Frontend:**
```cmd
cd frontend
npm run build
```
This outputs static files to `frontend/dist/`, which can be served by any
static host (Vercel, Netlify, Nginx, etc.).

**Backend:**
Run with a production ASGI server, e.g.:
```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
For real deployments, consider `gunicorn` with `uvicorn.workers.UvicornWorker`
and a process manager (systemd, Docker, etc.).

---

## 14. Deployment: Vercel + Render

1. Push the project to a GitHub repository.
2. In Render, create a new Blueprint from that repository and use the
   included `render.yaml`. Enter your `GEMINI_API_KEY` and a temporary value
   for `FRONTEND_ORIGIN`; Render generates the backend URL and JWT secret.
3. In Vercel, import the same repository and set the project root directory
   to `frontend`. Set `VITE_API_URL` to the Render backend URL ending in
   `/api` (for example, `https://your-api.onrender.com/api`) and deploy.
4. Copy the Vercel production URL into Render's `FRONTEND_ORIGIN` setting,
   then redeploy the backend. Add additional comma-separated origins only
   when needed.

Keep `GEMINI_API_KEY` and other secrets in the hosting provider's environment
settings, never in frontend variables or committed files. The frontend
supports a separate API host through `VITE_API_URL`; local development keeps
using the Vite `/api` proxy by default.

The included Render blueprint uses its free PostgreSQL plan, which has
provider-imposed limits and may expire. Render's free web service also has
ephemeral local storage: uploaded study files can be lost on restart or
redeploy. For durable production use, choose persistent database hosting and
store uploads in persistent disk or cloud object storage.

---

## 15. Security Notes

- Passwords are hashed with bcrypt; plain-text passwords are never stored.
- JWTs are signed with `SECRET_KEY` — use a long, random value in production.
- All feature endpoints (materials, notes, quizzes, chat, profile) verify
  that the requested resource belongs to the authenticated user — one
  student can never read or modify another student's data.
- Uploaded files are validated by extension (`.pdf`, `.txt`, `.docx`) and
  size (`MAX_UPLOAD_MB`), and saved under a per-user directory with a
  randomly generated filename.
- The Gemini API key lives only in `backend/.env` and is read by the backend
  process — it is never sent to or referenced in any frontend code.
- Raw backend errors are never shown to users; friendly messages are
  returned instead (e.g. "AI Assistant is temporarily unavailable. Please
  try again.").

---

## 16. Testing Checklist

Before presenting/demoing, verify:

- [ ] Register a new account
- [ ] Log out and log back in
- [ ] Try accessing `/dashboard` while logged out (should redirect to `/login`)
- [ ] Send a message in AI Assistant and confirm a reply streams in
- [ ] Rename and delete a chat session
- [ ] Upload a PDF and a TXT file in Study Materials
- [ ] Delete a study material
- [ ] Generate a summary from pasted text and from an uploaded file
- [ ] Generate MCQ and short-answer question sets
- [ ] Start a quiz, answer questions, and view the score + review
- [ ] Confirm the quiz appears in Progress charts
- [ ] Create, edit, pin, and delete a note
- [ ] Update your profile and change your password
- [ ] Toggle dark/light mode and confirm it persists on reload
- [ ] Resize the browser to mobile width and confirm the sidebar collapses correctly

---

## 17. Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` on backend start | Make sure the virtual environment is activated and `pip install -r requirements.txt` completed successfully. |
| AI features return "temporarily unavailable" | Double-check `GEMINI_API_KEY` in `backend/.env` and that you copied it correctly with no extra spaces. |
| Frontend can't reach the API | Confirm the backend is running on port 8000 and that `frontend/vite.config.js`'s proxy target matches. |
| CORS errors in the browser console | Check `FRONTEND_ORIGIN` in `backend/.env` matches the URL you're opening the frontend from. |
| Login works but dashboard redirects back to login | The stored JWT may have expired — log in again, or increase `ACCESS_TOKEN_EXPIRE_MINUTES`. |

---

Built as a demonstration of frontend development, backend development,
database management, authentication, REST APIs, AI integration, file
processing, data visualization, and responsive web design for a BCA Data
Science final-year project.
