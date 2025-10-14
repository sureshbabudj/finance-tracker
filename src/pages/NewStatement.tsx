import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';

import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load the heavy components
const BankStatementAnalyzer = React.lazy(
  () => import('@/components/BankStatementAnalyzer')
);

/**
 * Main App Component - Entry point with authentication and lazy loading
 */
const NewStatement: React.FC = () => {
  const { id } = useParams();
  // Show the main application with lazy loading
  return (
    <Suspense
      fallback={<LoadingSpinner message='Loading Bank Statement Analyzer...' />}
    >
      <BankStatementAnalyzer statementKey={id} />
    </Suspense>
  );
};

export default NewStatement;
