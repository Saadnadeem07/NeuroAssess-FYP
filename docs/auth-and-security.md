# Auth & Security

## Token Flow
- **Access token:** JWT, **15 min** TTL, signed with `JWT_SECRET`
- **Refresh token:** JWT, **7 day** TTL, signed with `JWT_REFRESH_SECRET`, **rotated on use**
- Both tokens delivered as `httpOnly`, `sameSite=strict`, `secure` (in prod) cookies
- Client never sees the token strings; the SPA simply makes credentialed requests

### Endpoints
- `POST /api/auth/{role}/login` — sets `accessToken` + `refreshToken` cookies
- `POST /api/auth/{role}/verify-otp` — same as login on success
- `POST /api/auth/refresh` — verifies the refresh cookie, issues a new pair, revokes the old
- `POST /api/auth/logout` — revokes the refresh token row, clears both cookies

### Refresh-token reuse detection
Refresh tokens are stored hashed in `RefreshToken` collection with `revokedAt` + `replacedBy`. If the server sees a refresh JWT whose hash is **not** in the table, it treats it as a theft attempt and revokes every active refresh token for that account.

## Password Hashing
- bcrypt cost factor **12** (centralized in `utils/constants.js`)
- Hashes never logged, never returned

## Password Policy
- 8 character min, must contain upper, lower, and digit (single source of truth in `utils/passwordPolicy.js`)

## CORS
- Explicit allowlist in `index.js`: `[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]`
- `credentials: true`
- No wildcards in any environment

## CSRF
- Defense: `sameSite=strict` on all auth cookies + `Authorization: Bearer` is **not** accepted by the server.
- A double-submit token can be added later if cross-site flows become necessary.

## Role Matrix

| Action | Patient | Psychiatrist | Admin |
|---|---|---|---|
| Take assessment | ✅ | ❌ | ❌ |
| Read own report | ✅ | own patients only | ✅ all |
| Book consultation | ✅ | ❌ | ❌ |
| Approve psychiatrist | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ✅ |

## Rate Limits (`middleware/rateLimit.js`)
- `globalLimiter` — 200/min/IP
- `authLimiter` — 10/15min/IP on login, register, change-password
- `otpLimiter` — 5/15min/IP on verify-otp, resend-otp
- `passwordResetLimiter` — 5/hour/IP on forgot-password, reset-password
- Per-account OTP attempt counter on the model (`OTP_MAX_ATTEMPTS = 5`); exceeding locks the OTP until expiry.

## Admin provisioning
- **No public admin self-register endpoint.**
- Provision new admins on the host with `node server/scripts/seed-admin.js --email=… --name=… --password='…'`.
