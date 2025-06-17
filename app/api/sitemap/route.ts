import { NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'
import fs from 'fs'
import path from 'path'

function readRedirectsFromFile(): { [slug: string]: any } {
  try {
    const filePath = path.join(process.cwd(), 'redirects.json')
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(fileContent)
    }
    return {}
  } catch (error) {
    console.error('Error reading redirects from file:', error)
    return {}
  }
}

export async function GET() {
  try {
    let redirects: { [slug: string]: any } = {}
    
    try {
      const redirectsSnapshot = await adminDb.collection('redirects').get()
      redirectsSnapshot.forEach((doc) => {
        redirects[doc.id] = doc.data()
      })
    } catch (error) {
      console.log('Error reading from Firebase, trying file fallback:', error)
      // Fallback to file-based data
      redirects = readRedirectsFromFile()
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
    
    // Add each redirect slug
    Object.entries(redirects).forEach(([slug]) => {
      const escapedSlug = encodeURIComponent(slug)
      
      sitemap += `
  <url>
    <loc>${baseUrl}/${escapedSlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
    })
    
    sitemap += `
</urlset>`
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    )
  }
}