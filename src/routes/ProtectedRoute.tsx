'use client';

import React from 'react';
import { Navigate } from 'react-router-dom';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message='Authenticating...' />;
  }

  return isAuthenticated ? children : <Navigate to='/login' replace />;
};

export default ProtectedRoute;
