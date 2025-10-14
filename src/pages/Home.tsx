import React from 'react';

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
      <p className='mb-4'>
        Use the sidebar to navigate through the application.
      </p>
      <p>
        Start by uploading a new bank statement or view your saved statements.
      </p>
    </div>
  );
};

export default App;
