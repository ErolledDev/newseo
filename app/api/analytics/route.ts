import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'
import fs from 'fs'
import path from 'path'

// Fallback to JSON file storage
const getRedirectsFilePath = () => path.join(process.cwd(), 'redirects.json')

const readRedirectsFromFile = () => {
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

const writeRedirectsToFile = (redirects: any) => {
  try {
    const filePath = getRedirectsFilePath()
    fs.writeFileSync(filePath, JSON.stringify(redirects, null, 2))
  } catch (error) {
    console.error('Error writing redirects file:', error)
    throw error
  }
}

// GET - Fetch analytics data
export async function GET() {
  try {
    let analytics: { [slug: string]: any } = {}
    
    try {
      // Try Firebase first
      const redirectsSnapshot = await adminDb.collection('redirects').get()
      redirectsSnapshot.forEach((doc: any) => {
        const data = doc.data()
        analytics[doc.id] = {
          title: data.title,
          analytics: data.analytics || {
            views: 0,
            clicks: 0,
            lastViewed: '',
            lastClicked: ''
          }
        }
      })
      console.log('Successfully loaded analytics from Firebase')
    } catch (firebaseError) {
      console.warn('Firebase analytics read failed, using file fallback:', firebaseError)
      
      // Fallback to file storage
      const fileRedirects = readRedirectsFromFile()
      
      Object.keys(fileRedirects).forEach(slug => {
        const data = fileRedirects[slug]
        analytics[slug] = {
          title: data.title,
          analytics: data.analytics || {
            views: 0,
            clicks: 0,
            lastViewed: '',
            lastClicked: ''
          }
        }
      })
      console.log('Successfully loaded analytics from file')
    }
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error reading analytics:', error)
    return NextResponse.json(
      { error: 'Failed to read analytics' },
      { status: 500 }
    )
  }
}

// POST - Track analytics event
export async function POST(request: NextRequest) {
  try {
    const { slug, event } = await request.json()
    
    if (!slug || !event) {
      return NextResponse.json(
        { error: 'Slug and event are required' },
        { status: 400 }
      )
    }
    
    if (!['view', 'click'].includes(event)) {
      return NextResponse.json(
        { error: 'Event must be either "view" or "click"' },
        { status: 400 }
      )
    }
    
    const now = new Date().toISOString()
    let useFirebase = true
    
    try {
      // Try Firebase first
      const docRef = adminDb.collection('redirects').doc(slug)
      const doc = await docRef.get()
      
      if (!doc.exists) {
        throw new Error('Document not found in Firebase')
      }
      
      const data = doc.data()
      const currentAnalytics = data.analytics || {
        views: 0,
        clicks: 0,
        lastViewed: '',
        lastClicked: ''
      }
      
      if (event === 'view') {
        currentAnalytics.views += 1
        currentAnalytics.lastViewed = now
      } else if (event === 'click') {
        currentAnalytics.clicks += 1
        currentAnalytics.lastClicked = now
      }
      
      await docRef.update({
        analytics: currentAnalytics,
        updatedAt: now
      })
      
      console.log(`Successfully tracked ${event} for ${slug} in Firebase`)
    } catch (firebaseError) {
      console.warn('Firebase analytics update failed, using file fallback:', firebaseError)
      useFirebase = false
      
      // Fallback to file storage
      const redirects = readRedirectsFromFile()
      
      if (!redirects[slug]) {
        return NextResponse.json(
          { error: 'Redirect not found' },
          { status: 404 }
        )
      }
      
      const currentAnalytics = redirects[slug].analytics || {
        views: 0,
        clicks: 0,
        lastViewed: '',
        lastClicked: ''
      }
      
      if (event === 'view') {
        currentAnalytics.views += 1
        currentAnalytics.lastViewed = now
      } else if (event === 'click') {
        currentAnalytics.clicks += 1
        currentAnalytics.lastClicked = now
      }
      
      redirects[slug].analytics = currentAnalytics
      redirects[slug].updatedAt = now
      
      writeRedirectsToFile(redirects)
      console.log(`Successfully tracked ${event} for ${slug} in file`)
    }
    
    return NextResponse.json({
      success: true,
      event,
      slug,
      storage: useFirebase ? 'firebase' : 'file'
    })
    
  } catch (error) {
    console.error('Error tracking analytics:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    )
  }
}