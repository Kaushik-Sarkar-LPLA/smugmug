# SmugMug to self-hosted Pixilens migration plan

## Context

The goal is to move the existing photography and video portfolio currently served through SmugMug at `pixilens.com` into a self-hosted website that preserves the current content, hierarchy, URL patterns, visual look, and public browsing experience, while removing SmugMug commerce/buy-now functionality.

The migrated site should first launch safely at `smugmug.pixilens.online` on the user's Coolify/priyanka server. After visual, content, admin, and URL compatibility validation, the root domain `pixilens.com` should be cut over.

The final `pixilens.com` cutover should be transparent to visitors: existing public URLs like gallery/album/photo/video paths should continue working wherever possible, either as identical routes or explicit redirects.

The new site should also include a private backend admin area with local authentication for ongoing management after leaving SmugMug. The admin should support basic SmugMug-like operations: create folders/galleries, upload photos/videos, download media, delete media, and delete or edit galleries.

No SmugMug API keys, OAuth secrets, SSH keys, Coolify tokens, DNS credentials, admin passwords, or session secrets should be committed to git.

## Recommended stack

Use a self-hosted media portfolio app with a public gallery frontend and private admin backend:

- **Framework:** Next.js + TypeScript
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui for admin forms, dialogs, tables, buttons, upload UI
- **Public media display:** responsive photo grids, video playback, lazy loading, lightbox/carousel where needed
- **Backend/admin:** Next.js route handlers/server actions for authenticated admin operations
- **Auth:** local admin login with hashed password and secure session cookie
- **Database:** Postgres on the same server/database service used by promptgrabber.com, isolated in a new schema for Pixilens
- **ORM/query layer:** Drizzle recommended for schema-qualified migrations and typed queries
- **Photo storage:** ImgBB Pro as flat image storage/CDN. ImgBB does not support API-created folders/subfolders, so the app/database owns the folder and gallery hierarchy.
- **Video/local storage:** new HDD mounted on priyanka, bind-mounted into the app container. Videos are stored only on local priyanka server storage, not ImgBB.
- **Deployment:** Dockerized Next.js app on Coolify
- **QA:** Playwright MCP/CLI screenshots, route checks, admin workflow checks

Reason: the project now needs upload/delete/create-gallery admin features, so a pure static Astro site is no longer enough. Next.js keeps the public site, backend API, admin UI, auth, and deployment in one app while still allowing fast public pages and straightforward Coolify hosting.

## Target project location

Project path:

```text
/Users/kauushiksarkar/MacGithub/smugmug
```

Plan file:

```text
/Users/kauushiksarkar/MacGithub/smugmug/MIGRATION.md
```

## Core product requirements

### Public visitor site

- Mimic the current `pixilens.com` SmugMug design as closely as practical, including layout, navigation, typography, colors, spacing, gallery behavior, media detail/lightbox behavior, and responsive behavior.
- Preserve existing public URL patterns wherever possible.
- Support photo galleries, video galleries, folder/category pages, media detail pages, and existing static pages such as about/contact if present.
- No buy-now, cart, print ordering, pricing, or commerce UI.
- Fast browsing experience for large galleries.
- Responsive desktop/tablet/mobile layout.
- SEO-safe migration with sitemap, metadata, Open Graph images, robots rules, and redirects.

### Private admin backend

Admin area should live at a private path such as:

```text
/admin
```

Required admin features:

- Local admin login/logout.
- Create folder/category.
- Edit folder/category title, slug, description, visibility, ordering.
- Delete folder/category after confirmation.
- Create gallery/album inside a folder.
- Edit gallery title, slug, description, cover image, visibility, ordering.
- Delete gallery after confirmation.
- Upload photos to a gallery.
- Upload videos to a gallery.
- Generate/store thumbnails or poster images.
- Download original or stored media file from admin.
- Delete photo/video after confirmation.
- Reorder galleries and media items if practical.
- Mark gallery/media as public/private/draft.
- Show migration/source metadata for SmugMug-imported items.

