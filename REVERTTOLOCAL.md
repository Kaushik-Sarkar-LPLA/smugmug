# Revert production to priyanka (local server)

> **Purpose:** Move `pixilens.com` from Azure Coolify back to the priyanka server while keeping galleries, legacy SmugMug URLs, admin, and SEO behavior identical.  
> **Related docs:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`MIGRATION.md`](./MIGRATION.md) · [`STATUS.md`](./STATUS.md)

**Last updated:** 2026-05-31

---

## When to use this plan

Use this runbook if you decide to:

- Point **`pixilens.com`** and **`www.pixilens.com`** at the **priyanka** server instead of Azure, or
- Make priyanka the **primary production** host again while keeping Azure as staging/DR.

This is a **DNS + Traefik + env var** change — not a content re-migration.

---

## Why gallery URLs still work

Gallery routing is **host-independent**. Both Azure and priyanka already use:

| Layer | Shared? | Notes |
|-------|---------|-------|
| Git repo (`main`) | Yes | Same Docker image |
| Azure Postgres (`pixilens_smugmug`) | Yes | Galleries, folders, `url_path` for redirects |
| ImgBB CDN | Yes | ~80k photos; URLs stored in DB |
| Legacy redirect handler | Yes | `app/[...smugmugPath]/route.ts` → DB lookup → 308 |
| New routes | Yes | `/galleries/{slug}`, `/folders/{slug}`, `/Pixilens-Portfolio/{slug}` |

**Priyanka advantage:** local videos, hero assets, and `photo-originals` live on priyanka disk (`/home/priyanka/pixilens-smugmug-admin/data`). Azure only runs the app container.

### URL behavior (unchanged after cutover)

| Visitor hits | Result |
|--------------|--------|
| `/Joci2018Jan` (old SmugMug) | 308 → `/galleries/joci2018jan` |
| `/2Seelife/n-GnTWCB` | 308 → `/folders/n-GnTWCB` |
| `/.../i-xxxxx` (old photo URL) | 308 → parent gallery |
| `/Pixilens-Portfolio/Lifestyle` | 308 → `/Pixilens-Portfolio/pixilens-portfolio-lifestyle` |
| `/galleries/joci2018jan` | Gallery page (direct) |

Paths not in the DB still 404 on **any** server — that is a data gap, not a hosting issue.

---

## Current vs target state

| | Today (Azure production) | After revert (priyanka production) |
|--|--------------------------|-------------------------------------|
| `pixilens.com` DNS | Azure IP `9.234.42.243` | **Priyanka public IP** |
| App runtime | Coolify `pixilens-smugmug-azure` | Docker `smugmug-managed` on priyanka |
| Traefik Host | Coolify-managed | `pixilens.com`, `www.pixilens.com`, optional staging |
| `NEXT_PUBLIC_SITE_URL` | `https://pixilens.com` | `https://pixilens.com` |
| Staging | `smugmug.pixilens.online` → priyanka | Same (keep as pre-prod) |
| Azure backup | `smugmug-az.pixilens.online` | Optional DR / turn off |

### Coolify reference

| App | UUID | Server |
|-----|------|--------|
| `pixilens-smugmug-azure` | `l08cogcggk4oksg0kwwos44k` | Azure-UBKS-Server |
| `pixilens-smugmug` (local) | `a4gcggkck44cokoc08os84sw` | priyanka |

---

## Prerequisites

Complete **before** changing DNS:

- [ ] Migration substantially complete; spot-check important galleries on staging
- [ ] Priyanka server reachable from internet (ports 80/443 via Traefik/Cloudflare)
- [ ] Know priyanka public IP: `ssh priyanka 'curl -s ifconfig.me'`
- [ ] Latest code on priyanka: `git log -1` matches `main`
- [ ] Env file intact: `/home/priyanka/pixilens-smugmug-admin/.env`
- [ ] Volume mounts intact: `data/` + `certs/` (videos, hero config, PG client certs)
- [ ] Namecheap (or DNS provider) login ready
- [ ] **Do not change** MX, SPF, DKIM, autodiscover — email stays on Microsoft 365

### Recommended: lower TTL 24h ahead

In Namecheap, set TTL on `@` and `www` to **300** (5 min) for fast rollback.

---

## Phase 1 — Pre-flight on priyanka

### 1.1 Pull latest code

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && git log -1 --oneline'
```

### 1.2 Build production container

Use the command in [Phase 2](#phase-2--deploy-production-container-on-priyanka) below. For a safe test first, deploy with only `smugmug.pixilens.online` in Traefik, verify, then add `pixilens.com` hosts.

### 1.3 Smoke test (before DNS)

```bash
# Legacy redirect
curl -sI -H 'Host: pixilens.com' http://127.0.0.1:3010/Joci2018Jan | grep -iE '^HTTP|^location'
# Expect: HTTP/1.1 308
# Expect: location: https://pixilens.com/galleries/joci2018jan

