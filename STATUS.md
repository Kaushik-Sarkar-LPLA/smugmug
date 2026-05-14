# SmugMug Migration — Status

## Deployments

| Site | URL | Status | Portfolio |
|---|---|---|---|
| Priyanka (local) | `smugmug.pixilens.online` | ✅ Container running | 12 galleries from DB (ImgBB CDN) |
| Azure | `smugmug-az.pixilens.online` | ✅ Container running | Static fallback (SmugMug URLs) |

## Migration Progress

- Albums: 97 / 636 completed (2,702 total, 2,066 skipped)
- Media done in DB: 22,143
- Media errors: 1,188
- Migration worker running in background (PID 1065159 on priyanka)

## Portfolio UI (Implemented)

- **Main page**: 12 portrait `aspect-[3/4]` gallery cards with "View Gallery" hover button
- **Gallery detail**: `grid-cols-2/3/4/5` portrait thumbnails with "View image" hover
- **Lightbox**: Full-screen overlay with prev/next navigation, keyboard support (Esc, arrows), image counter

## Azure DB Connection Issue

Azure PostgreSQL (`150.220.93.109:6767`) requires SSL client certs. The `grabber_user` account uses `cert` authentication.

### Current state
- `DATABASE_URL`, `DATABASE_SCHEMA`, `SSL_MODE` env vars set on Coolify app
- `SSL_CA`, `SSL_CERT`, `SSL_KEY` (base64) env vars set on Coolify app
- SSL certs present in `db.ts` code (reads from env vars or `SSL_CERTS_DIR`)
- **Still failing**: Azure container may not be receiving the env vars, or the base64 values may be too long for Coolify env vars

### Grabber-Azure-Primary
- Connects to the same DB successfully with `POSTGRES_SSLMODE=require`
- How it gets the certs is unclear (no `SSL_CERTS_DIR` visible in its env)

## Deployment Flow

Always deploy both simultaneously:
```bash
# Priyanka
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && sudo docker build -t pixilens-smugmug:latest . && sudo docker rm -f smugmug-managed && sudo docker run -d --name smugmug-managed --restart unless-stopped --network coolify -p 3010:3000 --env-file /home/priyanka/pixilens-smugmug-admin/.env -e MEDIA_ROOT=/admin-data/media -e ADMIN_DATA_DIR=/admin-data -v /home/priyanka/pixilens-smugmug-admin/data:/admin-data -v /home/priyanka/pixilens-smugmug-admin/certs:/app/certs --label traefik.enable=true --label traefik.http.middlewares.gzip.compress=true --label traefik.http.routers.http-0-smugmug-managed.entryPoints=http --label traefik.http.routers.http-0-smugmug-managed.middlewares=gzip --label traefik.http.routers.http-0-smugmug-managed.rule="Host(\`smugmug.pixilens.online\`) && PathPrefix(\`/\`)" --label traefik.http.routers.http-0-smugmug-managed.service=http-0-smugmug-managed --label traefik.http.services.http-0-smugmug-managed.loadbalancer.server.port=3000 pixilens-smugmug:latest'

# Azure
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

## File Structure

```
smugmug/
├── app/
│   ├── Pixilens-Portfolio/
│   │   ├── page.tsx              → Main portfolio page (12 gallery cards)
│   │   └── [slug]/page.tsx       → Gallery detail with GalleryGrid
│   ├── portfolio-data.json       → Static fallback (SmugMug URLs)
│   └── api/
│       └── debug-env/route.ts    → Debug endpoint for env vars
├── components/
│   ├── GalleryGrid.tsx           → Client component: grid + hover + lightbox
│   └── GalleryLightbox.tsx       → Client component: full-screen viewer
├── lib/
│   ├── portfolio-db.ts           → Queries DB, falls back to static JSON
│   ├── admin/
│   │   ├── db.ts                 → SSL config, pool, schema helpers
│   │   └── library-store.ts      → getLibrary() fetches folders/galleries/media
│   └── portfolio.ts              → Old static portfolio helper
├── scripts/
│   ├── smugmug-migrate-worker.js → Main migration worker
│   ├── imgbb-cli.js
│   ├── migrate-json-to-postgres.js
│   └── migrate-priority-imgbb.js
└── MIGRATION.md                  → Full migration plan (631 lines)
```

## Key Env Vars (priyanka container)

```
DATABASE_URL=postgresql://grabber_user:***@150.220.93.109:6767/grabber_db
DATABASE_SCHEMA=pixilens_smugmug
SSL_CERTS_DIR=/app/certs
POSTGRES_SSLMODE=require
```

## Key Env Vars (Azure Coolify app)

```
DATABASE_URL=postgresql://grabber_user:***@150.220.93.109:6767/grabber_db?sslmode=require
DATABASE_SCHEMA=pixilens_smugmug
SSL_MODE=require
SSL_CA=<base64 ca.crt>
SSL_CERT=<base64 client_grabber_user.crt>
SSL_KEY=<base64 client_grabber_user.key>
```
