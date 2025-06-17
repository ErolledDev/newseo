import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    let redirects: { [slug: string]: any } = {}
    let useFirebase = false
    
    try {
      // Try Firebase first with timeout
      const redirectsSnapshot = await Promise.race([
        adminDb.collection('redirects').get(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
        )
      ])
      
      redirectsSnapshot.forEach((doc: any) => {
        const data = doc.data()
        // Remove Firebase-specific fields before sending to client
        const { createdAt, updatedAt, ...redirectData } = data
        redirects[doc.id] = redirectData
      })
      
      useFirebase = true
      console.log('Successfully loaded from Firebase')
    } catch (firebaseError) {
      console.warn('Firebase read failed, using file fallback:', firebaseError?.message || firebaseError)
      
      // Fallback to file storage
      const fileRedirects = readRedirectsFromFile()
      
      // Remove server-side fields before sending to client
      Object.keys(fileRedirects).forEach(slug => {
        const { createdAt, updatedAt, analytics, ...redirectData } = fileRedirects[slug]
        redirects[slug] = redirectData
      })
      
      console.log('Successfully loaded from file')
    }
    
    return NextResponse.json(redirects, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      }
    })
  } catch (error) {
    console.error('Error reading redirects:', error)
    return NextResponse.json(
      { error: 'Failed to read redirects' },
      { status: 500 }
    )
  }
}