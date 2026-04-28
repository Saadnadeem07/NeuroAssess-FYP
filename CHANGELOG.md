# Changelog

All notable changes to NeuroAssess are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Repo hygiene & professionalism pass

- **Renamed for consistency:**
  - `server/src/models/authModel.js` → `server/src/services/authService.js`
    (it was a service, not a model). Imports in `controllers/authController.js`
    and `index.js` updated.
  - `client/src/components/user/UserSeeOnePsy.tsx` → `PsychiatristDetailView.tsx`.
  - `client/src/components/user/UserSeeAllPsy.tsx` → `PsychiatristDirectory.tsx`.
  - Patient dashboard navigation ids `userSeeOnePsy` / `userSeeAllPsy` →
    `psychiatrist-detail` / `psychiatrists`. Sidebar label "All PSY" →
    "Psychiatrists".
- **Deleted dead files:**
  - `client/src/pages/Dummy Buttons.tsx` — debug page in production with a
    space in the filename. Route `/buttons` removed from `App.tsx`.
  - `client/src/components/admin/AdminMain.tsx` — entire file was commented
    out.
- **Conventions enforced:**
  - `server/src/models/*.js` — PascalCase, mongoose schemas only.
  - `server/src/services/*.js` — camelCase, business logic.
  - `server/src/controllers/*.js`, `server/src/routes/*.js`,
    `server/src/middleware/*.js`, `server/src/utils/*.js` — camelCase.
  - `client/src/components/**/*.tsx` — PascalCase per component.

### Admin panel — professional refresh

- Rebuilt `client/src/components/admin/AdminDashboardHome.tsx`:
  - **Live KPI strip** — pending approvals, total psychiatrists, total patients,
    pulled from `GET /admin/psychiatrists/pending`, `/admin/psychiatrists`,
    `/admin/patients`. Skeleton loaders while loading; graceful banner on
    fetch failure.
  - **Module cards** — accent borders, accessible icons, focus-visible
    rings, real "Open →" affordance on hover/focus.
  - **Approvals queue callout** — dark-on-light contrast, real count instead
    of the previous "3 pending" hardcoded copy, hides the count when zero.
  - All buttons are real `<button type="button">` with proper aria.

### .gitignore — comprehensive rewrite

- Root `.gitignore` now organizes excludes by category (Dependencies,
  Environment, Build outputs, Test, Logs, Editor/IDE, OS, Tooling caches,
  Docker, Temporary, Secrets). Adds patterns missed before:
  `*.tsbuildinfo`, `.vite/`, `.next/`, `.turbo/`, `.parcel-cache/`,
  `coverage/`, `.nyc_output/`, `*.lcov`, `.idea/`, `*.iml`, `.swo/.swp`,
  `docker-compose.override.yml`, `*.pem/*.key/*.crt/*.p12/*.pfx`, `secrets/`,
  `credentials/`. Per-package `server/.gitignore` and `client/.gitignore`
  scoped to their own concerns.

## [Pre-2026-04-28]

### Security

- **[C-01]** Stop returning OTPs in HTTP responses on `register*`, `verify*OTP`,
  and `resend*OTP`. OTPs are now delivered only by email.
- **[C-02]** Remove the public admin self-register endpoint and the committed
  `ADMIN_SECRET_KEY`. New admins are provisioned via
  `node server/scripts/seed-admin.js --email=… --name=… --password=…`.
- **[C-04]** Add `express-rate-limit`. `globalLimiter` (200/min/IP) registered
  globally; `authLimiter`, `otpLimiter`, and `passwordResetLimiter` applied
  per route in `routes/auth.js`. Per-account OTP attempt counter locks after
  5 failures.
- **[C-05]** Add `helmet()` to the Express middleware pipeline.
- **[C-06]** Replace the dev CORS wildcard with an explicit allowlist
  (`FRONTEND_URL`, `localhost:3000`, `localhost:5173`); same logic in dev and prod.
- **[C-09]** Stop trusting client-supplied `userId`. Every report and learning-plan
  controller derives the user from `req.patient._id`.
- **[H-03]** Implement access (15m) + refresh (7d) JWTs with rotation. Both are
  delivered as `httpOnly`, `sameSite=strict` cookies. New `RefreshToken` model
  stores hashed refresh tokens with `revokedAt` / `replacedBy`. Refresh-token
  reuse triggers an account-wide revoke. New `POST /api/auth/refresh` endpoint.
