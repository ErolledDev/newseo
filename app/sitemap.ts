import { MetadataRoute } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
  
  // Read redirects from JSON file
  let redirects = {}
  try {
    const filePath = path.join(process.cwd(), 'redirects.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    redirects = JSON.parse(fileContents)
  } catch (error) {
    console.log('No redirects.json found, generating basic sitemap')
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