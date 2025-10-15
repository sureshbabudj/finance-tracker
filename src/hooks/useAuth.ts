'use client';

import {
  AuthError,
  signOut as firebaseSignOut,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth, googleProvider } from '../firebase/config';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isComponentMounted = true;

    // Check for redirect result first
    getRedirectResult(auth)
      .then(result => {
        if (isComponentMounted && result?.user) {
          setUser(result.user);
        }
      })
      .catch((error: AuthError) => {
        if (isComponentMounted && error.code !== 'auth/no-auth-event') {
          setError(`Authentication error: ${error.message}`);
        }
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (isComponentMounted) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      isComponentMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (useRedirect = false) => {
    try {
      setError(null);
      setLoading(true);

      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        // The redirect will happen, so we don't need to handle the result here
      } else {
        // Try popup first
        const result = await signInWithPopup(auth, googleProvider);
        setLoading(false);
        return result.user;
      }
    } catch (error) {
      // Specific error handling
      const authError = error as AuthError;
      if (authError.code === 'auth/unauthorized-domain') {
        const errorMsg = `Domain not authorized. Please add ${window.location.origin} to Firebase Console > Authentication > Settings > Authorized domains`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      // If popup fails due to COOP or other issues, fall back to redirect
      if (
        authError.code === 'auth/popup-blocked' ||
        authError.code === 'auth/cancelled-popup-request' ||
        authError.code === 'auth/popup-closed-by-user' ||
        authError.message.includes('Cross-Origin-Opener-Policy')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          const redirectAuthError = redirectError as AuthError;
          setError(`Authentication failed: ${redirectAuthError.message}`);
          setLoading(false);
          throw redirectError;
        }
      }

      setError(authError.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
};
