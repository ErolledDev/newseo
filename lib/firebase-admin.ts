import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

let adminApp: any = null
let adminDb: any = null

// Create a mock database interface for fallback
const createMockDb = () => ({
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: any) => { 
        console.warn('Firebase unavailable - data not saved:', { id, data })
        throw new Error('Firebase connection unavailable')
      },
      update: async (data: any) => {
        console.warn('Firebase unavailable - update operation failed')
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
})

try {
  // Validate required environment variables
  if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
    throw new Error('Missing required Firebase Admin environment variables')
  }

  // Clean and validate the private key format
  let privateKey = firebaseAdminConfig.privateKey
  
  // Remove any surrounding quotes that might have been added
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1)
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1)
  }
  
  // Ensure proper newline formatting
  privateKey = privateKey.replace(/\\n/g, '\n')
  
  // Validate PEM format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Private key is not in valid PEM format')
  }

  // Initialize Firebase Admin with cleaned private key
  adminApp = getApps().length === 0 
    ? initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }, 'admin')
    : getApps().find(app => app.name === 'admin')

  // Initialize Admin Firestore
  adminDb = getFirestore(adminApp)
  
  console.log('Firebase Admin initialized successfully')
} catch (error) {
  console.warn('Firebase Admin initialization failed, using fallback mode:', error)
  
  // Use mock database interface for fallback
  adminDb = createMockDb()
}

export { adminDb }
export default adminApp