Admin does not need multi-user support initially. A single local admin account is enough.

## Storage planning checkpoint

Before downloading the full photo and video library, confirm the ImgBB Pro storage plan for photos and add/mount the new HDD on the priyanka server for videos, backups, manifests, and fallback storage.

Recommended storage layout:

```text
ImgBB Pro
  flat uploaded photos with deterministic names:
    smugmug--<folder-path>--<gallery-slug>--<image-key>--<photo-slug>.jpg

/mnt/pixilens-media/
  smugmug-export/
  media/
    videos/
      originals-or-playback/
      posters/
  backups/
```

The current SmugMug folder/gallery structure must be represented in Postgres and app routes, not in ImgBB folders. ImgBB upload names should include enough source structure to make images traceable, but public browsing should use the app's preserved Pixilens URLs, not ImgBB's flat URLs.

Storage tasks:

1. Install and format the new HDD when available.
2. Mount it persistently via `/etc/fstab` using the drive UUID.
3. Confirm available space with `df -h` before migration.
4. Upload migrated public photos to ImgBB Pro using deterministic flat names, then store returned ImgBB URLs, delete URLs, IDs, and source SmugMug mappings in Postgres.
5. Store videos only on the priyanka HDD/local server storage.
6. Keep the website app/container on the main server disk and bind-mount the HDD media path into the Coolify container for videos and backups.
7. Back up the final SmugMug export manifests, ImgBB upload manifests, database, downloaded videos, and any fallback photos to `backups/` or another backup target.
8. Do not rely on `/home/priyanka/google_drive` for primary site assets unless explicitly tested, because mounted cloud drives can have different performance and inode behavior.

Current `priyanka` local root disk has about 806G free, but the plan assumes a new HDD will be added before the full video migration and backup workflow. The latest inventory estimated roughly 881.75 GB of photo original/archive metadata size and 72.65 GB of corrected largest-video size, so ImgBB will carry the photo-serving load while the HDD carries videos and backup/fallback storage.

## Proposed project structure