# New gallery route
curl -sI -H 'Host: pixilens.com' http://127.0.0.1:3010/galleries/joci2018jan | grep -iE '^HTTP|^location'

# Folder redirect
curl -sI -H 'Host: pixilens.com' http://127.0.0.1:3010/2Seelife/n-GnTWCB | grep -iE '^HTTP|^location'

# SEO
curl -sI -H 'Host: pixilens.com' http://127.0.0.1:3010/sitemap.xml | grep -iE '^HTTP|^content-type'
```

Manual browser checks on staging (if still on `smugmug.pixilens.online`):

- [ ] Homepage + hero slideshow
- [ ] One gallery with ImgBB photos
- [ ] One gallery with **local video**
- [ ] Admin login + upload test
- [ ] Booking / contact form (Microsoft Graph mail)

---

## Phase 2 — Deploy production container on priyanka

**Single container** serving production + staging (simplest):

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git pull --ff-only && \
  sudo docker build -t pixilens-smugmug:latest . && \
  sudo docker rm -f smugmug-managed && \
  sudo docker run -d --name smugmug-managed --restart unless-stopped --network coolify \
    -p 3010:3000 \
    --env-file /home/priyanka/pixilens-smugmug-admin/.env \
    -e MEDIA_ROOT=/admin-data/media \
    -e ADMIN_DATA_DIR=/admin-data \
    -e NEXT_PUBLIC_SITE_URL=https://pixilens.com \
    -v /home/priyanka/pixilens-smugmug-admin/data:/admin-data \
    -v /home/priyanka/pixilens-smugmug-admin/certs:/app/certs \
    --label traefik.enable=true \
    --label traefik.http.middlewares.gzip.compress=true \
    --label traefik.http.routers.http-0-smugmug-managed.entryPoints=http \
    --label traefik.http.routers.http-0-smugmug-managed.middlewares=gzip \
    --label "traefik.http.routers.http-0-smugmug-managed.rule=Host(\`pixilens.com\`) || Host(\`www.pixilens.com\`) || Host(\`smugmug.pixilens.online\`)" \
    --label traefik.http.routers.http-0-smugmug-managed.service=http-0-smugmug-managed \
    --label traefik.http.services.http-0-smugmug-managed.loadbalancer.server.port=3000 \
    pixilens-smugmug:latest'
```

**Changes vs staging-only deploy:**

1. `NEXT_PUBLIC_SITE_URL=https://pixilens.com` — canonical URLs, sitemap, Open Graph, legacy redirect `Location` headers
2. Traefik rule includes `pixilens.com` and `www.pixilens.com`

Verify env inside container:

```bash
ssh priyanka 'sudo docker exec smugmug-managed printenv NEXT_PUBLIC_SITE_URL'
# Expect: https://pixilens.com
```

---

## Phase 3 — DNS cutover (Namecheap)

### 3.1 Update records

| Host | Type | Value | Notes |
|------|------|-------|-------|
| `@` | A | `<PRIYANKA_PUBLIC_IP>` | Replace Azure `9.234.42.243` |
| `www` | A or CNAME | Same IP or `pixilens.com` | Match current www setup |

**Leave unchanged:** MX, TXT (SPF), DKIM, autodiscover, email-related CNAMEs.

### 3.2 Cloudflare

If `pixilens.com` is proxied (orange cloud):

- Ensure SSL mode is **Full** or **Full (strict)**
- Purge cache after cutover if old responses linger: Caching → Purge Everything

### 3.3 Wait for propagation

```bash
dig +short pixilens.com A
dig +short www.pixilens.com A
```

---

## Phase 4 — Post-cutover verification

Run against live domain (not Host header hack):

```bash
# Legacy gallery redirect
curl -sI https://pixilens.com/Joci2018Jan | grep -iE '^HTTP|^location'

# Direct gallery
curl -sI https://pixilens.com/galleries/joci2018jan | grep -iE '^HTTP'

# Folder redirect
curl -sI https://pixilens.com/2Seelife/n-GnTWCB | grep -iE '^HTTP|^location'

# Portfolio redirect
curl -sI https://pixilens.com/Pixilens-Portfolio/Lifestyle | grep -iE '^HTTP|^location'

# SEO
curl -s https://pixilens.com/sitemap.xml | head -5
curl -s https://pixilens.com/robots.txt
```

