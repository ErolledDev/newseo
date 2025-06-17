import { MetadataRoute } from 'next'
import { adminDb } from '../lib/firebase-admin'
import fs from 'fs'
import path from 'path'

function readRedirectsFromFile(): { [slug: string]: any } {
  try {
    const filePath = path.join(process.cwd(), 'redirects.json')
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(fileContent)
    }
    return {}
  } catch (error) {
    console.error('Error reading redirects from file:', error)
    return {}
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
  
  // Read redirects from Firestore
  let redirects: { [slug: string]: any } = {}
  try {
    const redirectsSnapshot = await adminDb.collection('redirects').get()
    redirectsSnapshot.forEach((doc) => {
      redirects[doc.id] = doc.data()
    })
  } catch (error) {
    console.log('Error reading from Firebase, trying file fallback:', error)
    // Fallback to file-based data
    redirects = readRedirectsFromFile()
  }

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Add dynamic routes from redirects
  Object.keys(redirects).forEach((slug) => {
    routes.push({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  })

  return routes
}