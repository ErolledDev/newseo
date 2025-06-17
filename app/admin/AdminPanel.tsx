'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'
import Breadcrumb from '../../components/Breadcrumb'

interface RedirectData {
  title: string
  desc: string
  url: string
  image: string
  keywords: string
  site_name: string
  type: string
}

interface RedirectWithAnalytics extends RedirectData {
  analytics?: {
    views: number
    clicks: number
    lastViewed: string
    lastClicked: string
  }
}

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const { showSuccess, showError, showConfirm } = useToast()
  
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    url: '',
    image: '',
    keywords: '',
    site_name: '',
    type: 'website',
    slug: ''
  })
  
  const [redirects, setRedirects] = useState<{ [slug: string]: RedirectWithAnalytics }>({})
  const [analytics, setAnalytics] = useState<{ [slug: string]: any }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics'>('create')

  // Load redirects and analytics on component mount
  useEffect(() => {
    loadRedirects()
    loadAnalytics()
  }, [])

  const loadRedirects = async () => {
    try {
      const response = await fetch('/api/get-redirects')
      if (response.ok) {
        const data = await response.json()
        setRedirects(data)
      } else {
        console.error('Failed to load redirects')
      }
    } catch (error) {
      console.error('Error loading redirects:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate slug if not provided
      const slug = formData.slug || generateSlug(formData.title)
      
      const response = await fetch('/api/create-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slug
        }),
      })

      const result = await response.json()

      if (response.ok) {
        showSuccess('Redirect Created', `Successfully created redirect: ${result.slug}`)
        
        // Reset form
        setFormData({
          title: '',
          desc: '',
          url: '',
          image: '',
          keywords: '',
          site_name: '',
          type: 'website',
          slug: ''
        })
        
        // Reload redirects
        await loadRedirects()
        
        // Switch to manage tab to show the new redirect
        setActiveTab('manage')
      } else {
        showError('Creation Failed', result.error || 'Failed to create redirect')
      }
    } catch (error) {
      console.error('Error creating redirect:', error)
      showError('Creation Failed', 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (slug: string) => {
    showConfirm(
      'Delete Redirect',
      `Are you sure you want to delete "${slug}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/delete-redirect?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE',
          })

          const result = await response.json()

          if (response.ok) {
            showSuccess('Redirect Deleted', `Successfully deleted "${slug}"`)
            await loadRedirects()
            await loadAnalytics()
          } else {
            showError('Deletion Failed', result.error || 'Failed to delete redirect')
          }
        } catch (error) {
          console.error('Error deleting redirect:', error)
          showError('Deletion Failed', 'An unexpected error occurred')
        }
      },
      undefined,
      'Delete',
      'Cancel'
    )
  }

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      showSuccess('Logged Out', 'You have been successfully logged out')
    } else {
      showError('Logout Failed', result.error || 'Failed to logout')
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Copied!', `${label} copied to clipboard`)
    } catch (error) {
      showError('Copy Failed', 'Failed to copy to clipboard')
    }
  }

  const downloadSitemap = () => {
    window.open('/api/sitemap', '_blank')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">SEO Redirection System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb currentPage="Admin Panel" />

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'create', label: 'Create Redirect', icon: '➕' },
              { id: 'manage', label: 'Manage Redirects', icon: '📋' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Create Redirect Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Redirect</h2>
              <p className="text-gray-600">Fill in the details to create a new SEO-optimized redirect</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="Enter the page title"
                  />
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="https://example.com/article"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="desc"
                  name="desc"
                  value={formData.desc}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="input-field"
                  placeholder="Enter a compelling description for SEO"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    id="site_name"
                    name="site_name"
                    value={formData.site_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Your Site Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="blog">Blog</option>
                    <option value="product">Product</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Slug (Optional)
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="custom-url-slug (leave empty to auto-generate)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  If empty, will be auto-generated from title
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Redirect'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Redirects Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Redirects</h2>
                  <p className="text-gray-600">View and manage all your redirects</p>
                </div>
                <button
                  onClick={downloadSitemap}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Download Sitemap
                </button>
              </div>

              {Object.keys(redirects).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Redirects Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first redirect to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="btn-primary"
                  >
                    Create First Redirect
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(redirects).map(([slug, data]) => (
                    <div key={slug} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{data.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{data.desc}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {data.type}
                            </span>
                            {data.site_name && (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                {data.site_name}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Short URL:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{baseUrl}/{slug}</code>
                              <button
                                onClick={() => copyToClipboard(`${baseUrl}/${slug}`, 'Short URL')}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Copy
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Destination:</span>
                              <a
                                href={data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm truncate max-w-md"
                              >
                                {data.url}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <a
                            href={`/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDelete(slug)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
              <p className="text-gray-600">Track views and clicks for your redirects</p>
            </div>

            {Object.keys(analytics).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-600">Analytics will appear here once your redirects start receiving traffic</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics).map(([slug, data]) => (
                  <div key={slug} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{data.title}</h3>
                        <code className="text-sm text-gray-600">{baseUrl}/{slug}</code>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{data.analytics?.views || 0}</div>
                        <div className="text-sm text-blue-600">Views</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{data.analytics?.clicks || 0}</div>
                        <div className="text-sm text-green-600">Clicks</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-purple-600">Last Viewed</div>
                        <div className="text-xs text-purple-600">
                          {data.analytics?.lastViewed ? new Date(data.analytics.lastViewed).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-orange-600">Last Clicked</div>
                        <div className="text-xs text-orange-600">
                          {data.analytics?.lastClicked ? new Date(data.analytics.lastClicked).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}