### Checklist

- [ ] `location:` headers use `https://pixilens.com/...` (not `localhost`, not `smugmug.pixilens.online`)
- [ ] Homepage loads; hero images sharp
- [ ] Gallery grid + lightbox work
- [ ] At least one **video** gallery plays
- [ ] `/admin` login works on production domain
- [ ] Form submission sends email
- [ ] Google Search Console: sitemap still `https://pixilens.com/sitemap.xml` (resubmit if needed)

---

## Phase 5 — Azure after cutover

Choose one strategy:

### Option A — Keep Azure as DR / staging (recommended short term)

1. Remove `pixilens.com` and `www.pixilens.com` from Azure Coolify FQDNs (avoid split-brain)
2. Keep `smugmug-az.pixilens.online` only
3. Set Azure env: `NEXT_PUBLIC_SITE_URL=https://smugmug-az.pixilens.online`
4. Set `ALLOW_SEARCH_INDEXING=false` on Azure so Google does not index duplicate content

```bash
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

### Option B — Shut down Azure app

Stop the Coolify app when confident in priyanka. Database and ImgBB are external — no data loss.

---

## Optional: separate prod and staging containers

Cleaner if you want staging URLs to never emit production canonicals:

| Container | Traefik Hosts | `NEXT_PUBLIC_SITE_URL` | Indexing |
|-----------|---------------|------------------------|----------|
| `smugmug-prod` | `pixilens.com`, `www.pixilens.com` | `https://pixilens.com` | default (on) |
| `smugmug-staging` | `smugmug.pixilens.online` | `https://smugmug.pixilens.online` | `ALLOW_SEARCH_INDEXING=false` |

Same image, same `--env-file`, same volume mounts — only labels and `NEXT_PUBLIC_SITE_URL` differ. Use ports `3010` and `3011` if both run on one host.

---

## Rollback to Azure

If priyanka production fails:

1. **DNS:** Point `@` and `www` back to Azure IP `9.234.42.243`
2. **Coolify:** Ensure Azure app FQDNs include `pixilens.com`, `www.pixilens.com`
3. **Env:** Azure `NEXT_PUBLIC_SITE_URL=https://pixilens.com`
4. Redeploy Azure if needed:

```bash
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

5. Wait for DNS TTL; verify `curl -sI https://pixilens.com/Joci2018Jan`

Database and ImgBB are unchanged — rollback is routing only.

---

## Ongoing deploy workflow (priyanka as production)

After cutover, production deploys are **priyanka Docker only**:

```bash
# 1. Push to GitHub main
# 2. Rebuild priyanka (production command in Phase 2)
# 3. Smoke test pixilens.com URLs
# 4. Optionally redeploy Azure DR copy
```

Always verify commit parity:

```bash
ssh priyanka 'cd /home/priyanka/pixilens-smugmug-migrator && git log -1 --oneline'
ssh priyanka 'sudo docker ps --filter name=smugmug-managed --format "{{.Status}}"'
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for IMGBB, Coolify build, and env troubleshooting.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Redirect `location: https://localhost:3000/...` | Traefik not forwarding Host; fallback env wrong | Set `NEXT_PUBLIC_SITE_URL=https://pixilens.com`; priyanka Traefik passes real Host (usually fine) |
| Redirect `location: https://smugmug.pixilens.online/...` on pixilens.com | Stale `NEXT_PUBLIC_SITE_URL` | Rebuild container with production env |
| Gallery 404 | Slug missing in DB | Data issue — run compare audit; not hosting-specific |
| Photos load, videos blank | Video only on priyanka disk | **Expected on Azure** — confirms priyanka is correct prod host |
| `pixilens.com` still hits Azure | DNS cache / old TTL | Wait or flush; check `dig` against authoritative NS |
| Admin upload 500 | Missing `IMGBB_API_KEY` in container | `sudo docker exec smugmug-managed printenv IMGBB_API_KEY` |

---

## Quick reference

| Item | Value |
|------|-------|
| Priyanka repo path | `/home/priyanka/pixilens-smugmug-migrator` |
| Env file | `/home/priyanka/pixilens-smugmug-admin/.env` |
| Production container | `smugmug-managed` |
| Container port | `3010:3000` |
| Azure rollback IP | `9.234.42.243` |
| Legacy redirect route | `app/[...smugmugPath]/route.ts` |
| Redirect resolver | `lib/smugmug-redirect.ts` |

---

## Sign-off

Record when cutover completes:

| Field | Value |
|-------|-------|
| Date | |
| Priyanka IP used | |
| Git commit | |
| Verified by | |
| Rollback tested? | Y / N |
