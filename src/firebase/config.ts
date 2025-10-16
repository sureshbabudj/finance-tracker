// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure the Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);

export default app;

// Connect to emulators when running locally
if (window.location.hostname === 'localhost') {
  // Connect to Functions Emulator
  connectFunctionsEmulator(functions, 'localhost', 5003);

  // Connect to Firestore Emulator
  connectFirestoreEmulator(db, 'localhost', 8083);
}
