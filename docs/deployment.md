# Deployment

## Dev
```
docker compose -f docker-compose.dev.yml up
```
- `client` on http://localhost:3000 (Vite dev server, hot-reload)
- `server` on http://localhost:5000 (nodemon, hot-reload)
- `mongodb` on localhost:27017

## Prod
```
docker compose -f docker-compose.prod.yml up -d
```
- All traffic enters via Nginx (port 80/443)
- `/api/*` → server container
- `/*` → client static build

## First-time setup
```
cp server/.env.dev.example server/.env.dev
# Fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, EMAIL_*, HUGGING_FACE_*
```

## Required Env Vars

### server
`PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRE`, `JWT_REFRESH_EXPIRE`, `FRONTEND_URL`, `NODE_ENV`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `HUGGING_FACE_API_URL`, `HUGGING_FACE_API_KEY`

## Provisioning the first admin
```
cd server
node scripts/seed-admin.js --email=admin@example.com --name='First Admin' --password='S3cur3Pass!'
```
There is no public admin self-register endpoint.

### client
`VITE_API_URL`

## Nginx Routing
- `location /api/`  → `proxy_pass http://server:5000`
- `location /`      → serve client `dist/`

## Production Checklist
- [ ] All `.env*` files outside the repo (CI secrets only)
- [ ] MongoDB **not** exposed publicly (no `ports:` mapping in prod compose)
- [ ] Container images pinned to specific versions, never `:latest`
- [ ] Healthchecks defined per container
- [ ] Resource limits (memory/cpu) set per container
- [ ] HSTS, CSP, X-Frame-Options, X-Content-Type-Options set in Nginx
- [ ] Backup strategy for MongoDB volume

## Rollback
1. `docker compose -f docker-compose.prod.yml pull <previous-tag>`
2. `docker compose -f docker-compose.prod.yml up -d`
3. Verify `/api/health` and main routes