- **[H-04]** Centralize password policy in `utils/passwordPolicy.js`
  (8 chars + upper/lower/digit). Used in register, change-password, reset-password.
- **[H-05]** Bump bcrypt cost factor to 12 across all user models.
- **[H-06]** Route every cookie write through `utils/cookies.js`. Drop the
  bespoke 30-day cookie in `loginPsychiatrist`.
- **[H-07]** Lock down `GET /api/users/:id`; replace generic update with narrow,
  allowlisted self-update endpoints (`/patients/:id`, `/psychiatrists/:id`,
  `/admins/:id`).
- **[H-08]** Require authentication on the psychiatrist directory and return only
  `publicPsychiatristFields` (drop phone, license number, DoB, country, email).
- **[H-10]** Frontend is fully cookie-only. `Authorization: Bearer` and
  `localStorage.token` removed everywhere; `sameSite=strict` is the CSRF defense.
- **[H-11]** Remove the 20 committed handwriting PNGs from the git index; add
  `server/src/uploads/` to `.gitignore` (with a `.gitkeep` so the directory is
  preserved). History rewrite left to operators.
- **[H-12]** Multer rejects on mime mismatch; the extension fallback is gone.

### Added

- **Backend utility scaffold** (`server/src/utils/`):
  - `AppError.js` — typed error class with `badRequest` / `unauthorized` / `forbidden`
    / `notFound` / `conflict` / `unprocessable` helpers.
  - `errorCodes.js` — frozen object of stable error code constants.
  - `asyncHandler.js` — `(fn) => (req, res, next) => Promise.resolve(fn(...))`
    wrapper so async handlers funnel through the global error handler.
  - `cookies.js` — `setAuthCookies`, `clearAuthCookies`, and option helpers.
  - `tokens.js` — `signAccess`, `signRefresh`, `verifyAccess`, `verifyRefresh`,
    `newJti`, `hashToken`.
  - `sanitize.js` — serializers (`safePatient`, `safePsychiatrist`,
    `safeAdmin`, `publicPsychiatristFields`) that strip OTPs, password hashes,
    and reset tokens before they reach clients.
  - `passwordPolicy.js` — single-source-of-truth password validator.
  - `constants.js` — `MS`, OTP TTLs, bcrypt cost, cookie names, etc.

- **Backend middleware scaffold** (`server/src/middleware/`):
  - `requestId.js` — attaches `req.id` (UUID v4) and `X-Request-Id` header.
  - `errorHandler.js` — centralized error handler with stable JSON shape
    `{ success, error, code, statusCode, requestId, details? }`. Logs full
    stack server-side; never leaks raw 5xx detail in production.
  - `notFound.js` — 404 fallback that funnels into `errorHandler`.
  - `validate.js` — runs `express-validator`'s `validationResult` and throws
    `AppError.unprocessable` with structured details.
  - `rateLimit.js` — preconfigured `globalLimiter`, `authLimiter`,
    `otpLimiter`, `passwordResetLimiter`.

- **Models / scripts:**
  - `server/src/models/RefreshToken.js` — refresh-token store with TTL index,
    `accountId+role` compound index, `isActive()` instance method.
  - `server/scripts/seed-admin.js` — CLI for provisioning admin accounts
    out-of-band.

- **Frontend auth flow:**
  - `client/src/services/api.ts` — single-flight refresh on 401, retries the
    original request, dispatches a `auth:logout` event on refresh failure.
  - `client/src/context/AuthContext.tsx` — listens for `auth:logout` and clears
    state.

- **Operational files:**
  - `server/.env.dev.example` and `server/.env.prod.example`.
  - `server/.dockerignore` and `client/.dockerignore`.
  - `server/src/uploads/.gitkeep`.

### Changed

- **`server/src/index.js`** — full pipeline rewrite. New order:
  `requestId → morgan → helmet → cors → express.json({ limit: "5mb" })
  → cookieParser → globalLimiter → routes → notFound → errorHandler`.
  The cleanup interval is gated on `mongoose.connection.readyState === 1`,
  started after the `connected` event, and cleared on `SIGINT`/`SIGTERM`.
  `/api/health` now reports DB connection state.
