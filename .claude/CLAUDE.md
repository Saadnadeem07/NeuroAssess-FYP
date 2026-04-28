# CLAUDE.md

> Read this file completely at the start of every session before writing any code.

---

## 📦 Project: NeuroAssess

AI-powered MERN stack web application for early detection and personalized support of students with **dyslexia** and **dysgraphia**. Uses handwriting analysis, ML-based learning plans, role-based dashboards, and psychiatrist consultation scheduling. Built for educators and parents seeking data-driven assessment and treatment support.

**Target users:** Students, Parents, Psychiatrists, Admins (schools / clinics)
**Language:** English
**Live URL:** https://neuro-assess-fyp.vercel.app
**Repo:** https://github.com/Saadnadeem07/NeuroAssess-FYP

---

## 🧱 Tech Stack (LOCKED — do not change without approval)

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ LTS |
| Backend Framework | Express 4 (JavaScript / CommonJS) |
| Frontend Framework | React 18 + Vite |
| Language | Backend: JavaScript. Frontend: TypeScript (strict). Backend TS migration is tracked as M-01 in BUG_REPORT. |
| Database | MongoDB 7+ (Atlas in prod, Docker in dev) |
| ODM | Mongoose 8+ |
| Auth | JWT (access + refresh tokens), bcrypt for hashing |
| Styling | Tailwind CSS |
| Routing (client) | React Router v6 |
| File Storage | Local FS in dev; cloud (S3/Cloudinary) in prod for handwriting images |
| Package Manager | npm |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Infrastructure | Docker (dev + prod compose), Nginx reverse proxy |
| Deployment | Vercel (client), backend TBD |

---

## 📂 Repository Structure

```
NeuroAssess-FYP/
├── .claude/
│   ├── CLAUDE.md                  ← THIS FILE
│   ├── settings.json
│   └── commands/
│       ├── audit.md
│       └── fix-issue.md
├── client/                        ← React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/            ← Reusable UI components
│   │   ├── pages/                 ← Route-level page components
│   │   ├── hooks/                 ← Custom React hooks
│   │   ├── context/               ← React context providers (auth, etc.)
│   │   ├── services/              ← API call abstractions
│   │   ├── types/                 ← TypeScript interfaces/types
│   │   └── utils/                 ← Utility/helper functions
│   ├── Dockerfile
│   ├── .env
│   └── package.json
├── server/                        ← Express.js + Node.js backend
│   ├── src/
│   │   ├── controllers/           ← Route handler logic (no business logic here)
│   │   ├── models/                ← Mongoose schemas + models
│   │   ├── routes/                ← Express routers
│   │   ├── middleware/            ← Auth, error, upload, rate-limit middleware
│   │   ├── services/              ← Business logic layer (owns DB calls)
│   │   └── utils/                 ← Helpers, constants
│   ├── Dockerfile
│   ├── .env
│   └── package.json
├── nginx/
│   └── nginx.conf                 ← Reverse proxy config
├── docs/                          ← Architecture and convention docs
│   ├── architecture.md
│   ├── api-conventions.md
│   ├── data-model.md
│   ├── auth-and-security.md
│   ├── error-handling.md
│   ├── ui-ux-guidelines.md
│   └── deployment.md
├── docker-compose.dev.yml         ← Dev: hot-reload, bind mounts
├── docker-compose.prod.yml        ← Prod: built images, nginx routing
├── .github/workflows/             ← CI/CD pipelines
└── README.md
```

---

## 👥 User Roles & Capabilities

| Role | Capabilities |
|------|-------------|
| **Student** | Take handwriting assessments, view personal learning plan, track own progress |
| **Parent** | View child's reports, book psychiatrist appointments, monitor progress |
| **Psychiatrist** | View assigned students, manage consultations, add clinical notes |
| **Admin** | Full system access, user management, all reports, system configuration |

---

## 🔐 Auth & Security (NON-NEGOTIABLE)

1. **JWT strategy:** short-lived access token (15 min), refresh token (7 days). Rotate refresh tokens on use.
2. **Password hashing:** bcrypt with cost factor ≥ 12. Never log or return password hashes.
3. **CORS:** explicit allowlist, `credentials: true`. No wildcard origins in prod.
4. **Helmet:** enabled with sensible defaults (CSP, HSTS, frameguard).
5. **Rate limiting:** `express-rate-limit` on `/auth/*` and any expensive endpoints. Stricter on login + password reset.
6. **Input validation:** every route validated server-side. Never trust `req.body`, `req.query`, or `req.params` directly.
7. **Authorization:** auth middleware on every protected route. Re-check ownership inside services — never trust client-supplied user/role IDs.
8. **Secrets:** env vars only. Never commit `.env` files. Only `.env.example` is committed.
9. **NoSQL injection:** never pass raw `req.body` into Mongo queries; always destructure validated fields.
10. **File uploads:** validate MIME type + enforce size limits on handwriting image uploads.

---

## 🧩 Required Express Middleware Pipeline (in order)

```js
app.use(requestId)            // attach req.id (uuid) for tracing
app.use(morgan(...))          // request logging
app.use(helmet())
app.use(cors(corsOptions))    // explicit allowlist; no wildcards
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(globalLimiter)        // express-rate-limit

app.use('/api/auth', authRouter)
app.use('/api/...', router)

app.use(notFound)
app.use(errorHandler)         // ALWAYS last
```

