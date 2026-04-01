# Auth Overhaul & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace URL-token auth with credentials-based login, add CSRF/rate-limiting/optimistic-updates/indexes/loading-states, remove dead code.

**Architecture:** AdminUser model in SQLite via Prisma, JWT in HTTP-only cookie via `jose`, CSRF via double-submit cookie, in-memory rate limiter, optimistic React state updates.

**Tech Stack:** Next.js 15, Prisma/SQLite, jose (JWT), bcryptjs (password hashing), React 19.

---

### Task 1: Install dependencies and update Prisma schema

**Files:**
- Modify: `package.json`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Install jose and bcryptjs**

```bash
cd /home/morveus/github/uninspired && npm install jose bcryptjs && npm install --save-dev @types/bcryptjs
```

- [ ] **Step 2: Add AdminUser model and indexes to Prisma schema**

In `prisma/schema.prisma`, add after the `WishlistItem` model:

```prisma
model AdminUser {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

And add indexes + unique constraint to `WishlistItem`:

```prisma
model WishlistItem {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  url         String?  @unique
  image       String?
  currency    String?
  price       Float?
  priority    Int      @default(3)
  purchased   Boolean  @default(false)
  purchasedAt DateTime?
  purchasedBy String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([purchased, priority])
  @@index([purchased, createdAt])
}
```

- [ ] **Step 3: Generate migration and Prisma client**

```bash
cd /home/morveus/github/uninspired && npx prisma migrate dev --name add-admin-user-and-indexes
```

- [ ] **Step 4: Commit**

```bash
cd /home/morveus/github/uninspired && git add package.json package-lock.json prisma/schema.prisma prisma/migrations && git commit -m "feat: add AdminUser model, DB indexes, and auth dependencies"
```

---

### Task 2: Create auth utilities (JWT + password + CSRF + rate limiter)

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/csrf.ts`
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Create `lib/auth.ts` — JWT and password utilities**

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'uninspired-session'
const CSRF_COOKIE_NAME = 'csrf-token'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number, csrfToken: string): Promise<string> {
  const jwt = await new SignJWT({ sub: String(userId), csrf: csrfToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
  return jwt
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as { sub: string; csrf: string; iat: number; exp: number }
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export { COOKIE_NAME, CSRF_COOKIE_NAME }
```

- [ ] **Step 2: Create `lib/csrf.ts` — CSRF validation helper**

```typescript
import { getSessionFromCookies } from './auth'

export async function validateCsrf(request: Request): Promise<boolean> {
  const csrfHeader = request.headers.get('X-CSRF-Token')
  if (!csrfHeader) return false

  const session = await getSessionFromCookies()
  if (!session) return false

  return csrfHeader === session.csrf
}
```

- [ ] **Step 3: Create `lib/rate-limit.ts` — in-memory rate limiter**

```typescript
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  entry.count++
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true, retryAfter: 0 }
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/morveus/github/uninspired && git add lib/auth.ts lib/csrf.ts lib/rate-limit.ts && git commit -m "feat: add JWT auth, CSRF, and rate limiting utilities"
```

---

### Task 3: Create admin seeding in `start.sh` and update seed script

**Files:**
- Modify: `start.sh`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Update `start.sh` — remove LOGIN_TOKEN, add JWT_SECRET auto-generation, add admin seed**

Replace full contents of `start.sh`:

```bash
#!/bin/sh

# Auto-generate JWT_SECRET if not set
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET automatically."
fi

# Create .env file
echo "NEXT_PUBLIC_USER_NAME=$NEXT_PUBLIC_USER_NAME" > .env
echo "JWT_SECRET=$JWT_SECRET" >> .env

echo "Generated .env file."
echo "Starting application..."

# Apply database migrations
npx prisma db push

# Seed admin user if none exists
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    const hash = await bcrypt.hash('admin', 12);
    await prisma.adminUser.create({ data: { username: 'admin', passwordHash: hash } });
    console.log('Default admin user created (admin/admin)');
  } else {
    console.log('Admin user already exists, skipping seed.');
  }
  await prisma.\$disconnect();
})();
"

