import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '../../../lib/firebase-admin'

export async function DELETE(request: NextRequest) {
  try {
    // Get slug from URL query parameters instead of request body
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.error('Invalid or missing slug in query parameters')
      return NextResponse.json(
        { error: 'Valid slug is required as query parameter' },
        { status: 400 }
      )
    }
    
    const trimmedSlug = slug.trim()
    console.log('Processing delete for slug:', trimmedSlug)
    
    // Check if redirect exists
    const docRef = adminDb.collection('redirects').doc(trimmedSlug)
    const doc = await docRef.get()
    
    if (!doc.exists) {
      console.error(`Redirect "${trimmedSlug}" not found`)
      return NextResponse.json(
        { error: `Redirect "${trimmedSlug}" not found` },
        { status: 404 }
      )
    }
    
    // Store the deleted item for logging
    const deletedItem = doc.data()
    
    // Delete the redirect
    await docRef.delete()
    
    console.log(`Successfully deleted redirect: ${trimmedSlug}`, deletedItem)
    
    return NextResponse.json({ 
      success: true, 
      message: `Redirect "${trimmedSlug}" deleted successfully`,
      deletedSlug: trimmedSlug
    })
    
  } catch (error) {
    console.error('Unexpected error deleting redirect:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}