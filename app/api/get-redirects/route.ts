import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'redirects.json')
    
    try {
      const fileContents = await fs.readFile(filePath, 'utf8')
      const redirects = JSON.parse(fileContents)
      return NextResponse.json(redirects)
    } catch (error) {
      // File doesn't exist, return empty object
      return NextResponse.json({})
    }
  } catch (error) {
    console.error('Error reading redirects:', error)
    return NextResponse.json(
      { error: 'Failed to read redirects' },
      { status: 500 }
    )
  }
}