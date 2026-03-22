# Admin Panel — DEVRESSE 改

## Access

- **URL**: `https://devresse.fit/admin`
- **Email**: `tomas@devresse.fit`
- **Password**: `admin123`

## Features

| Section | Description |
|---------|-------------|
| **Dashboard** | Business overview with stats (bookings, orders, revenue, subscribers) |
| **Bookings** | Manage client sessions — confirm, complete, or cancel |
| **Orders** | View e-shop orders and fulfillment status |
| **Newsletter** | Subscriber list with CSV export |
| **Messages** | Contact form submissions — read/unread, delete |
| **Site Content** | Edit hero text, about, quote, footer |
| **Media Library** | Upload and manage images (drag & drop) |
| **Products** | Edit e-shop product data (JSON) |
| **Services** | Edit training packages and pricing (JSON) |
| **Settings** | Account info, email forwarding setup, env vars status |

## Email Forwarding

All emails to `@devresse.fit` are forwarded to `thom.devresse@gmail.com`.

### Setup via Cloudflare Email Routing (recommended)

1. Go to Cloudflare Dashboard → your domain → **Email → Email Routing**
2. Add route: `*@devresse.fit` → `thom.devresse@gmail.com`
3. Verify the destination email address when prompted

### Setup via Vercel

1. Go to Vercel Dashboard → **Domains → devresse.fit → Email**
2. Add forwarding: `*@devresse.fit` → `thom.devresse@gmail.com`

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/login` | POST | — | Login with email/password |
| `/api/auth/logout` | POST | — | Clear session |
| `/api/auth/me` | GET | — | Check current user |
| `/api/admin/stats` | GET | ✓ | Dashboard statistics |
| `/api/admin/bookings` | GET/PUT/DELETE | ✓ | Manage bookings |
| `/api/admin/orders` | GET/PUT | ✓ | Manage orders |
| `/api/admin/subscribers` | GET/DELETE | ✓ | Manage newsletter |
| `/api/admin/messages` | GET/PUT/DELETE | ✓ | Manage contact messages |
| `/api/admin/content` | GET/PUT | ✓ | Site content |
| `/api/admin/media` | GET/DELETE | ✓ | Media library |
| `/api/admin/upload` | POST | ✓ | Upload images |
| `/api/admin/products` | GET/PUT | ✓ | Products data |
| `/api/admin/services` | GET/PUT | ✓ | Services data |
| `/api/public/subscribe` | POST | — | Newsletter signup |
| `/api/public/contact` | POST | — | Contact form |
| `/api/public/content` | GET | — | Public site data |

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```
ADMIN_EMAIL=tomas@devresse.fit
ADMIN_PASSWORD_HASH=$2a$10$vJJ8XoX3pO29yHIcXtTN5OXdhOdfojuarVJenHiPmSXopjRVyyXqy
JWT_SECRET=<generate with: openssl rand -hex 32>
BLOB_READ_WRITE_TOKEN=<from Vercel Blob storage>
STRIPE_SECRET_KEY=sk_live_...
```