```text
smugmug/
  app/
    (public)/
      page.tsx
      [gallerySlug]/
        page.tsx
      [gallerySlug]/[mediaSlug]/
        page.tsx
    admin/
      login/
        page.tsx
      page.tsx
      folders/
      galleries/
      media/
    api/
      admin/
        upload/
        media/
        galleries/
        folders/
  components/
    public/
      Header.tsx
      Footer.tsx
      GalleryGrid.tsx
      MediaLightbox.tsx
      AlbumCard.tsx
      VideoPlayer.tsx
    admin/
      AdminNav.tsx
      UploadDropzone.tsx
      MediaTable.tsx
      GalleryForm.tsx
      FolderForm.tsx
  db/
    schema.ts
    migrations/
    client.ts
  lib/
    auth.ts
    media-storage.ts
    smugmug.ts
    url-map.ts
    image-processing.ts
    video-processing.ts
  scripts/
    smugmug-export.ts
    download-media.ts
    build-url-map.ts
    validate-export.ts
    import-to-db.ts
  data/
    export/
    url-map.json
  public/
    robots.txt
  docker/
    Caddyfile or nginx.conf if needed
  .env.example
  .gitignore
  Dockerfile
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

Actual media files should live on the server HDD, not necessarily inside git:

```text
/mnt/pixilens-media/media/...
```

## Database/content model

Minimum tables:

- `admin_users`
  - id, email/username, password_hash, created_at, updated_at
- `sessions`
  - id, user_id, token_hash, expires_at, created_at
- `folders`
  - id, parent_id, title, slug, description, visibility, sort_order, smugmug_uri, original_url
- `galleries`
  - id, folder_id, title, slug, description, visibility, sort_order, cover_media_id, smugmug_uri, original_url
- `media_items`
  - id, gallery_id, type (`photo` or `video`), title, caption, slug, visibility, sort_order, taken_at, width, height, duration, source_smugmug_uri, original_url
- `media_files`
  - id, media_item_id, kind (`original`, `display`, `thumb`, `poster`, `playback`), storage_provider (`imgbb`, `local`, `smugmug`, `fallback`), path, public_url, provider_id, delete_url_secret_ref, mime_type, size_bytes, checksum, width, height, duration
- `url_redirects`
  - id, old_path, new_path, status_code, source, verified_at

Postgres isolation requirement:

- Use the same Postgres server that promptgrabber.com uses.
- Create a separate schema for this project, recommended name: `pixilens_smugmug`.
- All Pixilens tables should be created inside that schema, not in `public` and not mixed with promptgrabber tables.
- Configure the app `DATABASE_URL` or Drizzle connection so the schema search path is `pixilens_smugmug`.
- Before creating schema/tables, inspect existing DB names/users/permissions and back up or snapshot if needed.
- Do not change promptgrabber tables, roles, migrations, or existing schemas.

## Secrets and environment variables

`.env` must stay local/server-only and ignored by git.

`.env.example` should document names only:

```text
DATABASE_URL=
DATABASE_SCHEMA=pixilens_smugmug
MEDIA_ROOT=/mnt/pixilens-media/media
IMGBB_API_KEY=
IMGBB_BASE_FOLDER=smugmug
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
SMUGMUG_API_KEY=
SMUGMUG_API_SECRET=
SMUGMUG_ACCESS_TOKEN=
SMUGMUG_ACCESS_TOKEN_SECRET=
SMUGMUG_NICKNAME=
SMUGMUG_BASE_URL=https://pixilens.com
```

Admin password should be stored as a hash, not plaintext.

## Phase 1 — Discovery and source capture

1. Confirm access details with the user:
   - SmugMug API key/secret and OAuth/token flow preference.
   - Whether `pixilens.com` is still actively pointed at SmugMug.
   - SSH host/alias for the priyanka server.
   - Coolify access method: web UI, API token, or SSH/docker access.
   - DNS provider for `pixilens.com` and `pixilens.app`.
   - New HDD size/mount path once available.

2. Capture current website structure and URL contract:
   - Crawl `pixilens.com` with Playwright.
   - Treat the homepage as a priority design target: it currently uses the SmugMug `FP Slides` album as a masonry-style front-page gallery/slideshow source.
   - Treat the `Sitedata` album as priority site assets for the rest of the design before migrating the full library.
   - Save route list, visible navigation, page titles, album/gallery URLs, photo/video detail URLs, and screenshots.
   - Capture desktop and mobile screenshots for each important page.
   - Record exact current public URL patterns, including gallery, album, image, video, about/contact, and legacy SmugMug-style paths.
   - Record typography, color palette, spacing, nav behavior, footer, gallery layout, media detail behavior, and video playback behavior.

3. Inspect SmugMug API data:
   - Fetch user/account root node.
   - Fetch folders, albums, photo/video metadata, captions, keywords, ordering, visibility, canonical page paths, and downloadable/playable media URLs.
   - Identify which photos and videos are public and should migrate.
   - Exclude private/unlisted/protected content unless explicitly requested.

4. Establish migration inventory:
   - `folders`: title, slug, parent, description, original URL, sort order, visibility.
   - `galleries`: folder ID, title, slug, description, original URL, sort order, cover media, visibility.
   - `photos`: gallery ID, title/caption, taken date, dimensions, original SmugMug URI, selected image sizes, alt text candidate, ordering.
   - `videos`: gallery ID, title/caption, duration, dimensions, original SmugMug URI, selected playback/download size, poster image, ordering.
   - `urlMap`: old public URL, canonical new URL, route type, redirect status, validation result.
   - `pages`: home/about/contact/custom pages if present.

## Phase 2 — Project scaffold

1. Create the Next.js app in `/Users/kauushiksarkar/MacGithub/smugmug`.
2. Add Tailwind and shadcn/ui.
3. Add Drizzle and the initial Postgres database schema.
4. Configure migrations to create/use the `pixilens_smugmug` schema on the promptgrabber Postgres server.
5. Add local auth helpers and session handling.
5. Add `.env.example` and `.gitignore` before any secret usage.
6. Add Dockerfile for Coolify deployment.

## Phase 3 — SmugMug export tooling

Build scripts that can run repeatedly and safely:

1. `scripts/smugmug-export.ts`
   - Authenticate to SmugMug API.
   - Export folder/gallery/photo/video metadata to `data/export/raw-smugmug.json`.
   - Preserve original SmugMug IDs/URIs and public URLs for traceability.
   - Avoid downloading private media unless explicitly allowed.

2. `scripts/upload-photos-to-imgbb.ts`
   - Treat ImgBB as flat image storage/CDN; do not depend on folders, subfolders, or albums.
   - Encode the source SmugMug folder/gallery structure into deterministic ImgBB upload names and persist the real hierarchy in Postgres.
   - Upload selected public photo sizes to ImgBB Pro.
   - Store ImgBB image IDs, public URLs, display URLs, delete URLs/secrets, width/height, size, and source SmugMug IDs in a manifest and Postgres.
   - Skip already-uploaded photos to support resume.

3. `scripts/download-videos.ts`
   - Download selected video playback files and posters to the priyanka HDD media path only.
   - Prefer largest playable video unless originals are explicitly required and available.
   - Generate deterministic local filenames from SmugMug video keys.
   - Skip already-downloaded videos to support resume.
   - Save a manifest with checksums, dimensions/duration, source URL, and local path.

4. `scripts/build-url-map.ts`
   - Convert crawled public URLs and SmugMug canonical URLs into `data/url-map.json`.
   - Preserve identical public paths wherever possible.
   - Mark any non-identical path for 301 redirect.

5. `scripts/import-to-db.ts`
   - Convert the export, ImgBB photo upload manifests, and video media manifests into database rows.
   - Preserve folder/gallery/media ordering.
   - Preserve slugs and current URL paths where practical.

6. `scripts/validate-export.ts`
   - Count folders/galleries/photos/videos.
   - Detect missing thumbnails, posters, playback files, or broken local files.
   - Compare crawled public pages to exported data.
   - Verify every captured public URL either renders at the same path or has a planned redirect.

## Phase 4 — Public site implementation

1. Build the site to mimic the current SmugMug design as closely as practical:
   - Header/nav layout.
   - Homepage hero/gallery entry points.
   - Folder/category pages.
   - Gallery/album grid layout.
   - Photo grid/masonry behavior if current site uses it.
   - Video thumbnail/poster/playback behavior.
   - Image/video detail/lightbox behavior.
   - Footer and contact/social links.
   - Typography, colors, spacing, hover states, button/link styling, and responsive mobile layout.
   - Use Playwright screenshots from current `pixilens.com` as the visual source of truth before rebuilding pages.

2. Remove commerce:
   - No buy buttons.
   - No cart.
   - No print/product links.
   - No pricing UI.
   - No SmugMug branding or links unless legally/contractually needed.

3. Preserve SEO:
   - Page titles and descriptions.
   - Existing canonical paths where practical.
   - Image alt text from captions/title when available.
   - Video metadata where available.
   - Open Graph image/title for homepage, folders, galleries, and media pages.
   - `sitemap.xml`.
   - `robots.txt`.

4. URL preservation and redirect support:
   - Preserve the existing public URL pattern as the primary route design wherever practical, including gallery/album/photo/video paths.
   - Generate a complete URL map from crawled `pixilens.com` URLs and SmugMug canonical URLs.
   - For any URL that cannot be implemented identically, create an explicit 301 redirect to the closest equivalent new route.
   - Configure redirects in the app, Caddy, or Nginx so bookmarked links and search engine results continue working after cutover.
   - Keep `smugmug.pixilens.online` staging noindex until root cutover.

## Phase 5 — Admin backend implementation

1. Local auth:
   - `/admin/login` page.
   - Password hash verification.
   - Secure HTTP-only session cookie.
   - Logout.
   - Protect every `/admin` route and admin API route.

2. Dashboard:
   - Show total folders, galleries, photos, videos, storage usage, and recent uploads.

3. Folder management:
   - Create/edit/delete folders.
   - Set title, slug, description, parent folder, visibility, order.

4. Gallery management:
   - Create/edit/delete galleries.
   - Assign to folder.
   - Set title, slug, description, cover media, visibility, order.

5. Media management:
   - Upload photo/video to selected gallery.
   - Store files under `MEDIA_ROOT`.
   - Create database records.
   - Generate thumbnails/posters where practical.
   - Edit title/caption/slug/visibility/order.
   - Download media file from admin.
   - Delete media file and DB record after confirmation.

6. Safety:
   - Validate upload file types and size limits.
   - Prevent path traversal.
   - Use server-generated storage paths.
   - Do not expose admin upload endpoints publicly without auth.
   - Confirm destructive delete operations.

## Phase 6 — Local verification

Run locally before deployment:

1. Install/build/import:
   - `npm install`
   - `npm run db:migrate`
   - `npm run export:smugmug`
   - `npm run upload:photos:imgbb`
   - `npm run download:videos`
   - `npm run build:url-map`
   - `npm run import:db`
   - `npm run build`

2. Public browser QA with Playwright:
   - Open homepage desktop and mobile.
   - Open top-level folders/galleries.
   - Open representative photo pages.
   - Open representative video pages.
   - Verify no console errors.
   - Verify image lazy loading and video playback.
   - Compare screenshots against captured SmugMug screenshots.

3. Admin browser QA with Playwright:
   - Login/logout.
   - Create folder.
   - Create gallery.
   - Upload photo.
   - Upload video.
   - Download media.
   - Delete media.
   - Delete test gallery/folder.
   - Confirm public pages reflect admin changes.

4. Content validation:
   - Folder/gallery count matches expected public structure.
   - Photo/video counts match expected public media.
   - Captions/titles/descriptions appear correctly.
   - No private galleries are accidentally exposed.
   - No buy/cart UI remains.
   - Existing public URLs either work directly or redirect correctly.

## Phase 7 — GitHub repository

1. Keep the local repo at `/Users/kauushiksarkar/MacGithub/smugmug`.
2. Commit source, scripts, config, schema, and non-secret documentation.
3. Do not commit `.env`, API keys, OAuth tokens, admin secrets, ImgBB delete URLs/secrets, raw sensitive exports, database files, or private media.
4. Create a GitHub repository named `smugmug` only after confirming visibility:
   - private recommended during migration.
   - public only if the user explicitly wants it.

## Phase 8 — Coolify deployment to smugmug.pixilens.online

1. Prepare deployment:
   - Add Dockerfile for the Next.js app.
   - Configure production `DATABASE_URL`, `MEDIA_ROOT`, `IMGBB_API_KEY`, `IMGBB_BASE_FOLDER`, `SESSION_SECRET`, and admin credentials in Coolify secrets/env.
   - Bind-mount `/mnt/pixilens-media/media` into the app container for videos/backups/fallback media.
   - Ensure upload size limits are compatible with expected photo/video sizes.

2. On Coolify/priyanka server:
   - Connect the GitHub repo.
   - Create a new application for `smugmug`.
   - Set domain to `smugmug.pixilens.online`.
   - Configure HTTPS.
   - Attach the media volume/bind mount.
   - Run DB migrations.

3. DNS for staging:
   - Add `smugmug.pixilens.online` DNS record to the Coolify/priyanka server target.
   - Wait for DNS/HTTPS validation.

4. Staging checks:
   - Browse `https://smugmug.pixilens.online`.
   - Run Playwright smoke tests against staging.
   - Check image load performance and video playback.
   - Verify all nav/folder/gallery/photo/video routes.
   - Verify admin login, upload, download, delete, and create-gallery workflows.
   - Verify `robots.txt` blocks indexing during staging.

