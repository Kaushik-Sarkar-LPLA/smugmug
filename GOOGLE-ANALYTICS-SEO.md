# Google Analytics 4 & Search Console

> Setup guide for **pixilens.com** after the SmugMug migration.  
> **Previous analytics:** Universal Analytics `UA-93000127-1` (SmugMug Site Settings). UA stopped collecting new data in July 2023.

**Last updated:** 2026-06-01

---

## What the site already provides

| Feature | URL / behavior |
|---------|----------------|
| **robots.txt** | `https://pixilens.com/robots.txt` — allows crawl; blocks `/admin/`, `/api/` |
| **Sitemap** | `https://pixilens.com/sitemap.xml` — static pages + portfolio + all public galleries/folders |
| **Canonical URLs** | From `NEXT_PUBLIC_SITE_URL=https://pixilens.com` |
| **JSON-LD** | Local business schema on homepage |
| **GA4 tag** | Loaded when `GA4_MEASUREMENT_ID=G-…` is set (runtime env — no rebuild needed) |
| **GSC verification** | Meta tag when `GOOGLE_SITE_VERIFICATION=…` is set |

Staging (`smugmug.pixilens.online`) should use `ALLOW_SEARCH_INDEXING=false` so GA4 and indexing stay off.

---

## Part 1 — Google Analytics 4 (replace UA-93000127-1)

### Step 1: Create or find GA4 property

1. Open [Google Analytics](https://analytics.google.com/)
2. Sign in with the Google account that owned **`UA-93000127-1`**
3. **Admin** (gear, bottom left)

**If you already have a GA4 property linked to the old UA account:**

- Admin → **Property settings** → copy the **Measurement ID** (`G-XXXXXXXXXX`)

**If you need a new GA4 property:**

1. Admin → **Create** → **Property**
2. Name: `Pixilens Photography`
3. Time zone: `(GMT-06:00) Central Time`
4. Currency: USD
5. **Next** → Industry: Arts & Entertainment → Business size: Small
6. **Create** → Choose **Web** stream
7. Website URL: `https://pixilens.com`
8. Stream name: `pixilens.com`
9. Copy the **Measurement ID** (`G-XXXXXXXXXX`)

**Optional — link historical UA data:**

1. Admin → **Product links** → **Universal Analytics setup**
2. Follow prompts to connect `UA-93000127-1` to the new GA4 property (read-only historical import)

### Step 2: Add measurement ID to production

Add to `/home/priyanka/pixilens-smugmug-admin/.env`:

```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Azure Coolify** (`l08cogcggk4oksg0kwwos44k`):

```bash
set -a; source /home/priyanka/pixilens-smugmug-admin/.env; set +a
/home/priyanka/go/bin/coolify --context Coolify1 app env create l08cogcggk4oksg0kwwos44k \
  --key GA4_MEASUREMENT_ID --value "$GA4_MEASUREMENT_ID" --is-literal
```

Redeploy Azure (or restart priyanka Docker with `--env-file` — no image rebuild required):

```bash
ssh priyanka '/home/priyanka/go/bin/coolify --context Coolify1 app start l08cogcggk4oksg0kwwos44k --force --instant-deploy'
```

### Step 3: Verify GA4 is receiving data

1. Visit `https://pixilens.com/` in a browser
2. GA4 → **Reports** → **Realtime** — you should see 1 active user within ~30 seconds
3. Or use [Google Tag Assistant](https://tagassistant.google.com/) on `pixilens.com`

**Check tag in page source:**

```bash
curl -s 'https://pixilens.com/' | grep -o 'G-[A-Z0-9]\{10,\}'
```

Should print your measurement ID after env is set and app restarted.

---

## Part 2 — Google Search Console

### Step 1: Add property

1. Open [Google Search Console](https://search.google.com/search-console)
2. **Add property**

**Recommended:** **URL prefix** → `https://pixilens.com`  
(Also add `https://www.pixilens.com` as a separate property, or set up domain property later.)

### Step 2: Verify ownership (HTML meta tag)

1. Choose verification method: **HTML tag**
2. Google shows something like:

   ```html
   <meta name="google-site-verification" content="AbCdEf123..." />
   ```

3. Copy only the **content** value (`AbCdEf123...`)

Add to production env:

```bash
GOOGLE_SITE_VERIFICATION=AbCdEf123...
```

**Azure Coolify:**

```bash
/home/priyanka/go/bin/coolify --context Coolify1 app env create l08cogcggk4oksg0kwwos44k \
  --key GOOGLE_SITE_VERIFICATION --value "AbCdEf123..." --is-literal
```

Redeploy / restart app, then click **Verify** in Search Console.

**Verify meta tag is live:**

```bash
curl -s 'https://pixilens.com/' | grep google-site-verification
```

**Alternative:** DNS TXT record in Namecheap (if you prefer not to use meta tag). Search Console shows the exact TXT value.

### Step 3: Submit sitemap

After verification:

1. Search Console → **Sitemaps** (left menu)
2. Enter: `sitemap.xml`
3. Click **Submit**

Full URL submitted: `https://pixilens.com/sitemap.xml`

The sitemap includes:

- Marketing pages (home, services, about, contact, etc.)
- Portfolio categories and DB-backed portfolio galleries
- All public **gallery** URLs (`/galleries/{slug}`)
- All public **folder** URLs (`/folders/{slug}`)

### Step 4: Request indexing (optional boost)

Search Console → **URL inspection**:

- `https://pixilens.com/`
- `https://pixilens.com/Pixilens-Portfolio`
- One or two important gallery URLs

Click **Request indexing** for each.

Legacy SmugMug URLs (e.g. `/Joci2018Jan`) redirect via 308 — Google will follow them; no need to submit old URLs individually.

---

## Environment variables summary

| Variable | Example | Where | Purpose |
|----------|---------|-------|---------|
| `GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Production only | GA4 gtag.js |
| `GOOGLE_SITE_VERIFICATION` | `abc123...` | Production only | Search Console meta tag |
| `NEXT_PUBLIC_SITE_URL` | `https://pixilens.com` | Production | Canonical + sitemap base |
| `ALLOW_SEARCH_INDEXING` | omit or `true` | Production | Enable indexing + GA4 |
| `ALLOW_SEARCH_INDEXING` | `false` | Staging | Block GA4 + noindex |

Add to `.env.example` locally; **never commit real values**.

---

## Post-setup checklist

- [ ] GA4 Realtime shows traffic on `pixilens.com`
- [ ] Search Console property verified
- [ ] Sitemap submitted — status **Success**
- [ ] `robots.txt` shows `Sitemap: https://pixilens.com/sitemap.xml`
- [ ] Staging does **not** load GA4 (`ALLOW_SEARCH_INDEXING=false`)
- [ ] Old UA `UA-93000127-1` documented as retired (optional: read-only in GA for history)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No GA4 realtime data | Confirm `GA4_MEASUREMENT_ID` in running container: `docker exec smugmug-managed printenv GA4_MEASUREMENT_ID` |
| GA4 on staging polluting prod | Set `ALLOW_SEARCH_INDEXING=false` on staging |
| GSC verification fails | Meta tag must be on `https://pixilens.com/` HTML; redeploy after env change |
| Sitemap “Couldn’t fetch” | Confirm `curl -I https://pixilens.com/sitemap.xml` returns 200 |
| Sitemap empty of galleries | DB connection from app; check Azure SSL certs / `DATABASE_URL` |

See also [`DEPLOYMENT.md`](./DEPLOYMENT.md) for deploy commands.
