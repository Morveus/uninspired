import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    
    // Validate admin token
    if (json.token !== process.env.LOGIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.wishlistItem.delete({
      where: {
        id: parseInt(params.id),
      },
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