# Pixilens — Current Status

**Last updated:** 2026-06-14  
**Repo:** `https://github.com/pixilensphoto-tech/smugmug` (local: `/Users/kauushiksarkar/MacGithub/smugmug`)  
**Server:** `ssh priyanka`

---

## Pick up here (next session)

1. **Check CDN migration progress** — 102k display images downloading from ImgBB → priyanka disk:
   ```bash
   ssh priyanka 'tail -3 /home/priyanka/pixilens-cdn/migration.log'
   # Or DB count:
   # ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && node -e "..."'
   ```

2. **When migration finishes** (~4-6 hrs from 2026-06-14 evening) — restart smugmug-managed to flush DB cache:
   ```bash
   ssh priyanka 'sudo docker restart smugmug-managed'
   ```

3. **Site health check:**
   ```bash
   curl -sI https://pixilens.com | head -1         # should be 200
   curl -sI https://cdn.pixilens.online/media_036f257ac6f7858f.jpg | grep cf-cache  # should be HIT
   ```

---

## Live Sites

| URL | Served from | Status |
|-----|-------------|--------|
| https://pixilens.com | `smugmug-managed` on priyanka via Cloudflare tunnel | ✅ LIVE (production) |
| https://www.pixilens.com | Same container | ✅ LIVE |
| https://smugmug.pixilens.online | Same container, different domain | ✅ LIVE (staging) |
| https://cdn.pixilens.online | `pixilens-cdn` nginx on priyanka | ✅ LIVE (image CDN) |
| https://smugmug-az.pixilens.online | Azure Coolify `l08cogcggk4oksg0kwwos44k` | ✅ LIVE (backup) |

### Admin Access

- https://pixilens.com/admin
- https://smugmug.pixilens.online/admin

---

## Infrastructure

### DNS

| Domain | Nameservers | Zone ID |
|--------|-------------|---------|
| `pixilens.com` | Cloudflare (`dee.ns.cloudflare.com`, `devin.ns.cloudflare.com`) | `ad8121673299a8103f1c3f519c4be6de` |
| `pixilens.online` | Cloudflare | `f3d7cc66aae06a642993797bd65bac5d` |

### Cloudflare Tunnel (`8f80f98f-2daf-4bd9-a37b-49285a212f00`)

Routes (all via `https://localhost:443` → Traefik on priyanka):
- `pixilens.com` → `smugmug-managed`
- `www.pixilens.com` → `smugmug-managed`
- `cdn.pixilens.online` → `pixilens-cdn` nginx
- All other `*.pixilens.online` → Traefik wildcard

**Managed by Coolify** — routes pushed automatically when apps deploy. `pixilens.com` registered in Coolify app `a4gcggkck44cokoc08os84sw`.

### Containers on priyanka

| Container | Image | Restart | Purpose |
|-----------|-------|---------|---------|
| `smugmug-managed` | `pixilens-smugmug:latest` | `unless-stopped` | App server (Next.js) |
| `pixilens-cdn` | `nginx:alpine` | `unless-stopped` | Static image CDN |

Both also managed by **`pixilens-containers.service`** systemd — auto-starts on boot after Docker.

Startup scripts:
- `/home/priyanka/pixilens-smugmug-admin/start-smugmug-managed.sh`
- `/home/priyanka/pixilens-cdn/start-cdn.sh`

### Coolify Apps

| App | UUID | Domains |
|-----|------|---------|
| `pixilens-smugmug` (priyanka) | `a4gcggkck44cokoc08os84sw` | pixilens.com, www.pixilens.com, smugmug.pixilens.online |
| `pixilens-smugmug-azure` (backup) | `l08cogcggk4oksg0kwwos44k` | smugmug-az.pixilens.online |

### Deploy flow

```bash
# Production deploy — push to GitHub, Coolify auto-builds Azure backup
git push origin main

# Priyanka (manual rebuild required after code changes)
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && \
  sudo docker build -t pixilens-smugmug:latest . && \
  /home/priyanka/pixilens-smugmug-admin/start-smugmug-managed.sh'
```

---

## CDN Migration (in progress)

Downloading display images from ImgBB → `/home/priyanka/pixilens-cdn/photos/` → served at `cdn.pixilens.online`.

| Metric | Value |
|--------|-------|
| Total photos | 102,065 |
| Migration started | 2026-06-14 ~19:35 UTC |
| Rate | ~6.5 images/sec |
| ETA | ~4-6 hours from start |
| Disk location | `/home/priyanka/pixilens-cdn/photos/` (~12 GB when complete) |
| Script | `scripts/migrate-display-to-cdn.js` |
| Log | `/home/priyanka/pixilens-cdn/migration.log` |

After migration: `display_url` in DB changes from `https://i.ibb.co/...` to `https://cdn.pixilens.online/...`.  
`public_url` (full resolution) stays on ImgBB — only loaded on lightbox click.

Monitor:
```bash
ssh priyanka 'tail -5 /home/priyanka/pixilens-cdn/migration.log'
ssh priyanka 'pgrep -af migrate-display-to-cdn'
```

Resume if stopped:
```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && \
  set -a && source /home/priyanka/pixilens-smugmug-admin/.env && set +a && \
  export SSL_CERTS_DIR=/home/priyanka/pixilens-smugmug-admin/certs && \
  export CDN_PUBLIC_URL=https://cdn.pixilens.online && \
  export CDN_DIR=/home/priyanka/pixilens-cdn/photos && \
  nohup node scripts/migrate-display-to-cdn.js >> /home/priyanka/pixilens-cdn/migration.log 2>&1 &'
```

---

## SmugMug Import (complete)

| Metric | Count |
|--------|------:|
| Galleries | 578 |
| Folders | 83 |
| Photos (ImgBB) | 102,065 |
| Videos (local) | 1,235 |
| Total media in DB | 103,300 |

2 photos permanently failed (SmugMug server-side temp file errors — not fixable).

---

## Database

Azure PostgreSQL at `150.220.93.109:6767`, schema `pixilens_smugmug`.  
Certs at `/home/priyanka/pixilens-smugmug-admin/certs`.

```
DATABASE_URL=postgresql://grabber_user:***@150.220.93.109:6767/grabber_db
DATABASE_SCHEMA=pixilens_smugmug
SSL_CERTS_DIR=/home/priyanka/pixilens-smugmug-admin/certs
```

---

## Videos

27 GB stored at `/home/priyanka/pixilens-smugmug-admin/data/media/videos/`.  
Served via `/api/media/[id]` — priyanka serves directly; Azure redirects to `smugmug.pixilens.online`.

---

## File structure

```
smugmug/
├── STATUS.md                          ← THIS FILE — read first
├── DEPLOYMENT.md                      ← Failures, troubleshooting, env vars
├── MIGRATION.md                       ← Original SmugMug migration plan
├── scripts/
│   ├── migrate-display-to-cdn.js      ← CDN migration (ImgBB → priyanka)
│   ├── smugmug-migrate-worker.js      ← SmugMug → DB import worker
│   └── compare-smugmug-migration.js   ← SmugMug vs DB audit
├── app/api/media/[id]/route.ts        ← Video serving (redirects Azure → priyanka)
├── app/                               ← Next.js pages/routes
├── lib/admin/                         ← DB, library-store, imgbb-upload
├── components/                        ← React components
└── next.config.ts                     ← Image remotePatterns (i.ibb.co, cdn.pixilens.online)
```
