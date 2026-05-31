# Deployment — known issues & troubleshooting

> Read this when a deploy fails, uploads break, or priyanka vs Azure behave differently.  
> For live migration progress see [`STATUS.md`](./STATUS.md).

**Last updated:** 2026-05-31 (UTC)

---

## Sites & how they run

| Site | URL | How it runs | Notes |
|------|-----|-------------|-------|
| **Priyanka (primary)** | https://smugmug.pixilens.online | Manual Docker container `smugmug-managed` on port **3010**, Traefik labels | **This is what most users hit.** Rebuild with commands below. |
| **Azure** | https://smugmug-az.pixilens.online | Coolify app `pixilens-smugmug-azure` | Builds on `Azure-UBKS-Server`. Can lag if Coolify deploy fails. |
| **Coolify local** | Same FQDN as priyanka in Coolify UI | App `pixilens-smugmug` | Shares domain with manual Docker — env must stay in sync. |

### Coolify app UUIDs

| App | UUID |
|-----|------|
| `pixilens-smugmug-azure` | `l08cogcggk4oksg0kwwos44k` |
| `pixilens-smugmug` (local) | `a4gcggkck44cokoc08os84sw` |

Coolify CLI (from priyanka):

```bash
/home/priyanka/go/bin/coolify --context Coolify1 app get l08cogcggk4oksg0kwwos44k
/home/priyanka/go/bin/coolify --context Coolify1 app deployments list l08cogcggk4oksg0kwwos44k
/home/priyanka/go/bin/coolify --context Coolify1 app deployments logs l08cogcggk4oksg0kwwos44k [deployment-uuid]
```

---

## Quick “is it deployed?” check

```bash
# Latest commit on GitHub / server
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git log -1 --oneline'

# Priyanka container
ssh priyanka 'sudo docker ps --filter name=smugmug-managed --format "{{.Status}} {{.Image}}"'

# Azure Coolify — last deploy status + commit
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app deployments list l08cogcggk4oksg0kwwos44k | head -5'

# Smoke test both sites (example: fashion redirect added in accec3c)
curl -sI https://smugmug.pixilens.online/Pixilens-Portfolio/Lifestyle | grep -iE '^HTTP|^location'
curl -sI https://smugmug-az.pixilens.online/Pixilens-Portfolio/Lifestyle | grep -iE '^HTTP|^location'
# Expect: HTTP 308 + location: /Pixilens-Portfolio/pixilens-portfolio-lifestyle
```

**Do not assume Azure is current just because priyanka is.** Coolify deploys can fail while manual Docker succeeds.

---

## Known failures (symptom → cause → fix)

### 1. Admin upload: `IMGBB_API_KEY is missing`

| | |
|--|--|
| **Symptom** | `Upload failed: IMGBB_API_KEY is missing` (500 on `/api/admin/media`) |
| **Cause** | Coolify app had **no env vars** (local app `a4gcggkck44cokoc08os84sw` started with empty env). Manual Docker uses `--env-file` and was fine. |
| **Fix** | Copy env from admin `.env` into Coolify apps. Required keys listed [below](#required-env-vars). |
| **Verify** | `sudo docker exec smugmug-managed printenv IMGBB_API_KEY \| wc -c` → expect **33** (32-char key + newline) |

```bash
# Add one key (repeat for each missing key)
set -a; source /home/priyanka/pixilens-smugmug-admin/.env; set +a
/home/priyanka/go/bin/coolify --context Coolify1 app env create a4gcggkck44cokoc08os84sw \
  --key IMGBB_API_KEY --value "$IMGBB_API_KEY" --is-literal

# Or sync whole file (Azure) — may warn on bulk update; see #3
/home/priyanka/go/bin/coolify --context Coolify1 app env sync l08cogcggk4oksg0kwwos44k \
  --file /home/priyanka/pixilens-smugmug-admin/.env --is-literal
```

**Env file path:** `/home/priyanka/pixilens-smugmug-admin/.env`

---

### 2. Coolify build: Dockerfile parse error on `IMGBB_API_KEY` line

| | |
|--|--|
| **Symptom** | `dockerfile parse error on line N: unknown instruction: ecf9af8...` (garbage line after `ARG IMGBB_API_KEY=`) |
| **Cause** | Coolify injects build-time `ARG` from env. A **corrupted or quoted** `IMGBB_API_KEY` value breaks the generated Dockerfile (e.g. stray `'` in value or duplicate/malformed entry). |
| **Fix** | 1) Ensure key in `.env` is **plain 32 chars, no wrapping quotes**. 2) Recreate env with `--is-literal`. 3) Redeploy. |
| **Check** | `grep '^IMGBB_API_KEY=' /home/priyanka/pixilens-smugmug-admin/.env` — only **one** line; value must not contain `'` |

