import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEO Redirection System',
    short_name: 'SEO Redirects',
    description: 'Create powerful SEO-optimized redirections with custom meta tags to boost your content\'s search engine visibility and drive 10x more traffic.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['productivity', 'business', 'utilities'],
    lang: 'en',
    orientation: 'portrait-primary',
  }
}