# Build and start
npm run build
npm start
```

- [ ] **Step 2: Update `prisma/seed.ts` — add admin user seeding for dev**

Add after the existing imports at the top of `prisma/seed.ts`:

```typescript
import bcrypt from 'bcryptjs'
```

Add before `main()` call, inside the `main` function, after the wishlist seeding block:

```typescript
  // Seed admin user
  await prisma.adminUser.deleteMany()
  const passwordHash = await bcrypt.hash('admin', 12)
  await prisma.adminUser.create({
    data: {
      username: 'admin',
      passwordHash,
    },
  })
  console.log('Admin user seeded (admin/admin)')
```

- [ ] **Step 3: Commit**

```bash
cd /home/morveus/github/uninspired && git add start.sh prisma/seed.ts && git commit -m "feat: auto-seed admin user, auto-generate JWT_SECRET"
```

---

### Task 4: Create auth API routes

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/credentials/route.ts`
- Delete: `app/api/auth/route.ts`

- [ ] **Step 1: Delete old auth route**

```bash
rm /home/morveus/github/uninspired/app/api/auth/route.ts
```

- [ ] **Step 2: Create `app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, generateCsrfToken, COOKIE_NAME, CSRF_COOKIE_NAME } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`login:${ip}`, 5, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { username, password } = await request.json()

    const user = await prisma.adminUser.findUnique({ where: { username } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const csrfToken = generateCsrfToken()
    const jwt = await createSession(user.id, csrfToken)

    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

- [ ] **Step 3: Create `app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { COOKIE_NAME, CSRF_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
```

- [ ] **Step 4: Create `app/api/auth/credentials/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookies, hashPassword, verifyPassword } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const { currentPassword, newUsername, newPassword } = await request.json()

    const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.sub) } })
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const updateData: { username?: string; passwordHash?: string } = {}
    if (newUsername) updateData.username = newUsername
    if (newPassword) updateData.passwordHash = await hashPassword(newPassword)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd /home/morveus/github/uninspired && git add -A app/api/auth/ && git commit -m "feat: add login/logout/credentials API routes"
```

---

### Task 5: Update middleware for session-based auth

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Rewrite `middleware.ts`**

Replace full contents of `middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'uninspired-session'
const localePattern = routing.locales.join('|')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return new TextEncoder().encode(secret)
}

async function verifySessionMiddleware(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    await jwtVerify(token, getJwtSecret())
    return true
  } catch {
    return false
  }
}

async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if this is an admin route
  const adminMatch = pathname.match(new RegExp(`^/(${localePattern})/admin`))
  if (adminMatch) {
    const isValid = await verifySessionMiddleware(request)
    if (!isValid) {
      const locale = adminMatch[1]
      const loginUrl = new URL(`/${locale}/login`, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check CSRF on API mutations
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout')) {
    const method = request.method
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      // CSRF check: compare header to JWT claim
      const token = request.cookies.get(COOKIE_NAME)?.value
      if (token) {
        try {
          const { payload } = await jwtVerify(token, getJwtSecret())
          const csrfHeader = request.headers.get('X-CSRF-Token')
          if (csrfHeader && csrfHeader !== payload.csrf) {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
          }
        } catch {
          // JWT invalid — let the route handler deal with auth
        }
      }
    }
  }

  return createMiddleware(routing)(request)
}

export default middleware

