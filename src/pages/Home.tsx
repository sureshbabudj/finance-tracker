import React from 'react';

import { StatementsList } from '@/components/statements-list';

/**
 * Main App Component - Entry point with authentication and lazy loading
 */
const App: React.FC = () => {
  // Show the main application with lazy loading
  return (
    // create a simple home page
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>
        Welcome to the Bank Statement Analyzer
      </h1>
      <StatementsList />
    </div>
  );
};

export default App;