## Phase 9 — Final root-domain migration

Do not cut over `pixilens.com` until staging is approved.

Pre-cutover:

1. Lower DNS TTL for `pixilens.com` in advance.
2. Re-run SmugMug export/download to catch any recent changes.
3. Rebuild/import/redeploy staging.
4. Confirm URL map and redirects.
5. Back up final manifests, ImgBB upload mapping/delete metadata, database, and downloaded videos/fallback media.
6. Keep SmugMug account/site untouched for rollback.

Cutover:

1. Add `pixilens.com` and likely `www.pixilens.com` to the Coolify app.
2. Configure HTTPS certificates.
3. Update DNS A/CNAME records from SmugMug to priyanka/Coolify.
4. Confirm root and www route correctly.
5. Remove staging noindex behavior for the root domain.
6. Submit sitemap after launch if desired.

Post-cutover QA:

1. Check homepage, folder, gallery, photo, video, about/contact pages.
2. Check old important URLs redirect correctly.
3. Check mobile layout.
4. Check image loading and video playback.
5. Check Open Graph previews.
6. Check Google indexing directives.
7. Verify admin workflows still work on production domain.
8. Monitor Coolify logs, server resource usage, storage usage, and upload errors.

Rollback:

1. Keep old SmugMug DNS settings documented.
2. If launch fails, revert DNS records to SmugMug while TTL is low.
3. Keep the Coolify staging app running for fixes.
4. Do not delete SmugMug content until the new site has been stable for an agreed period.

