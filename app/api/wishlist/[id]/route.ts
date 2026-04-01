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
