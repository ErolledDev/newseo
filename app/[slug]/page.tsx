import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { adminDb } from '../../lib/firebase-admin'
import SlugRedirectPage from './SlugRedirectPage'

interface RedirectData {
  title: string
  desc: string
  url: string
  image: string
  keywords: string
  site_name: string
  type: string
}

interface RedirectsData {
  [slug: string]: RedirectData
}

async function getRedirectData(slug: string): Promise<RedirectData | null> {
  try {
    const doc = await adminDb.collection('redirects').doc(slug).get()
    if (doc.exists) {
      const data = doc.data()
      // Remove Firebase-specific fields
      const { createdAt, updatedAt, ...redirectData } = data
      return redirectData as RedirectData
    }
    return null
  } catch (error) {
    console.error('Error reading redirect data:', error)
    return null
  }
}

async function getAllRedirects(): Promise<RedirectsData> {
  try {
    const redirectsSnapshot = await adminDb.collection('redirects').get()
    const redirects: RedirectsData = {}
    
    redirectsSnapshot.forEach((doc) => {
      const data = doc.data()
      // Remove Firebase-specific fields
      const { createdAt, updatedAt, ...redirectData } = data
      redirects[doc.id] = redirectData as RedirectData
    })
    
    return redirects
  } catch (error) {
    console.error('Error reading redirects:', error)
    return {}
  }
}

export async function generateStaticParams() {
  try {
    const redirects = await getAllRedirects()
    
    return Object.keys(redirects).map((slug) => ({
      slug: slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const data = await getRedirectData(params.slug)
  
  if (!data) {
    return {
      title: 'Page Not Found | seo360',
      description: 'The requested page could not be found.',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
  const canonicalUrl = `${baseUrl}/${params.slug}`

  return {
    title: `${data.title} | seo360`,
    description: data.desc,
    keywords: data.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: data.title,
      description: data.desc,
      type: data.type as any,
      images: data.image ? [data.image] : [],
      siteName: data.site_name,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.desc,
      images: data.image ? [data.image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function SlugPage({ params }: { params: { slug: string } }) {
  const data = await getRedirectData(params.slug)
  const allRedirects = await getAllRedirects()
  
  if (!data) {
    notFound()
  }

  return <SlugRedirectPage data={data} allRedirects={allRedirects} currentSlug={params.slug} />
}