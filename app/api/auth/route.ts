import { NextResponse } from 'next/server'
import { signIn } from '@/auth'
 
export async function POST(
  req: Request
) {
  try {
    const { username, password } = await req.json()
    await signIn('credentials', { username, password })
 
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error signing in:', error)
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}