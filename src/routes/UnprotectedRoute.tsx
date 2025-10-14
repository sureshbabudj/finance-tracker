import React from 'react';
import { Navigate } from 'react-router-dom';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const UnProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message='Authenticating...' />;
  }

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return children;
};

export default UnProtectedRoute;
