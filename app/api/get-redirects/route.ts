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
    
    try {
      // Try Firebase first
      const redirectsSnapshot = await adminDb.collection('redirects').get()
      redirectsSnapshot.forEach((doc: any) => {
        const data = doc.data()
        // Remove Firebase-specific fields before sending to client
        const { createdAt, updatedAt, ...redirectData } = data
        redirects[doc.id] = redirectData
      })
      
      console.log('Successfully loaded from Firebase')
    } catch (firebaseError) {
      console.warn('Firebase read failed, using file fallback:', firebaseError)
      
      // Fallback to file storage
      const fileRedirects = readRedirectsFromFile()
      
      // Remove server-side fields before sending to client
      Object.keys(fileRedirects).forEach(slug => {
        const { createdAt, updatedAt, analytics, ...redirectData } = fileRedirects[slug]
        redirects[slug] = redirectData
      })
      
      console.log('Successfully loaded from file')
    }
    
    return NextResponse.json(redirects)
  } catch (error) {
    console.error('Error reading redirects:', error)
    return NextResponse.json(
      { error: 'Failed to read redirects' },
      { status: 500 }
    )
  }
}