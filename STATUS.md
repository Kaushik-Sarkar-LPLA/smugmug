# SmugMug Migration — Status

**Last updated:** 2026-06-14 (UTC) — **pixilens.com is LIVE!**  
**Repo:** `/Users/kauushiksarkar/MacGithub/smugmug` → `https://github.com/pixilensphoto-tech/smugmug`  
**Server:** `ssh priyanka`  
**Migrator path:** `/home/priyanka/pixilens-smugmug-migrator`  
**Admin data:** `/home/priyanka/pixilens-smugmug-admin/data` (~17 GB photo originals + videos)

---

## Pick up here (next session)

### 1. Check if migration worker is running

```bash
ssh priyanka "pgrep -af 'node scripts/smugmug-migrate-worker'"
ssh priyanka "cd /home/priyanka/pixilens-smugmug-migrator && npm run migrate:smugmug -- --progress=true"
```

### 2. If stopped, resume from last completed album

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && nohup npm run migrate:smugmug -- --resume=true --delayMs=2500 --smugDelayMs=750 >> migration.log 2>&1 &'
```

`--resume=true` reads `completedAlbumIndex` from Postgres and skips finished albums.

### 3. When migration finishes, run full audit

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && node scripts/compare-smugmug-migration.js > compare-report.json 2>compare.log; echo EXIT:$?'
```

Exits **0** only if SmugMug eligible content matches DB (skipped `/Automatic-iOS-Uploads` excluded).

### 4. Deploy app after migration milestones