- **`server/src/controllers/authController.js`** — strip OTPs from responses,
  remove unmounted dead handlers (~700 lines), centralize token issuance via
  `issueTokens`, route every cookie write through `utils/cookies.js`,
  consistent forgot-password flow that does not leak account existence.
- **`server/src/controllers/reportController.js`** and
  **`server/src/controllers/learningPlanController.js`** — derive user id from
  `req.patient._id`; remove default Hugging Face URL fallback (now required).
- **`server/src/middleware/auth.js`** — cookie-only verification (drop the
  `Authorization: Bearer` path), single `requireRole(role)` factory backs
  `protectPatient` / `protectPsychiatrist` / `protectAdmin`. Local duplicate
  of `protectPatientOrPsychiatrist` in `routes/appointments.js` removed.
- **`server/src/models/{Account,Patient,Psychiatrist,Admin}.js`** — bcrypt
  cost 12; OTP attempt counter + lockout fields; `verifyOTP` now returns
  `{ ok, reason: "expired" | "invalid" | "locked" }`. OTP generation uses
  `crypto.randomInt`.
- **`server/src/models/authModel.js`** — refactored on top of `AppError`;
  cleanup is driven by `otp.expiresAt < now` rather than a fixed 5-minute clock
  window.
- **`server/src/services/emailService.js`** — SMTP `verify()` no longer runs
  on import; exposed as `verifySmtp()` for health checks.
- **All routes** (`auth`, `users`, `admin`, `appointments`, `messages`,
  `tests`, `learningPlans`) — wrapped with `asyncHandler`, ad-hoc 500s
  replaced by thrown `AppError`s, response payloads sanitized.
- **`server/src/config/database.js`** — accept `MONGODB_URI` or `MONGO_URI`,
  fail fast if neither is set.
- **`docker-compose.dev.yml`** — backend healthcheck now uses `wget` (alpine
  image lacks `curl`); `restart: unless-stopped` added.
- **`server/.env.example`** — replaced with the new variable set
  (`JWT_ACCESS_EXPIRE`, `JWT_REFRESH_EXPIRE`, `JWT_REFRESH_SECRET`); removed
  `ADMIN_SECRET_KEY`.
- **`.gitignore`** (root + `server/`) — env-file exclusion now keeps the
  `*.example` siblings; `server/src/uploads/*` excluded with `.gitkeep`
  exception.

### Removed

- `client/src/pages/auth/AdminRegister.tsx` and the `/admin/register` route.
- `server/src/models/User.js` (unused; admin user-listing referenced this and
  silently returned `[]`).
- `server/src/models/PsychiatristProfile.js` (entirely commented-out file).
- `server/src/middleware/validation.js` (superseded by `utils/passwordPolicy.js`
  and `middleware/validate.js`).
- All in-repo handwriting PNGs under `server/src/uploads/`.

### Documentation

- `.claude/CLAUDE.md` — language line corrected to JavaScript backend; new
  utilities/middleware enumerated; environment variable names updated; the
  required pipeline now matches `index.js`. (Resolves M-01 contract drift.)
- `docs/auth-and-security.md` — refresh-token flow, rotation, reuse detection,
  cookie config, role matrix, rate limits, admin provisioning.
- `docs/error-handling.md` — `AppError` pattern, response shape, stable codes,
  UI display rules.
- `docs/deployment.md` — first-time setup (`cp .env.dev.example .env.dev`),
  required env vars, `seed-admin.js` usage.
- `docs/BUG_REPORT.md` — appended a "Resolved in 2026-04-28 round" section
  cross-referencing every closed C-/H- ID with the fix summary.

### Notes

- Schema split-brain (`Account` / `Patient` / `Psychiatrist` / `Admin`,
  tracked as **C-03**) intentionally deferred to a separate migration round.
- Backend stays JavaScript for now; the TS migration is tracked as **M-01**.
- All 18 Medium, 12 Low, 12 UI/UX, and 11 Infra findings remain open and are
  scheduled for follow-up rounds. The new utility scaffold means most of those
  will be small mechanical edits.

### Verification

- All files under `server/src/` parse cleanly (`node --check`).
- Frontend TypeScript build is clean (`tsc -b` — 0 errors).
- Pre-existing ESLint warnings (unused imports, ambient `any`) are not
  regressions; they are tracked in the L-tier of `docs/BUG_REPORT.md`.
