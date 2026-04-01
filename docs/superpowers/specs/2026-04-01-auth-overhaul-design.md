# Auth Overhaul & Hardening — Design Spec

## Summary

Replace the URL-token-based admin auth with username/password credentials stored in SQLite. Add CSRF protection, rate limiting, optimistic UI updates, DB indexes, loading states, and remove dead code.

## Authentication

- New `AdminUser` Prisma model: `id`, `username`, `passwordHash`, `createdAt`, `updatedAt`
- Seeded with `admin`/`admin` (bcrypt-hashed) on first launch if no user exists
- Login page at `/[locale]/login` with username/password form
- `POST /api/auth/login` — validates credentials, sets HTTP-only cookie with signed JWT (via `jose`)
- `POST /api/auth/logout` — clears the cookie
- `PATCH /api/auth/credentials` — (protected) change username and/or password
- JWT contains: `sub` (user id), `csrf` (random token for CSRF double-submit), `iat`, `exp` (24h)
- `JWT_SECRET` env var, auto-generated in `start.sh` if absent

## Admin Route Changes

- Admin moves from `/[locale]/admin/[token]` to `/[locale]/admin`
- Middleware checks JWT cookie on `/admin` routes → redirects to `/[locale]/login` if invalid
- API endpoints (POST/DELETE wishlist, scrape) validate JWT cookie instead of body token
- Settings section in admin page to change username/password

## CSRF Protection

- Double-submit cookie pattern
- JWT contains a `csrf` claim
- Client reads the CSRF token from a non-HTTP-only cookie `csrf-token` set at login
- Client sends it as `X-CSRF-Token` header on mutations
- Server middleware compares header value against JWT claim
- Applied to all POST/PATCH/DELETE routes

## Rate Limiting

- In-memory Map keyed by IP + route
- `/api/auth/login`: 5 requests/minute
- Other API routes: 30 requests/minute
- Returns 429 with `Retry-After` header when exceeded

## Dead Code Removal

- Delete `auth.ts` (root)
- Delete `app/api/auth/route.ts` (old unused endpoint)
- Remove commented-out code in `Wishcard.tsx` (lines 39-43)
- Remove commented-out login button in `app/[locale]/page.tsx` (lines 40-42)
- Remove `console.log(token)` in `app/api/wishlist/route.ts`
- Remove `LOGIN_TOKEN` from `start.sh` and env handling

## Optimistic Updates

- `WishCard`: after purchase, immediately update local state (set purchased=true, grey out card) instead of `window.location.reload()`. Rollback on API error.
- Admin delete: immediately remove item from table, rollback on API error.

## Database Indexes

- Composite index on `[purchased, priority]`
- Composite index on `[purchased, createdAt]`
- Unique constraint on `url` (nullable, so NULL values are allowed multiple times)

## Loading States

- Admin delete button: show spinner/disabled state during delete request
- Admin add form: disable submit button + show spinner during submission

## Dependencies to Add

- `bcryptjs` — password hashing (pure JS, no native deps)
- `jose` — JWT sign/verify (edge-compatible)

## Environment Variables

- `NEXT_PUBLIC_USER_NAME` — kept
- `LOGIN_TOKEN` — **removed**
- `JWT_SECRET` — **new**, auto-generated if absent
