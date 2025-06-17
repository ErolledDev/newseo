import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'
import fs from 'fs'
import path from 'path'

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

interface RedirectData extends Omit<FormData, 'slug'> {
  createdAt: string
  updatedAt: string
  analytics: {
    views: number
    clicks: number
    lastViewed: string
    lastClicked: string
  }
}

// Fallback to JSON file storage
const getRedirectsFilePath = () => path.join(process.cwd(), 'redirects.json')

const readRedirectsFromFile = (): { [slug: string]: RedirectData } => {
  try {
    const filePath = getRedirectsFilePath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
    return {}
  } catch (error) {
    console.error('Error reading redirects file:', error)
    return {}
  }
}

const writeRedirectsToFile = (redirects: { [slug: string]: RedirectData }) => {
  try {
    const filePath = getRedirectsFilePath()
    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(redirects, null, 2))
  } catch (error) {
    console.error('Error writing redirects file:', error)
    throw error
  }
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
        .substring(0, 100)
    }
    
    // Ensure slug is valid
    if (!slug) {
      slug = 'redirect-' + Date.now()
    }
    
    // Create redirect data object
    const redirectData: RedirectData = {
      title: data.title.trim(),
      desc: data.desc.trim(),
      url: data.url.trim(),
      image: data.image ? data.image.trim() : '',
      keywords: data.keywords ? data.keywords.trim() : '',
      site_name: data.site_name ? data.site_name.trim() : '',
      type: data.type || 'website',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analytics: {
        views: 0,
        clicks: 0,
        lastViewed: '',
        lastClicked: ''
      }
    }
    
    let useFirebase = false
    let errorMessage = ''
    
    try {
      // Try Firebase first
      await adminDb.collection('redirects').doc(slug).set(redirectData)
      useFirebase = true
      console.log(`Successfully saved to Firebase: ${slug}`)
    } catch (firebaseError) {
      console.warn('Firebase save failed, using file fallback:', firebaseError?.message || firebaseError)
      errorMessage = firebaseError?.message || 'Firebase connection failed'
      
      // Fallback to file storage
      try {
        const redirects = readRedirectsFromFile()
        
        // Check if slug already exists (for new redirects, not updates)
        if (!data.slug && redirects[slug]) {
          slug = `${slug}-${Date.now()}`
        }
        
        redirects[slug] = redirectData
        writeRedirectsToFile(redirects)
        console.log(`Successfully saved to file: ${slug}`)
      } catch (fileError) {
        console.error('File storage also failed:', fileError)
        return NextResponse.json(
          { error: 'Failed to save redirect. Both Firebase and file storage failed.' },
          { status: 500 }
        )
      }
    }
    
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
    
    return NextResponse.json({
      long: longUrl,
      short: shortUrl,
      slug: slug,
      success: true,
      storage: useFirebase ? 'firebase' : 'file',
      ...(errorMessage && { warning: `Firebase failed (${errorMessage}), used file storage as fallback` })
    })
    
  } catch (error) {
    console.error('Error creating redirect:', error)
    
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