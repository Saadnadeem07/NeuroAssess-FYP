# API Conventions

- **Base URL:** `/api`
- **Versioning:** none yet — when needed, prefix with `/api/v1`
- **Success response:** `{ success: true, data: T, message?: string }`
- **Error response:** `{ success: false, error: string, statusCode: number }`
- **Pagination:** `{ data: T[], total: number, page: number, limit: number }`
- **Filtering:** query string params, parsed and validated server-side; never spread directly into Mongo `find`.
- **HTTP status codes:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests, 500 Server Error.