Per-route rate limits (`authLimiter`, `otpLimiter`, `passwordResetLimiter`) live in `server/src/middleware/rateLimit.js` and are applied in route files.

---

## 📤 API Response Contract

Every API response uses one shape:

```ts
type ApiResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; statusCode: number }
```

- HTTP status reflects the failure (400/401/403/404/409/422/500)
- Never leak stack traces in production responses
- All errors flow through the centralized `errorHandler` middleware

---

## 🐳 Docker Architecture

### Dev (`docker-compose.dev.yml`)
- `client` → Vite dev server, port 3000, bind mount for hot-reload
- `server` → Express + nodemon, port 5000, bind mount for hot-reload
- `mongodb` → MongoDB, port 27017

### Prod (`docker-compose.prod.yml`)
- `client` → Static build served via Nginx
- `server` → Production Node process
- `nginx` → Routes `/api/*` → server, `/*` → client static files
- No bind mounts; images built from Dockerfiles

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neuroassess
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

---

## 📋 Backend Module Pattern (MANDATORY)

Every feature follows this layered split. **Do not put business logic in controllers or routes.**

- `*.routes.js` — Express router; wires URL + middleware (validate, rate-limit, auth) + controller. No logic.
- `*.controller.js` — Parses req, calls service/model, formats response with `res.json` or throws `AppError`. Wrap async handlers with `asyncHandler` from `utils/asyncHandler.js`.
- `*.model.js` (or service-style files in `models/authModel.js`) — Mongoose schema + business logic that lives near the data.
- All errors use `AppError` from `utils/AppError.js`; codes are in `utils/errorCodes.js`. The global `errorHandler` middleware shapes the JSON response.

## 🔧 Reusable utilities & middleware

- `utils/AppError.js`, `utils/errorCodes.js`, `utils/asyncHandler.js`
- `utils/tokens.js` — sign/verify access (15m) and refresh (7d) JWTs; rotation helper
- `utils/cookies.js` — cookie-only auth helper (`setAuthCookies`, `clearAuthCookies`)
- `utils/sanitize.js` — serializers that strip OTP/password/etc before responses
- `utils/passwordPolicy.js` — single source of truth for password validation
- `utils/constants.js` — TTLs, magic numbers
- `middleware/requestId.js`, `errorHandler.js`, `notFound.js`, `validate.js`, `rateLimit.js`

---

## 📌 Key Domain Concepts

| Concept | Description |
|---------|-------------|
| **Assessment** | AI handwriting analysis task submitted by student |
| **Learning Plan** | Personalized curriculum generated post-assessment via ML |
| **Progress Report** | Tracked metrics per student over time |
| **Consultation** | Scheduled session between parent/student and psychiatrist |

---

## 🚫 Never

- ❌ Use `any` — use `unknown` and narrow
- ❌ Put business logic in routes or controllers
- ❌ Query MongoDB with unvalidated `req.body` / `req.query`
- ❌ Commit `.env` files
- ❌ Trust `req.user.role` without server-side re-verification
- ❌ Return raw Mongoose documents — always serialize and strip sensitive fields
- ❌ Expose MongoDB port publicly in prod Docker compose
- ❌ Use `latest` tag for Docker base images — always pin versions
- ❌ Write ad-hoc `res.status(500).json(...)` — always use `errorHandler`

---

## ✅ Always

- ✅ Read this file at the start of every session
- ✅ Read `docs/api-conventions.md` before adding endpoints
- ✅ Read `docs/error-handling.md` before writing error handling
- ✅ Read `docs/ui-ux-guidelines.md` before any UI change
- ✅ Wrap async controllers in `asyncHandler` and throw `AppError` instead of `res.status(...).json(...)`
- ✅ Pull the principal from `req.patient`/`req.psychiatrist`/`req.admin` — never trust `req.body.userId`
- ✅ Use the helpers in `utils/cookies.js` + `utils/tokens.js` for any auth-related response
- ✅ Frontend: run `npm run lint` (client) before declaring work done
- ✅ Write or update the Mongoose model **before** writing the controller
- ✅ Add indexes for every field you query or sort by — define in the schema
- ✅ Handle loading, error, and empty states in every UI component

---

## 🎯 Current Phase

**Phase: Bug Audit & Stabilization**
- [x] Full codebase audit completed (see `docs/BUG_REPORT.md`)
- [ ] Fix all Critical issues
- [ ] Fix all High issues
- [ ] Fix Medium issues
- [ ] UI/UX polish pass
- [ ] Add missing tests
- [ ] Production hardening (Docker, Nginx, CI/CD)

When resuming after a break:
1. `npm install` in both `client/` and `server/`
2. `docker compose -f docker-compose.dev.yml up -d`
3. Open this file, then `docs/BUG_REPORT.md`
4. Pick the next unchecked issue, implement the fix, verify, mark done.

---

## 📚 Companion Docs (in `/docs`)

| File | Owns |
|---|---|
| `architecture.md` | High-level diagram, request lifecycle, module boundaries |
| `api-conventions.md` | URL shape, versioning, pagination, filtering, response contract |
| `data-model.md` | Each collection, fields, indexes, relationships |
| `auth-and-security.md` | Token flow, cookie config, role matrix, rate limits |
| `error-handling.md` | Error codes, when to throw what, UI display rules |
| `ui-ux-guidelines.md` | Design tokens, spacing, components, states |
| `deployment.md` | Env vars, build steps, prod checklist, rollback |
