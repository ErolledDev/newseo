import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

let adminApp: any = null
let adminDb: any = null

try {
  // Validate required environment variables
  if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
    throw new Error('Missing required Firebase Admin environment variables')
  }

  // Initialize Firebase Admin
  adminApp = getApps().length === 0 
    ? initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }, 'admin')
    : getApps().find(app => app.name === 'admin')

  // Initialize Admin Firestore
  adminDb = getFirestore(adminApp)
  
  console.log('Firebase Admin initialized successfully')
} catch (error) {
  console.warn('Firebase Admin initialization failed, using fallback mode:', error)
  
  // Create a mock database interface for fallback
  adminDb = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async (data: any) => { 
          console.warn('Firebase unavailable - data not saved:', { id, data })
          throw new Error('Firebase connection unavailable')
        },
        delete: async () => {
          console.warn('Firebase unavailable - delete operation failed')
          throw new Error('Firebase connection unavailable')
        }
      }),
      get: async () => ({
        forEach: (callback: any) => {
          console.warn('Firebase unavailable - no data returned')
        }
      }),
      add: async (data: any) => {
        console.warn('Firebase unavailable - data not added:', data)
        throw new Error('Firebase connection unavailable')
      }
    })
  }
}

export { adminDb }
export default adminApp