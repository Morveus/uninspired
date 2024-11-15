import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sort = searchParams.get('sort') || 'price-asc'
    const [field, order] = sort.split('-')

    const orderBy: Prisma.WishlistItemOrderByWithRelationInput[] = []

    // Add sorting based on query parameter first
    if (field === 'priority') {
      orderBy.push({ priority: order as Prisma.SortOrder })
    } else if (field === 'price') {
      orderBy.push({ price: order as Prisma.SortOrder })
    }

    // Add creation date as secondary sorting criteria
    orderBy.push({ createdAt: 'desc' })

    // Get unpurchased items
    const unpurchasedItems = await prisma.wishlistItem.findMany({
      where: { purchased: false },
      orderBy,
    })

    // Get purchased items
    const purchasedItems = await prisma.wishlistItem.findMany({
      where: { purchased: true },
      orderBy,
    })

    // Combine the results with purchased items at the end
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

export async function POST(request: Request) {
  try {
    const json = await request.json()
    
    // Validate admin token
    if (json.token !== process.env.LOGIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove token from data before saving
    const { token, ...itemData } = json
    console.log(token)

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