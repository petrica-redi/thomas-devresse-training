# Admin panel

Full admin at **`/admin.html`** (or **https://thomas-devresse-training.vercel.app/admin.html**).

## Login

- **Email:** `petrica@redi-ngo.eu`
- **Password:** `Welcome2REDI*`

## First-time setup (Vercel)

1. **Generate password hash** (local):
   ```bash
   npm install
   node scripts/generate-admin-hash.js
   ```
   Copy the printed `ADMIN_PASSWORD_HASH` value.

2. **Vercel project → Settings → Environment Variables**, add:
   - `ADMIN_EMAIL` = `petrica@redi-ngo.eu`
   - `ADMIN_PASSWORD_HASH` = *(paste the bcrypt hash)*
   - `JWT_SECRET` = *(random string, e.g. `openssl rand -hex 32`)*
   - `BLOB_READ_WRITE_TOKEN` = *(from Vercel → Storage → Blob → Create store, then copy token)*

3. **Redeploy** the project so the new env vars are applied.

## What you can do in the admin

- **Content:** Edit hero title/subtitle, about text, philosophy quote, footer tagline. The main site loads these from the API when available.
- **Media:** Upload new pictures (stored in Vercel Blob). List and remove uploads.
- **Products:** Edit shop data as JSON (nutrition, gear, videos, gallery). Same structure as the site’s product arrays.
- **Services:** Edit training/services entries as JSON.

All saved data is stored in Vercel Blob. The public site fetches content from `/api/public/content` and applies text overrides on load.
