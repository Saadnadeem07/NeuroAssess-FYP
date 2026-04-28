# Architecture

High-level system diagram, request lifecycle (client → nginx → express → mongo), module boundaries.

## Request Lifecycle (target)

```
Browser → (Vercel CDN / Nginx) → React SPA
                              → /api/* → Nginx reverse proxy → Express → Service → Mongoose → MongoDB
```

## Module Boundaries (target)

- `routes/` — URL wiring + middleware only
- `controllers/` — req/res shaping; calls services
- `services/` — all business logic and DB access
- `models/` — Mongoose schemas
- `middleware/` — cross-cutting concerns (auth, validation, error handling, rate limit)
- `utils/` — pure helpers, no I/O

> See `BUG_REPORT.md` for the gap between target architecture and current state.
