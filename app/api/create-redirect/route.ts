import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'

interface FormData {
  title: string
  desc: string
  url: string
  image: string
  keywords: string
  site_name: string
  type: string
  slug: string
}

export async function POST(request: NextRequest) {
  try {
    const data: FormData = await request.json()
    
    // Validate required fields
    if (!data.title || !data.desc || !data.url) {
      return NextResponse.json(
        { error: 'Title, description, and URL are required' },
        { status: 400 }
      )
    }
    
    // Generate slug if not provided
    let slug = data.slug
    if (!slug) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 100) // Limit slug length
    }
    
    // Ensure slug is valid
    if (!slug) {
      slug = 'redirect-' + Date.now()
    }
    
    // Check if slug already exists (for new redirects, not updates)
    if (!data.slug) {
      const existingDoc = await adminDb.collection('redirects').doc(slug).get()
      if (existingDoc.exists) {
        // If slug exists, append timestamp
        slug = `${slug}-${Date.now()}`
      }
    }
    
    // Create redirect data object
    const redirectData = {
      title: data.title.trim(),
      desc: data.desc.trim(),
      url: data.url.trim(),
      image: data.image ? data.image.trim() : '',
      keywords: data.keywords ? data.keywords.trim() : '',
      site_name: data.site_name ? data.site_name.trim() : '',
      type: data.type || 'website',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add or update redirect in Firestore
    await adminDb.collection('redirects').doc(slug).set(redirectData)
    
    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      title: redirectData.title,
      desc: redirectData.desc,
      url: redirectData.url,
      ...(redirectData.image && { image: redirectData.image }),
      ...(redirectData.keywords && { keywords: redirectData.keywords }),
      ...(redirectData.site_name && { site_name: redirectData.site_name }),
      type: redirectData.type
    })
    
    const longUrl = `${baseUrl}/u?${params.toString()}`
    const shortUrl = `${baseUrl}/${slug}`
    
    console.log(`Successfully created/updated redirect: ${slug}`)
    
    return NextResponse.json({
      long: longUrl,
      short: shortUrl,
      slug: slug,
      success: true
    })
    
  } catch (error) {
    console.error('Error creating redirect:', error)
    
    // Provide more specific error messages
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON data provided' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create redirect. Please try again.' },
      { status: 500 }
    )
  }
}