```bash
# Deduplicate if duplicated
cd /home/priyanka/pixilens-smugmug-admin
awk -F= '/^IMGBB_API_KEY=/{if(seen++) next} {print}' .env > .env.tmp && mv .env.tmp .env
```

---

### 3. Coolify build: `Turbopack is not supported on this platform`

| | |
|--|--|
| **Symptom** | `npm run build` fails in Docker: `Turbopack is not supported on this platform (linux/x64)... Use Webpack instead: next build --webpack` |
| **Cause** | Coolify builds on **Alpine** (`node:22-alpine`). Next.js 16 defaults to Turbopack for `next build`, which needs native SWC bindings not available in that image. |
| **Fix** | `package.json` must use `"build": "next build --webpack"` (since commit **`52a4375`**). |
| **Note** | Priyanka manual `docker build` may **appear** to succeed from **cache** without re-running `npm run build`. Azure always does a fresh build — catches this first. |

---

### 4. Coolify `env sync` bulk update fails

| | |
|--|--|
| **Symptom** | `Bulk update failed: failed to unmarshal response...` / `Sync complete: 0 updated, N created, M failed` |
| **Cause** | Coolify CLI/API bug on bulk env update (observed 2026-05-31). |
| **Workaround** | Use `app env create` per missing key, or `app env update <app_uuid> <env_uuid> --value ... --is-literal` for single vars. New vars from sync may still **create** successfully. |

---

### 5. Admin upload: 500 / timeout (no IMGBB error)

| | |
|--|--|
| **Symptom** | POST `/api/admin/media` returns 500, container logs show memory/timeout or DB slowness |
| **Cause** | Old code called `getLibrary()` + `saveLibrary()` on **every upload**, reloading ~83k media rows. |
| **Fix** | Use `insertMediaRecord()` for single inserts (since ~`01cf358`). Pull latest and redeploy. |

---

### 6. Upload fails: ImgBB “file too big” / network

| | |
|--|--|
| **Symptom** | Intermittent upload failures, ImgBB errors in logs |
| **Cause** | Large originals (>32 MB), ImgBB rate limits, transient network |
| **Fix** | `lib/admin/imgbb-upload.ts` — sharp compression + retries. Migration worker uses same pattern (`5e6fc31`). |
| **Runtime** | `IMGBB_API_KEY` must be set in **running** container, not only at build time. |

---

### 7. Azure live, priyanka live — but different behaviour

