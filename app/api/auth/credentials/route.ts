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
