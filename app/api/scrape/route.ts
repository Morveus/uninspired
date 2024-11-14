import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // These selectors will need to be adjusted based on the target websites
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