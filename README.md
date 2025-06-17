# SEO Redirection System

A Next.js application for creating SEO-optimized redirections with custom meta tags to boost content visibility in search engines.

## Features

- **SEO-Friendly URLs**: Create clean URLs like `yoursite.com/your-custom-slug`
- **Meta Tag Optimization**: Full Open Graph and Twitter Card support
- **Dual URL Format**: Both parameter-based and slug-based URLs
- **Static File Storage**: Uses JSON file for data persistence
- **Sitemap Generation**: Automatic sitemap.xml generation for search engines
- **No Auto-Redirect**: User choice with CTA buttons for better UX

## How It Works

### JSON Data Management
- **Automatic**: When you create redirects through the admin form, they're automatically saved to `redirects.json`
- **Manual**: You can also edit `redirects.json` directly in your code editor
- **Format**: Each entry maps a slug to meta data (title, description, URL, image, etc.)

### URL Formats
1. **Long URL**: `/u?title=...&desc=...&url=...` (with all parameters)
2. **Short URL**: `/your-custom-slug` (clean SEO-friendly URL)

### Search Engine Optimization
1. Download the generated `sitemap.xml`
2. Upload to Google Search Console
3. Submit to Bing Webmaster Tools
4. Share your SEO-friendly URLs

## Usage

1. **Create Redirects**: Use `/admin` to create new redirections
2. **View Results**: Test both long and short URL formats
3. **Export Sitemap**: Download `sitemap.xml` for search engines
4. **Share URLs**: Use the clean slug-based URLs for better SEO

## File Structure

- `redirects.json` - Stores all redirect mappings
- `/[slug]` - Dynamic route for slug-based redirects
- `/u` - Parameter-based redirect page
- `/admin` - Admin interface for creating redirects
- `/api/sitemap` - Generates sitemap.xml

## Environment Variables

Set `NEXT_PUBLIC_BASE_URL` to your domain for proper sitemap generation:
```
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Deployment

This is a static Next.js application that can be deployed to:
- Netlify
- Vercel
- Any static hosting provider

The `redirects.json` file will be created automatically when you create your first redirect.