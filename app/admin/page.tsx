import { Metadata } from 'next'
import AuthGuard from '../../components/AuthGuard'
import AdminPanel from './AdminPanel'

export const metadata: Metadata = {
  title: 'Admin Panel | SEO Redirection System',
  description: 'Create and manage SEO-optimized redirections with custom meta tags.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPanel />
    </AuthGuard>
  )
}