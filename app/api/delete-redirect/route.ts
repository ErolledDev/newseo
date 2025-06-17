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

export async function DELETE(request: NextRequest) {
  try {
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
    
    let useFirebase = false
    let deletedItem: any = null
    
    try {
      // Try Firebase first with timeout
      const docRef = adminDb.collection('redirects').doc(trimmedSlug)
      const doc = await Promise.race([
        docRef.get(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
        )
      ])
      
      if (!doc.exists) {
        throw new Error('Document not found in Firebase')
      }
      
      deletedItem = doc.data()
      await docRef.delete()
      useFirebase = true
      console.log(`Successfully deleted from Firebase: ${trimmedSlug}`)
    } catch (firebaseError) {
      console.warn('Firebase delete failed, using file fallback:', firebaseError?.message || firebaseError)
      
      // Fallback to file storage
      const redirects = readRedirectsFromFile()
      
      if (!redirects[trimmedSlug]) {
        console.error(`Redirect "${trimmedSlug}" not found in file`)
        return NextResponse.json(
          { error: `Redirect "${trimmedSlug}" not found` },
          { status: 404 }
        )
      }
      
      deletedItem = redirects[trimmedSlug]
      delete redirects[trimmedSlug]
      writeRedirectsToFile(redirects)
      console.log(`Successfully deleted from file: ${trimmedSlug}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Redirect "${trimmedSlug}" deleted successfully`,
      deletedSlug: trimmedSlug,
      storage: useFirebase ? 'firebase' : 'file'
    })
    
  } catch (error) {
    console.error('Unexpected error deleting redirect:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}