export const config = {
  matcher: ['/', `/(${['en', 'fr', 'de', 'es', 'it', 'pl', 'ru', 'pt', 'zh'].join('|')})/:path*`]
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/morveus/github/uninspired && git add middleware.ts && git commit -m "feat: rewrite middleware for JWT session auth and CSRF"
```

---

### Task 6: Create login page

**Files:**
- Create: `app/[locale]/login/page.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`
- Modify: `messages/de.json`
- Modify: `messages/es.json`
- Modify: `messages/it.json`
- Modify: `messages/pl.json`
- Modify: `messages/ru.json`
- Modify: `messages/pt.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add translation keys to all message files**

Add an `"auth"` section to each message file. Example for `en.json` — add at the top level alongside `"wishlist"` and `"admin"`:

```json
"auth": {
  "login": "Log in",
  "username": "Username",
  "password": "Password",
  "loginButton": "Log in",
  "loginError": "Invalid username or password",
  "logout": "Log out",
  "changeCredentials": "Change credentials",
  "currentPassword": "Current password",
  "newUsername": "New username",
  "newPassword": "New password",
  "updateButton": "Update",
  "updateSuccess": "Credentials updated successfully",
  "updateError": "Failed to update credentials"
}
```

For `fr.json`:

```json
"auth": {
  "login": "Connexion",
  "username": "Nom d'utilisateur",
  "password": "Mot de passe",
  "loginButton": "Se connecter",
  "loginError": "Nom d'utilisateur ou mot de passe invalide",
  "logout": "Déconnexion",
  "changeCredentials": "Modifier les identifiants",
  "currentPassword": "Mot de passe actuel",
  "newUsername": "Nouveau nom d'utilisateur",
  "newPassword": "Nouveau mot de passe",
  "updateButton": "Mettre à jour",
  "updateSuccess": "Identifiants mis à jour avec succès",
  "updateError": "Échec de la mise à jour des identifiants"
}
```

For `de.json`:

```json
"auth": {
  "login": "Anmelden",
  "username": "Benutzername",
  "password": "Passwort",
  "loginButton": "Anmelden",
  "loginError": "Ungültiger Benutzername oder Passwort",
  "logout": "Abmelden",
  "changeCredentials": "Zugangsdaten ändern",
  "currentPassword": "Aktuelles Passwort",
  "newUsername": "Neuer Benutzername",
  "newPassword": "Neues Passwort",
  "updateButton": "Aktualisieren",
  "updateSuccess": "Zugangsdaten erfolgreich aktualisiert",
  "updateError": "Fehler beim Aktualisieren der Zugangsdaten"
}
```

For `es.json`:

```json
"auth": {
  "login": "Iniciar sesión",
  "username": "Nombre de usuario",
  "password": "Contraseña",
  "loginButton": "Iniciar sesión",
  "loginError": "Nombre de usuario o contraseña inválidos",
  "logout": "Cerrar sesión",
  "changeCredentials": "Cambiar credenciales",
  "currentPassword": "Contraseña actual",
  "newUsername": "Nuevo nombre de usuario",
  "newPassword": "Nueva contraseña",
  "updateButton": "Actualizar",
  "updateSuccess": "Credenciales actualizadas con éxito",
  "updateError": "Error al actualizar las credenciales"
}
```

For `it.json`:

```json
"auth": {
  "login": "Accedi",
  "username": "Nome utente",
  "password": "Password",
  "loginButton": "Accedi",
  "loginError": "Nome utente o password non validi",
  "logout": "Disconnetti",
  "changeCredentials": "Modifica credenziali",
  "currentPassword": "Password attuale",
  "newUsername": "Nuovo nome utente",
  "newPassword": "Nuova password",
  "updateButton": "Aggiorna",
  "updateSuccess": "Credenziali aggiornate con successo",
  "updateError": "Impossibile aggiornare le credenziali"
}
```

For `pl.json`:

```json
"auth": {
  "login": "Zaloguj się",
  "username": "Nazwa użytkownika",
  "password": "Hasło",
  "loginButton": "Zaloguj się",
  "loginError": "Nieprawidłowa nazwa użytkownika lub hasło",
  "logout": "Wyloguj",
  "changeCredentials": "Zmień dane logowania",
  "currentPassword": "Aktualne hasło",
  "newUsername": "Nowa nazwa użytkownika",
  "newPassword": "Nowe hasło",
  "updateButton": "Zaktualizuj",
  "updateSuccess": "Dane logowania zaktualizowane pomyślnie",
  "updateError": "Nie udało się zaktualizować danych logowania"
}
```

For `ru.json`:

```json
"auth": {
  "login": "Войти",
  "username": "Имя пользователя",
  "password": "Пароль",
  "loginButton": "Войти",
  "loginError": "Неверное имя пользователя или пароль",
  "logout": "Выйти",
  "changeCredentials": "Изменить учётные данные",
  "currentPassword": "Текущий пароль",
  "newUsername": "Новое имя пользователя",
  "newPassword": "Новый пароль",
  "updateButton": "Обновить",
  "updateSuccess": "Учётные данные успешно обновлены",
  "updateError": "Не удалось обновить учётные данные"
}
```

For `pt.json`:

```json
"auth": {
  "login": "Entrar",
  "username": "Nome de utilizador",
  "password": "Palavra-passe",
  "loginButton": "Entrar",
  "loginError": "Nome de utilizador ou palavra-passe inválidos",
  "logout": "Sair",
  "changeCredentials": "Alterar credenciais",
  "currentPassword": "Palavra-passe atual",
  "newUsername": "Novo nome de utilizador",
  "newPassword": "Nova palavra-passe",
  "updateButton": "Atualizar",
  "updateSuccess": "Credenciais atualizadas com sucesso",
  "updateError": "Falha ao atualizar as credenciais"
}
```

For `zh.json`:

```json
"auth": {
  "login": "登录",
  "username": "用户名",
  "password": "密码",
  "loginButton": "登录",
  "loginError": "用户名或密码无效",
  "logout": "退出",
  "changeCredentials": "修改凭据",
  "currentPassword": "当前密码",
  "newUsername": "新用户名",
  "newPassword": "新密码",
  "updateButton": "更新",
  "updateSuccess": "凭据更新成功",
  "updateError": "凭据更新失败"
}
```

- [ ] **Step 2: Create `app/[locale]/login/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        setError(t('loginError'))
        return
      }

      router.push(`/${params.locale}/admin`)
    } catch {
      setError(t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('login')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              placeholder={t('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <Input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
              ) : (
                t('loginButton')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/morveus/github/uninspired && git add app/\[locale\]/login/ messages/ && git commit -m "feat: add login page with i18n support (9 languages)"
```

---

### Task 7: Rewrite admin page — remove token, add auth, credentials form, loading states

**Files:**
- Create: `app/[locale]/admin/page.tsx` (replaces `app/[locale]/admin/[token]/page.tsx`)
- Delete: `app/[locale]/admin/[token]/page.tsx` (and directory)

- [ ] **Step 1: Delete the old token-based admin page**

```bash
rm -rf /home/morveus/github/uninspired/app/\[locale\]/admin/\[token\]
```

- [ ] **Step 2: Create `app/[locale]/admin/page.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WishlistTable } from '@/components/wishlist/WishlistTable'
import { WishlistItem } from '@prisma/client'
import Cookies from 'js-cookie'

export default function AdminPage() {
  const t = useTranslations('admin')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const params = useParams<{ locale: string }>()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    price: "",
    currency: "EUR",
    priority: "3"
  })
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [shouldScrape, setShouldScrape] = useState(true)
  const [showOfferedBy, setShowOfferedBy] = useState(false)

  // Credentials form
  const [credForm, setCredForm] = useState({ currentPassword: "", newUsername: "", newPassword: "" })
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)

  const csrfToken = Cookies.get('csrf-token') || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          priority: parseInt(formData.priority),
        }),
      })

      if (!response.ok) throw new Error('Failed to create wish')

      setFormData({
        title: "", description: "", url: "", image: "",
        price: "", currency: "EUR", priority: "3"
      })

      fetchItems()
    } catch (error) {
      console.error('Error creating wish:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    const previousItems = items
    setItems(items.filter(item => item.id !== id))

    try {
      const response = await fetch(`/api/wishlist/${id}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      })

      if (!response.ok) {
        setItems(previousItems)
        throw new Error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const scrapeUrl = async (url: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) throw new Error('Failed to scrape URL')

      const data = await response.json()

      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        image: data.image || prev.image,
        price: data.price?.toString() || prev.price,
      }))
    } catch (error) {
      console.error('Error scraping URL:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setFormData({ ...formData, url: newUrl })
    if (shouldScrape && newUrl) {
      scrapeUrl(newUrl)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    router.push(`/${params.locale}/login`)
  }

  const handleCredentialsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingCreds(true)
    setCredMessage(null)

    try {
      const response = await fetch('/api/auth/credentials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(credForm),
      })

      if (!response.ok) {
        const data = await response.json()
        setCredMessage({ type: 'error', text: data.error || tAuth('updateError') })
        return
      }

      setCredMessage({ type: 'success', text: tAuth('updateSuccess') })
      setCredForm({ currentPassword: "", newUsername: "", newPassword: "" })
    } catch {
      setCredMessage({ type: 'error', text: tAuth('updateError') })
    } finally {
      setIsUpdatingCreds(false)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleLogout}>{tAuth('logout')}</Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('addWish')}</CardTitle>
          <CardDescription>{t('addWishDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder={t('url')}
                type="url"
                value={formData.url}
                onChange={handleUrlChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="scrape"
                checked={shouldScrape}
                onChange={(e) => setShouldScrape(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="scrape">{t('scrapeUrl')}</label>
            </div>
            <div className="space-y-2">
              <Input
                placeholder={t('title')}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder={t('description')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder={t('image')}
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <Input
                placeholder={t('price')}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({...formData, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('highPriority')}</SelectItem>
                  <SelectItem value="2">{t('mediumPriority')}</SelectItem>
                  <SelectItem value="3">{t('lowPriority')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
              ) : (
                t('addWishButton')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{t('wishlistItems')}</h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showOfferedBy"
              checked={showOfferedBy}
              onChange={(e) => setShowOfferedBy(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showOfferedBy">{t('showOfferedBy')}</label>
          </div>
        </div>
        <WishlistTable
          items={items}
          onDelete={handleDelete}
          showOfferedBy={showOfferedBy}
          deletingId={deletingId}
        />
      </div>

      {/* Credentials update section */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{tAuth('changeCredentials')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleCredentialsUpdate}>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder={tAuth('currentPassword')}
              value={credForm.currentPassword}
              onChange={(e) => setCredForm({...credForm, currentPassword: e.target.value})}
              required
            />
            <Input
              placeholder={tAuth('newUsername')}
              value={credForm.newUsername}
              onChange={(e) => setCredForm({...credForm, newUsername: e.target.value})}
            />
            <Input
              type="password"
              placeholder={tAuth('newPassword')}
              value={credForm.newPassword}
              onChange={(e) => setCredForm({...credForm, newPassword: e.target.value})}
            />
            {credMessage && (
              <p className={credMessage.type === 'success' ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                {credMessage.text}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isUpdatingCreds}>
              {isUpdatingCreds ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
              ) : (
                tAuth('updateButton')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/morveus/github/uninspired && git add -A app/\[locale\]/admin/ && git commit -m "feat: rewrite admin page with session auth, credentials form, loading states"
```

---

### Task 8: Update API routes — remove token auth, add session + CSRF + rate limiting

**Files:**
- Modify: `app/api/wishlist/route.ts`
- Modify: `app/api/wishlist/[id]/route.ts`
- Modify: `app/api/scrape/route.ts`

- [ ] **Step 1: Rewrite `app/api/wishlist/route.ts`**

Replace full contents:

```typescript
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getSessionFromCookies } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const sort = searchParams.get('sort') || 'price-asc'
    const [field, order] = sort.split('-')

    const orderBy: Prisma.WishlistItemOrderByWithRelationInput[] = []

    if (field === 'priority') {
      orderBy.push({ priority: order as Prisma.SortOrder })
    } else if (field === 'price') {
      orderBy.push({ price: order as Prisma.SortOrder })
    }

    orderBy.push({ createdAt: 'desc' })

    const unpurchasedItems = await prisma.wishlistItem.findMany({
      where: { purchased: false },
      orderBy,
    })

    const purchasedItems = await prisma.wishlistItem.findMany({
      where: { purchased: true },
      orderBy,
    })

    const items = [...unpurchasedItems, ...purchasedItems]

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching wishlist items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const itemData = await request.json()

    const item = await prisma.wishlistItem.create({
      data: itemData,
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to create wishlist item' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Rewrite `app/api/wishlist/[id]/route.ts`**

Replace full contents:

```typescript
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const id = parseInt(params.id)
    const json = await request.json()

    const updatedItem = await prisma.wishlistItem.update({
      where: { id },
      data: json,
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to update wishlist item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const id = parseInt(searchParams.get('id') || '', 10)

  try {
    await prisma.wishlistItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to delete wishlist item' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Update `app/api/scrape/route.ts` — add auth + rate limiting**

Replace full contents:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { getSessionFromCookies } from '@/lib/auth'
import { validateCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`api:${ip}`, 30, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const { url } = await request.json()

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content')
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')
    const image = $('meta[property="og:image"]').attr('content')
    const price = $('[itemprop="price"]').attr('content') ||
                 $('.price').first().text().trim()

    return NextResponse.json({ title, description, image, price })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/morveus/github/uninspired && git add app/api/wishlist/ app/api/scrape/ && git commit -m "feat: replace token auth with session auth, add CSRF and rate limiting to all API routes"
```

---

### Task 9: Optimistic update in WishCard + remove dead code

**Files:**
- Modify: `components/wishlist/Wishcard.tsx`
- Modify: `app/[locale]/wishlist/page.tsx`

- [ ] **Step 1: Update `app/[locale]/wishlist/page.tsx` — lift purchase handler up for optimistic update**

Replace full contents:

```tsx
"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { WishCard } from "@/components/wishlist/Wishcard"
import { SortSelector } from "@/components/wishlist/SortSelector"
import { CheckboxWithTooltip } from "@/components/wishlist/CheckboxWithTooltip"

interface WishlistItem {
  id: number
  title: string
  description: string | null
  url: string | null
  image: string | null
  currency: string | null
  price: number | null
  priority: number
  purchased: boolean
  purchasedAt: Date | null
  purchasedBy: string | null
  createdAt: Date
  updatedAt: Date
}

type SortOption = 'priority-asc' | 'priority-desc' | 'price-asc' | 'price-desc'

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('price-asc')
  const [showPurchased, setShowPurchased] = useState(false)
  const t = useTranslations('wishlist')
  const userName = process.env.NEXT_PUBLIC_USER_NAME

  useEffect(() => {
    fetch(`/api/wishlist?sort=${sort}`)
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching wishlist items:', err)
        setError('Failed to load wishlist items')
        setLoading(false)
      })
  }, [sort])

  const handlePurchase = async (itemId: number, purchaserName: string) => {
    const previousItems = items
    const now = new Date()

    // Optimistic update
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, purchased: true, purchasedBy: purchaserName, purchasedAt: now }
        : item
    ))

    try {
      const response = await fetch(`/api/wishlist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchased: true,
          purchasedBy: purchaserName,
          purchasedAt: now,
        }),
      })

      if (!response.ok) {
        setItems(previousItems)
        throw new Error('Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      setItems(previousItems)
    }
  }

  const displayedItems = showPurchased
    ? items
    : items.filter(item => !item.purchased)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('wishlist', {username: userName})}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
            <p className="text-muted-foreground">
              {items.filter(item => !item.purchased).length} {t('itemsinthewishlist')}
            </p>
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <SortSelector value={sort} onChange={(value: SortOption) => setSort(value)} />
            <CheckboxWithTooltip
              checked={showPurchased}
              onChange={setShowPurchased}
              label={t('showPurchased')}
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('loadingwishlist')}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {displayedItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <WishCard item={item} onPurchase={handlePurchase} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `components/wishlist/Wishcard.tsx` — accept onPurchase prop, remove dead code**

Replace full contents:

```tsx
'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { WishlistItem } from '@prisma/client'
import { PurchaseDialog } from './PurchaseDialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface WishCardProps {
  item: WishlistItem
  onPurchase: (itemId: number, purchaserName: string) => Promise<void>
}

export function WishCard({ item, onPurchase }: WishCardProps) {
  const t = useTranslations('wishlist')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePurchase = async (purchaserName: string) => {
    await onPurchase(item.id, purchaserName)
    setIsDialogOpen(false)
  }

  return (
    <div className={cn(
      "bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden",
      item.purchased && "opacity-60 bg-muted"
    )}>
      {item.image && (
        <div className="relative h-48 w-full">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </a>
          ) : (
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
            />
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <h3 className="font-semibold text-lg">{item.title}</h3>
            </a>
          ) : (
            <h3 className="font-semibold text-lg">{item.title}</h3>
          )}
          <div className="flex items-center gap-2">
            {item.priority === 1 && <span className="text-red-500">⭐⭐⭐</span>}
            {item.priority === 2 && <span className="text-amber-500">⭐⭐</span>}
            {item.priority === 3 && <span className="text-yellow-500">⭐</span>}
          </div>
        </div>

        {item.description && (
          <p className="text-muted-foreground mt-2">{item.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          {item.price && (
            <p className="font-medium">
              {item.currency || '€'} {item.price.toFixed(2)}
            </p>
          )}
          {!item.purchased && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              {t('offer')} 🎁
            </button>
          )}
        </div>

        {item.purchased && (
          <div className="mt-4 text-sm text-muted-foreground text-red-500">
            {t('purchasedBy', {
              name: item.purchasedBy || t('someone'),
              date: new Date(item.purchasedAt!).toLocaleDateString()
            })}
          </div>
        )}
      </div>

      <PurchaseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handlePurchase}
        itemTitle={item.title}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/morveus/github/uninspired && git add components/wishlist/Wishcard.tsx app/\[locale\]/wishlist/page.tsx && git commit -m "feat: optimistic purchase update, remove dead code from WishCard"
```

---

### Task 10: Update WishlistTable for loading state on delete

**Files:**
- Modify: `components/wishlist/WishlistTable.tsx`

- [ ] **Step 1: Update `WishlistTable` to accept and display `deletingId`**

Replace full contents:

```tsx
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { WishlistItem } from "@prisma/client"

interface WishlistTableProps {
  items: WishlistItem[]
  onDelete: (id: number) => void
  showOfferedBy?: boolean
  deletingId?: number | null
}

export function WishlistTable({
  items,
  onDelete,
  showOfferedBy = false,
  deletingId = null,
}: WishlistTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            {showOfferedBy && <TableHead>Offered By</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium max-w-[100px] truncate">
                {item.title}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.description || '-'}
              </TableCell>
              <TableCell>
                {item.price
                  ? `${item.price} ${item.currency || 'EUR'}`
                  : '-'
                }
              </TableCell>
              {showOfferedBy && <TableCell>{item.purchasedBy || '-'}</TableCell>}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/morveus/github/uninspired && git add components/wishlist/WishlistTable.tsx && git commit -m "feat: add loading state to delete button in WishlistTable"
```

---

### Task 11: Clean up remaining dead code and update home page

**Files:**
- Delete: `auth.ts` (root)
- Modify: `app/[locale]/page.tsx`
- Modify: `Dockerfile`

- [ ] **Step 1: Delete root `auth.ts`**

```bash
rm /home/morveus/github/uninspired/auth.ts
```

- [ ] **Step 2: Remove commented-out login button from `app/[locale]/page.tsx`**

In `app/[locale]/page.tsx`, remove lines 40-42 (the commented-out button):

```tsx
            {/* <Button size="lg" className="font-medium">
              {t('login')}
            </Button> */}
```

Remove those 3 lines entirely.

- [ ] **Step 3: Update `Dockerfile` — remove LOGIN_TOKEN reference, add openssl for JWT_SECRET**

The Dockerfile already has `apk add --no-cache openssl`. No changes needed to the Dockerfile itself since `start.sh` handles the env vars. But verify the `COPY *.ts ./` line in the Dockerfile won't fail now that `auth.ts` is deleted — it won't, because `middleware.ts` and other root `.ts` files still exist.

- [ ] **Step 4: Commit**

```bash
cd /home/morveus/github/uninspired && git add -A && git commit -m "chore: remove dead code (auth.ts, commented-out login button)"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run Prisma generate to verify schema**

```bash
cd /home/morveus/github/uninspired && npx prisma generate
```

Expected: Success, no errors.

- [ ] **Step 2: Run linter**

```bash
cd /home/morveus/github/uninspired && npm run lint
```

Expected: No errors.

- [ ] **Step 3: Run build**

```bash
cd /home/morveus/github/uninspired && JWT_SECRET=test-secret-for-build NEXT_PUBLIC_USER_NAME=Test npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Fix any issues found, then final commit if needed**
