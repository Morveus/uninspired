import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const items = await prisma.wishlistItem.findMany({
      orderBy: [
        { purchased: 'asc' },  // false comes before true
        { createdAt: 'desc' }, // newest first within each purchased group
      ],
    })
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