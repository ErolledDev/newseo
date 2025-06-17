'use client'

import { useState, useEffect } from 'react'
import { useToast } from '../../components/ToastContainer'
import Header from '../../components/Header'
import SimpleFooter from '../../components/SimpleFooter'
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

interface FormData extends RedirectData {
  slug: string
}

export default function AdminPanel() {
  const { showSuccess, showError, showConfirm } = useToast()
  const [activeTab, setActiveTab] = useState('create')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    desc: '',
    url: '',
    image: '',
    keywords: '',
    site_name: '',
    type: 'website',
    slug: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [redirects, setRedirects] = useState<{ [slug: string]: RedirectData }>({})
  const [generatedUrls, setGeneratedUrls] = useState<{ long: string; short: string } | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  // Fetch existing redirects
  useEffect(() => {
    fetchRedirects()
  }, [])

  const fetchRedirects = async () => {
    try {
      const response = await fetch('/api/get-redirects')
      if (response.ok) {
        const data = await response.json()
        setRedirects(data)
      }
    } catch (error) {
      console.error('Error fetching redirects:', error)
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
    setIsLoading(true)

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
          slug: editingSlug || slug
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedUrls({
          long: result.long,
          short: result.short
        })
        
        showSuccess(
          editingSlug ? 'Redirect Updated!' : 'Redirect Created!',
          `Your ${editingSlug ? 'updated' : 'new'} redirect is ready to use.`
        )
        
        // Reset form if creating new
        if (!editingSlug) {
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
        }
        
        setEditingSlug(null)
        // Refresh the redirects list immediately
        await fetchRedirects()
      } else {
        showError('Error', result.error || 'Failed to create redirect')
      }
    } catch (error) {
      showError('Error', 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (slug: string, data: RedirectData) => {
    setFormData({
      ...data,
      slug
    })
    setEditingSlug(slug)
    setGeneratedUrls(null)
    setActiveTab('create') // Switch to create tab for editing
    setIsMobileMenuOpen(false) // Close mobile menu
  }

  const handleDelete = (slug: string) => {
    showConfirm(
      'Delete Redirect',
      `Are you sure you want to delete "${slug}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/delete-redirect?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            showSuccess('Deleted!', 'Redirect has been deleted successfully.')
            
            // Clear form if editing this redirect
            if (editingSlug === slug) {
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
              setEditingSlug(null)
              setGeneratedUrls(null)
            }
            
            // Refresh the redirects list immediately
            await fetchRedirects()
          } else {
            const result = await response.json()
            showError('Error', result.error || 'Failed to delete redirect')
          }
        } catch (error) {
          showError('Error', 'Network error. Please try again.')
        }
      },
      undefined,
      'Delete',
      'Cancel'
    )
  }

  const cancelEdit = () => {
    setEditingSlug(null)
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
    setGeneratedUrls(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Copied!', 'URL copied to clipboard')
    } catch (err) {
      showError('Error', 'Failed to copy URL')
    }
  }

  const downloadSitemap = () => {
    window.open('/sitemap.xml', '_blank')
  }

  const viewRedirect = (slug: string) => {
    window.open(`/${slug}`, '_blank')
  }

  const tabs = [
    { id: 'create', name: 'Create Redirect', icon: '➕' },
    { id: 'manage', name: 'Manage Redirects', icon: '📋' },
    { id: 'tools', name: 'SEO Tools', icon: '🛠️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-screen pt-16">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-20 left-4 z-50 bg-white p-2 rounded-lg shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:shadow-none border-r border-gray-200`}>
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your redirects</p>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg mr-3">{tab.icon}</span>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Breadcrumb currentPage="Admin Panel" />
            
            {/* Create Redirect Tab */}
            {activeTab === 'create' && (
              <div className="max-w-4xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {editingSlug ? 'Edit Redirect' : 'Create New Redirect'}
                  </h1>
                  <p className="text-gray-600">
                    {editingSlug 
                      ? 'Update your existing redirect with new information'
                      : 'Generate SEO-optimized URLs with custom meta tags for better search engine visibility'
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Form Section */}
                  <div className="xl:col-span-3">
                    <div className="bg-white rounded-lg shadow p-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {editingSlug && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-blue-800">Editing Redirect</h3>
                                <p className="text-sm text-blue-600">Slug: {editingSlug}</p>
                              </div>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Cancel Edit
                              </button>
                            </div>
                          </div>
                        )}

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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter page title"
                              required
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="website">Website</option>
                              <option value="article">Article</option>
                              <option value="blog">Blog Post</option>
                              <option value="product">Product</option>
                              <option value="video">Video</option>
                            </select>
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
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter page description"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                            Target URL *
                          </label>
                          <input
                            type="url"
                            id="url"
                            name="url"
                            value={formData.url}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/your-page"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                              Featured Image URL
                            </label>
                            <input
                              type="url"
                              id="image"
                              name="image"
                              value={formData.image}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Your Site Name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                              Keywords (comma-separated)
                            </label>
                            <input
                              type="text"
                              id="keywords"
                              name="keywords"
                              value={formData.keywords}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="seo, marketing, website"
                            />
                          </div>

                          <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Slug (optional)
                            </label>
                            <input
                              type="text"
                              id="slug"
                              name="slug"
                              value={formData.slug}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="custom-url-slug"
                              disabled={!!editingSlug}
                            />
                            {editingSlug && (
                              <p className="text-xs text-gray-500 mt-1">
                                Slug cannot be changed when editing
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {isLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {editingSlug ? 'Updating...' : 'Creating...'}
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {editingSlug ? 'Update Redirect' : 'Create Redirect'}
                              </>
                            )}
                          </button>

                          {editingSlug && (
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Generated URLs */}
                    {generatedUrls && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Generated URLs
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Short URL</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={generatedUrls.short}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                              />
                              <button
                                onClick={() => copyToClipboard(generatedUrls.short)}
                                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Copy URL"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Long URL</label>
                            <div className="flex items-center space-x-2">
                              <textarea
                                value={generatedUrls.long}
                                readOnly
                                rows={3}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono resize-none"
                              />
                              <button
                                onClick={() => copyToClipboard(generatedUrls.long)}
                                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Copy URL"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Tips</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Use descriptive, keyword-rich titles
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Keep descriptions between 150-160 characters
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Include relevant keywords naturally
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Use high-quality images (1200x630px)
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Submit sitemap to Google Search Console
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Redirects Tab */}
            {activeTab === 'manage' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Redirects</h1>
                  <p className="text-gray-600">View, edit, and delete your existing redirects</p>
                </div>

                {Object.keys(redirects).length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No redirects found</h3>
                    <p className="text-gray-600 mb-6">Create your first redirect to get started</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Redirect
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(redirects).map(([slug, data]) => (
                      <div key={slug} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate" title={data.title}>
                              {data.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">/{slug}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium ml-2">
                            {data.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {data.desc}
                        </p>
                        
                        {data.keywords && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {data.keywords.split(',').slice(0, 3).map((keyword, index) => (
                              <span 
                                key={index}
                                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                              >
                                #{keyword.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewRedirect(slug)}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(slug, data)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(slug)}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEO Tools Tab */}
            {activeTab === 'tools' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Tools</h1>
                  <p className="text-gray-600">Tools to help optimize your SEO performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Download Sitemap</h3>
                        <p className="text-sm text-gray-600">Get your sitemap.xml file</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadSitemap}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Download Sitemap
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">View Sitemap</h3>
                        <p className="text-sm text-gray-600">Open sitemap in browser</p>
                      </div>
                    </div>
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-block text-center"
                    >
                      View Sitemap
                    </a>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                        <p className="text-sm text-gray-600">View redirect stats</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {Object.keys(redirects).length}
                      </div>
                      <div className="text-sm text-gray-600">Total Redirects</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Best Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Title Optimization</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Keep titles under 60 characters</li>
                        <li>• Include primary keywords</li>
                        <li>• Make titles compelling and clickable</li>
                        <li>• Avoid keyword stuffing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description Guidelines</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Keep descriptions 150-160 characters</li>
                        <li>• Include a clear call-to-action</li>
                        <li>• Use relevant keywords naturally</li>
                        <li>• Make each description unique</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}