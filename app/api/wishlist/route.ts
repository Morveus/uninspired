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
