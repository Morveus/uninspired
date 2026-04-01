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
