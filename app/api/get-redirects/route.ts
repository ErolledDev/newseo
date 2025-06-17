import { NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'

export async function GET() {
  try {
    const redirectsSnapshot = await adminDb.collection('redirects').get()
    const redirects: { [slug: string]: any } = {}
    
    redirectsSnapshot.forEach((doc) => {
      const data = doc.data()
      // Remove Firebase-specific fields before sending to client
      const { createdAt, updatedAt, ...redirectData } = data
      redirects[doc.id] = redirectData
    })
    
    return NextResponse.json(redirects)
  } catch (error) {
    console.error('Error reading redirects:', error)
    return NextResponse.json(
      { error: 'Failed to read redirects' },
      { status: 500 }
    )
  }
}