| | |
|--|--|
| **Symptom** | Feature works on `smugmug.pixilens.online` but not `smugmug-az.pixilens.online` (or reverse) |
| **Cause** | Azure Coolify deploy **failed**; old container still serving. Common after failed builds (#2, #3). |
| **Fix** | Check `app deployments list` — status must be **`finished`** with same commit as `git log -1`. Fix root cause, then `app start ... --force --instant-deploy`. |

---

### 8. Frontend: hero text overlaps menu

| | |
|--|--|
| **Symptom** | “Photography • Video • Live Streaming • Photobooth” sits under logo/nav on homepage |
| **Cause** | Floating header is `absolute`; hero used `justify-center` with too little top padding (`pt-28`). |
| **Fix** | Larger top padding + `justify-start` on mobile (commit **`855849c`**, `app/page.tsx`). |

---

### 9. Fashion portfolio legacy URL empty

| | |
|--|--|
| **Symptom** | `/Pixilens-Portfolio/Lifestyle` shows almost empty page; `/Pixilens-Portfolio/pixilens-portfolio-lifestyle` works |
| **Cause** | SmugMug used short slug `Lifestyle`; DB gallery slug is `pixilens-portfolio-lifestyle`. |
| **Fix** | Redirect in `next.config.ts` + slug aliases in `lib/portfolio-db.ts` (commit **`accec3c`**). Display title: **Fashion & Products**. |

---

### 10. Migration worker stopped mid-run

| | |
|--|--|
| **Symptom** | Audit shows dozens of **whole galleries** missing though most photos migrated |
| **Cause** | Worker crashed (`ENETUNREACH` to Azure Postgres) at album ~573/636; errors-only mode does **not** import new albums. |
| **Fix** | `npm run migrate:smugmug -- --resume=true --delayMs=2500 --smugDelayMs=750` — see [`STATUS.md`](./STATUS.md). |

---

## Required env vars

**Priyanka manual Docker** — from `/home/priyanka/pixilens-smugmug-admin/.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Azure Postgres connection string |
| `DATABASE_SCHEMA` | `pixilens_smugmug` |
| `SSL_CERTS_DIR` / `POSTGRES_SSLMODE` | Client certs for Azure PG (`require`) |
| `IMGBB_API_KEY` | Photo uploads + migration ImgBB |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` | Admin auth |
| `MS_GRAPH_*` | Form email (booking, etc.) |
| `ADMIN_DATA_DIR` / `MEDIA_ROOT` | Local media + homepage config (set in `docker run -e`) |

**Azure Coolify** also needs base64 **`SSL_CA`**, **`SSL_CERT`**, **`SSL_KEY`** (already configured).  
**Do not commit** secrets to git.

---

## Deploy commands (copy-paste)

### Priyanka — manual Docker (primary site)

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && \
  sudo docker build -t pixilens-smugmug:latest . && \
  sudo docker rm -f smugmug-managed && \
  sudo docker run -d --name smugmug-managed --restart unless-stopped --network coolify \
    -p 3010:3000 \
    --env-file /home/priyanka/pixilens-smugmug-admin/.env \
    -e MEDIA_ROOT=/admin-data/media \
    -e ADMIN_DATA_DIR=/admin-data \
    -v /home/priyanka/pixilens-smugmug-admin/data:/admin-data \
    -v /home/priyanka/pixilens-smugmug-admin/certs:/app/certs \
    --label traefik.enable=true \
    --label traefik.http.middlewares.gzip.compress=true \
    --label traefik.http.routers.http-0-smugmug-managed.entryPoints=http \
    --label traefik.http.routers.http-0-smugmug-managed.middlewares=gzip \
    --label traefik.http.routers.http-0-smugmug-managed.rule="Host(\`smugmug.pixilens.online\`) && PathPrefix(\`/\`)" \
    --label traefik.http.routers.http-0-smugmug-managed.service=http-0-smugmug-managed \
    --label traefik.http.services.http-0-smugmug-managed.loadbalancer.server.port=3000 \
    pixilens-smugmug:latest'
```

### Azure — Coolify

```bash
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

### Local Coolify app (if used)

```bash
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start a4gcggkck44cokoc08os84sw --force --instant-deploy'
```

After any env change on Coolify, **redeploy** so runtime picks up new values.

---

## Useful log commands

```bash
# App container (priyanka)
ssh priyanka 'sudo docker logs smugmug-managed --tail 100'

# Azure app runtime
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app logs l08cogcggk4oksg0kwwos44k --lines 100'

# Failed Coolify build — use deployment UUID from deployments list
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app deployments logs l08cogcggk4oksg0kwwos44k <deployment-uuid>'
```

---

## Commit reference (recent fixes)

| Commit | Fix |
|--------|-----|
| `52a4375` | `next build --webpack` for Alpine/Coolify builds |
| `accec3c` | Fashion portfolio redirect + display title |
| `855849c` | Hero spacing under floating nav |
| `01cf358` | Admin upload compression + `insertMediaRecord` |
| `5e6fc31` | Migration worker sharp compression before ImgBB |