## Security and privacy requirements

- Never paste API keys into committed files.
- Never commit `.env`.
- Never commit admin password or session secret.
- Store admin password as a strong hash.
- Treat SmugMug raw exports as potentially sensitive until reviewed.
- Exclude private/unlisted/password-protected galleries unless explicitly requested.
- Do not store original full-resolution photos/videos publicly unless the user approves.
- Validate uploads by MIME/type and extension.
- Generate server-side filenames; never trust uploaded filenames as paths.
- Protect admin routes and API routes with auth.
- Use staging `robots.txt` noindex to avoid duplicate search indexing before cutover.
- Keep GitHub repo private during migration unless the user says otherwise.

## Clarifications needed before implementation

1. Whether to migrate original full-resolution photos/videos or only web-display sizes.
2. Whether any private/unlisted SmugMug galleries should be migrated.
3. Exact promptgrabber Postgres connection source/credentials to reuse, or approval to inspect Coolify/container env with sufficient permissions.
4. Whether the GitHub repo should be private or public.
4. Whether Coolify access will be through UI, API token, or SSH on the priyanka server.
5. DNS provider for `pixilens.com` and `pixilens.app`.
6. Whether the visual goal is exact clone or close clone with cleaner self-hosted implementation.
7. Preferred new HDD mount path and expected disk size.
8. Preferred admin username.
9. Maximum expected video upload size.

## Execution checkpoints

Implementation should proceed in safe checkpoints:

1. Create project scaffold only.
2. Capture current SmugMug screenshots and route inventory.
3. Add/mount new HDD on priyanka and confirm migration storage path.
4. Build database schema and local admin auth.
5. Export metadata only; review counts before uploading/downloading media.
6. Migrate priority site assets first: `FP Slides` for the homepage masonry/slideshow gallery and `Sitedata` for site design assets.
7. Upload/migrate photos to ImgBB using flat deterministic names and download/migrate videos to local priyanka HDD storage only.
8. Import migrated structure, ImgBB URLs, video paths, and redirect mappings into the database.
9. Build local public visual clone.
10. Build local admin upload/download/delete/gallery workflows.
11. Deploy staging to `smugmug.pixilens.online`.
12. User review and fixes.
13. Root-domain cutover to `pixilens.com`.

No production DNS change, GitHub repo creation, Coolify deployment, remote server mutation, or destructive media deletion should happen without explicit user approval at that checkpoint.
