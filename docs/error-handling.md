# Error Handling

## Pattern
- Throw `AppError(message, statusCode, code, details?)` from anywhere in the request stack.
- Wrap async route/controller handlers with `asyncHandler` from `utils/asyncHandler.js` so errors propagate to `next(err)`.
- The single `errorHandler` middleware (`middleware/errorHandler.js`) shapes every response and is registered last.

## Helper constructors
`AppError.badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `unprocessable`.

## Response shape
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "AUTH_INVALID_CREDENTIALS",
  "statusCode": 401,
  "requestId": "uuid",
  "details": {...optional...}
}
```

In production, unknown 5xx errors return a generic message; full stack is logged server-side with `requestId`.

## Stable error codes (`utils/errorCodes.js`)
- `AUTH_INVALID_CREDENTIALS` — 401
- `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` — 401
- `AUTH_FORBIDDEN` — 403
- `AUTH_EMAIL_NOT_VERIFIED` — 403
- `AUTH_NOT_APPROVED` — 403
- `AUTH_OTP_INVALID` / `AUTH_OTP_EXPIRED` / `AUTH_OTP_LOCKED` — 401
- `AUTH_REFRESH_REUSED` — 401
- `RESOURCE_NOT_FOUND` — 404
- `RESOURCE_CONFLICT` — 409
- `VALIDATION_FAILED` — 422
- `RATE_LIMIT_EXCEEDED` — 429
- `UPLOAD_INVALID` — 400
- `INTERNAL_SERVER_ERROR` — 500

## UI display rules
- 401 with `AUTH_TOKEN_EXPIRED` → axios interceptor calls `/auth/refresh` once, retries; if it fails, dispatches `auth:logout`.
- 401 other → toast + redirect to login.
- 403 → toast "You don't have permission".
- 404 → inline empty state.
- 422 → field-level errors from `details[]`.
- 429 → toast "Too many requests".
- 5xx → toast "Something went wrong" + retry.
