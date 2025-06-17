import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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
    
    const filePath = path.join(process.cwd(), 'redirects.json')
    
    try {
      // Check if file exists
      await fs.access(filePath)
    } catch (accessError) {
      console.error('Redirects file not found:', accessError)
      return NextResponse.json(
        { error: 'Redirects file not found' },
        { status: 404 }
      )
    }
    
    let redirects: Record<string, any> = {}
    
    try {
      // Read and parse the file
      const fileContents = await fs.readFile(filePath, 'utf8')
      redirects = JSON.parse(fileContents)
      console.log('Current redirects keys:', Object.keys(redirects))
    } catch (readError) {
      console.error('Error reading or parsing redirects file:', readError)
      return NextResponse.json(
        { error: 'Failed to read redirects file' },
        { status: 500 }
      )
    }
    
    // Check if redirect exists
    if (!redirects[trimmedSlug]) {
      console.error(`Redirect "${trimmedSlug}" not found in:`, Object.keys(redirects))
      return NextResponse.json(
        { error: `Redirect "${trimmedSlug}" not found` },
        { status: 404 }
      )
    }
    
    // Store the deleted item for logging
    const deletedItem = redirects[trimmedSlug]
    
    // Delete the redirect
    delete redirects[trimmedSlug]
    
    try {
      // Write the updated data back to the file
      await fs.writeFile(filePath, JSON.stringify(redirects, null, 2), 'utf8')
      
      console.log(`Successfully deleted redirect: ${trimmedSlug}`, deletedItem)
      
      return NextResponse.json({ 
        success: true, 
        message: `Redirect "${trimmedSlug}" deleted successfully`,
        deletedSlug: trimmedSlug
      })
      
    } catch (writeError) {
      console.error('Error writing to file:', writeError)
      
      // Try to restore the deleted item if write failed
      redirects[trimmedSlug] = deletedItem
      
      return NextResponse.json(
        { error: 'Failed to save changes. Please try again.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Unexpected error deleting redirect:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}