See [Deployment Flow](#deployment-flow) below. Always deploy both priyanka + Azure Coolify apps.

**If deploy or upload fails:** read [`DEPLOYMENT.md`](./DEPLOYMENT.md) — known Coolify/IMGBB/Alpine build failures and fixes.

---

## Live migration state (2026-05-31 ~18:23 UTC)

| Item | Value |
|------|-------|
| **Worker** | **Running** — PID 2173200, mode `--resume=true` |
| **Albums completed** | **575 / 636** eligible |
| **Current album** | [Joci2018Jan](https://www.pixilens.com/Joci2018Jan) (album index 576) |
| **Photos imported this run** | 270 (and counting) |
| **Run errors this session** | 0 |

### Database totals

| Metric | Count |
|--------|------:|
| **Galleries** | 578 |
| **Folders** | 83 |
| **Media done** | 82,367 |
| **Media done (compressed + local original)** | 478 |
| **Media errors** | 2 |
| **Total in DB** | 82,847 |

### SmugMug scope (eligible, not skipped)

| Metric | Count |
|--------|------:|
| **Total SmugMug albums** | 2,702 |
| **Skipped albums** | 2,066 (`/Automatic-iOS-Uploads`) |
| **Eligible albums** | 636 |
| **Eligible photos on SmugMug** | ~103,236 |
| **Still to migrate (approx)** | ~20,400 photos across ~60 albums |

---

## What happened (timeline)

1. **Main migration** ran through album **573/636** then crashed (`ENETUNREACH` DB blip).
2. **Errors-only retry** (`--errorsOnly=true`) fixed **479/481** failed photos using sharp compression before ImgBB upload. **2** remain (SmugMug temp-file errors).
3. **Audit** (`npm run compare:smugmug`) found **62 entire galleries** never imported (mostly 2016–2018 content at end of SmugMug API album order) + **55 partial** photos in Ennoir-RM67-FS-2018.
4. **Resume run started** 2026-05-31 ~17:50 UTC with `--resume=true` from album index 573:
   - Finished **Ennoir-RM67-FS-2018** (55 photos)
   - Finished **Caroline** (81 photos)
   - In progress: **Joci2018Jan** and remaining ~60 galleries

Full list of originally missing 62 galleries: `compare-audit-report.json` in repo root.

---

## Remaining known errors (2 photos)

SmugMug server-side temp file failure — not size-related. Retry unlikely unless SmugMug source is fixed.

| Gallery | Image URL |
|---------|-----------|
| [samantha-2seelife-Aug-2020](https://www.pixilens.com/2Seelife/n-GnTWCB/OldPhotos/Samantha-2seelife-Aug-2020) | https://www.pixilens.com/2Seelife/n-GnTWCB/OldPhotos/Samantha-2seelife-Aug-2020/i-fLZfjRT |
| [1](https://www.pixilens.com/2Seelife/n-GnTWCB/2seelife-Aug-2020/1) | https://www.pixilens.com/2Seelife/n-GnTWCB/2seelife-Aug-2020/1/i-JtCBtvM |

---

## Migration scripts

| Command | Purpose |
|---------|---------|
| `npm run migrate:smugmug -- --progress=true` | Show DB counts + worker state |
| `npm run migrate:smugmug -- --resume=true --delayMs=2500 --smugDelayMs=750` | Resume from `completedAlbumIndex` |
| `npm run migrate:smugmug -- --errorsOnly=true` | Retry only `migration_status=error` rows |
| `npm run compare:smugmug` | Full SmugMug vs DB audit (exit 1 if gaps) |

Worker flags: `--startAlbumIndex=N`, `--retryErrors=true`, `--pathPrefix=/Foo`, `--limitAlbums=N`

### Compression (since commit `5e6fc31`)

Oversized originals (>32 MB) are resized with **sharp** (3000px max, quality 85) before ImgBB upload. Full originals archived to `photo-originals/` on priyanka (~17 GB).

---

## Live Sites (2026-06-14)

> ⚠️ **pixilens.com is now PRODUCTION** — cutover complete!

| Site | URL | Coolify App | Status |
|------|-----|-------------|--------|
| **Production** | https://pixilens.com | Same as smugmug-az! | **LIVE** ✅ |
| **Production** | https://www.pixilens.com | Same as smugmug-az! | **LIVE** ✅ |
| **Staging** | https://smugmug.pixilens.online | Docker `smugmug-managed` :3010 | Active |
| **Azure copy** | https://smugmug-az.pixilens.online | Coolify `l08cogcggk4oksg0kwwos44k` | Active |

### Same Container!
All three domains (`pixilens.com`, `www.pixilens.com`, `smugmug-az.pixilens.online`) point to **one** Coolify app: `pixilens-smugmug-azure` (`l08cogcggk4oksg0kwwos44k`).

### DNS Status

| Domain | Target | Indexing |
|--------|--------|----------|
| `pixilens.com` | Azure IP `9.234.42.243` | `index, follow` (production!) |
| `smugmug.pixilens.online` | Cloudflare → priyanka | Staging |

### Admin Access

- https://pixilens.com/admin (main production admin)
- https://smugmug.pixilens.online/admin (staging admin)

Legacy (verify if still needed):
- https://smugmug-az.pixilens.online/admin/galleries

### Troubleshooting

**→ [`DEPLOYMENT.md`](./DEPLOYMENT.md)** — IMGBB missing, Coolify Dockerfile parse errors, Turbopack/Alpine build failures, env sync issues, upload 500s, priyanka vs Azure drift.

### Recent app features (deployed)

- Hero spacing fix, Fashion portfolio redirect (`/Lifestyle` → `pixilens-portfolio-lifestyle`)
- Admin upload: ImgBB compression + resilient retries; `insertMediaRecord` (no full-library rewrite)
- IMGBB + DB env on Coolify local app `a4gcggkck44cokoc08os84sw`
- Gallery browse: covers, lightbox, download; hide Automatic iOS Uploads
- Admin galleries paginated; portfolio DB-backed covers

---

## Azure DB connection

Azure PostgreSQL (`150.220.93.109:6767`) requires SSL client certs for `grabber_user`.

- Certs mounted at `/home/priyanka/pixilens-smugmug-admin/certs` → container `/app/certs`
- Env: `SSL_CERTS_DIR=/app/certs`, `POSTGRES_SSLMODE=require`
- Azure Coolify app has base64 `SSL_CA`, `SSL_CERT`, `SSL_KEY` env vars — verify if Azure portfolio still falls back to static JSON

---

## Deployment flow

Always deploy both simultaneously:

```bash
# Pull latest on priyanka migrator + rebuild priyanka container
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && sudo docker build -t pixilens-smugmug:latest . && sudo docker rm -f smugmug-managed && sudo docker run -d --name smugmug-managed --restart unless-stopped --network coolify -p 3010:3000 --env-file /home/priyanka/pixilens-smugmug-admin/.env -e MEDIA_ROOT=/admin-data/media -e ADMIN_DATA_DIR=/admin-data -v /home/priyanka/pixilens-smugmug-admin/data:/admin-data -v /home/priyanka/pixilens-smugmug-admin/certs:/app/certs --label traefik.enable=true --label traefik.http.middlewares.gzip.compress=true --label traefik.http.routers.http-0-smugmug-managed.entryPoints=http --label traefik.http.routers.http-0-smugmug-managed.middlewares=gzip --label traefik.http.routers.http-0-smugmug-managed.rule="Host(\`smugmug.pixilens.online\`) && PathPrefix(\`/\`)" --label traefik.http.routers.http-0-smugmug-managed.service=http-0-smugmug-managed --label traefik.http.services.http-0-smugmug-managed.loadbalancer.server.port=3000 pixilens-smugmug:latest'

# Azure Coolify
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

Coolify apps:

| App | UUID |
|-----|------|
| `pixilens-smugmug-azure` | `l08cogcggk4oksg0kwwos44k` |
| `pixilens-smugmug` (local) | `a4gcggkck44cokoc08os84sw` |

---

## Deployment Workflow (Post-Cutover)

> ⚠️ **Deploy is via GitHub push** — Coolify auto-deploys from `main` branch!

### Deploy to production (GitHub push)

```bash
# 1. Test locally first
npm run build
curl -I http://localhost:3000

# 2. Push to GitHub - ALL THREE sites auto-deploy!
git add . && git commit -m "Your changes" && git push origin main

# Wait ~2-5 minutes for Coolify build + deploy
# Updates: pixilens.com, www.pixilens.com, smugmug-az.pixilens.online
```

### Deploy to staging (priyanka Docker - for pre-release testing)

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && \
  sudo docker build -t pixilens-smugmug:latest . && \
  sudo docker rm -f smugmug-managed && \
  sudo docker run -d --name smugmug-managed --restart unless-stopped --network coolify \
    -p 3010:3000 \
    --env-file /home/priyanka/pixilens-smugmug-admin/.env \
    -e MEDIA_ROOT=/admin-data/media -e ADMIN_DATA_DIR=/admin-data \
    -e NEXT_PUBLIC_SITE_URL=https://smugmug.pixilens.online \
    -v /home/priyanka/pixilens-smugmug-admin/data:/admin-data \
    -v /home/priyanka/pixilens-smugmug-admin/certs:/app/certs \
    --label traefik.enable=true \
    --label "traefik.http.routers.http-0-smugmug-managed.rule=Host(\`smugmug.pixilens.online\`)" \
    --label traefik.http.services.http-0-smugmug-managed.loadbalancer.server.port=3000 \
    pixilens-smugmug:latest'
```

### Smoke Test Commands

```bash
# Check both sites respond
curl -sI https://pixilens.com | head -1
curl -sI https://smugmug.pixilens.online | head -1

# Check admin works
curl -sI https://pixilens.com/admin | grep location

# Check specific pages
curl -sI https://pixilens.com/Pixilens-Portfolio | grep -E '^HTTP'
```

## Monitor migration

```bash
# Worker process
ssh priyanka "pgrep -af smugmug-migrate-worker"

# Progress JSON
ssh priyanka "cd /home/priyanka/pixilens-smugmug-migrator && npm run migrate:smugmug -- --progress=true"

# Log tail
ssh priyanka "tail -f /home/priyanka/pixilens-smugmug-migrator/migration.log"

# Failed items CSV (from last errors-only run)
ssh priyanka "wc -l /home/priyanka/pixilens-smugmug-admin/failed-migration-report.csv"
```

---

## File structure

```
smugmug/
├── STATUS.md                         ← THIS FILE — current state, read first
├── DEPLOYMENT.md                     ← Deploy failures, IMGBB, Coolify, env fixes
├── MIGRATION.md                      ← Full migration plan
├── compare-audit-report.json         ← Last audit (62 missing galleries snapshot)
├── scripts/
│   ├── smugmug-migrate-worker.js   ← Main worker (resume, errorsOnly, compression)
│   └── compare-smugmug-migration.js← SmugMug vs DB audit
├── app/
│   ├── Pixilens-Portfolio/           ← Public portfolio (DB-backed)
│   ├── admin/galleries|media|...     ← Admin UI
│   └── Booking-Form/                 ← Calendar invite on submit
├── lib/admin/                        ← DB, library-store
└── components/GalleryGrid.tsx        ← Lightbox + portrait grid
```

---

## Key env vars (priyanka)

```
DATABASE_URL=postgresql://grabber_user:***@150.220.93.109:6767/grabber_db
DATABASE_SCHEMA=pixilens_smugmug
SSL_CERTS_DIR=/home/priyanka/pixilens-smugmug-admin/certs
POSTGRES_SSLMODE=require
IMGBB_API_KEY=...
SMUGMUG_API_KEY / SMUGMUG_API_SECRET / SMUGMUG_ACCESS_TOKEN / SMUGMUG_ACCESS_TOKEN_SECRET
SMUGMUG_SKIP_PATHS=/Automatic-iOS-Uploads
ADMIN_DATA_DIR=/home/priyanka/pixilens-smugmug-admin/data
MEDIA_ROOT=/home/priyanka/pixilens-smugmug-admin/data/media
```

---

## Skip policy

Only `/Automatic-iOS-Uploads` is excluded (2,066 albums, ~32,157 photos). Everything else under the 636 eligible albums should migrate.
