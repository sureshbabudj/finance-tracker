'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { getAllTransactions } from '@/utils/firestoreStorage';

import { Transaction } from '../types';
import {
  ProcessedStatement,
  saveProcessedStatement,
} from '../utils/localStorage';

import { FileUploadProcessor } from './FileUploadProcessor';
import { InsightsProcessor } from './InsightsProcessor';
import { TransactionDisplay } from './TransactionDisplay';

const BankStatementAnalyzer: React.FC<{ statementKey?: string }> = ({
  statementKey,
}) => {
  const navigate = useNavigate();
  const { loading, user } = useAuth();

  // Core state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [_currentStatement, setCurrentStatement] =
    useState<ProcessedStatement | null>(null);

  // Handle successful file processing
  const handleProcessingComplete = async (statement: ProcessedStatement) => {
    try {
      setTransactions(statement.transactions);
      setCurrentStatement(statement);

      // Save to storage and navigate
      const key = await saveProcessedStatement(statement);
      if (key) {
        navigate(`/details/${key}`);
      }
    } catch (saveError) {
      console.error('Error saving statement:', saveError);
      setError('Failed to save processed statement');
      // Still set the transactions for display
      setTransactions(statement.transactions);
      setCurrentStatement(statement);
    }
  };

  // Handle errors from child components
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Clear error when user starts new action
  const clearError = () => {
    setError(null);
  };

  // Load saved statement when statementKey is provided
  useEffect(() => {
    if (!statementKey) {
      return;
    }

    const loadSavedStatement = async (statementKey: string) => {
      if (!user?.uid) {
        return;
      }

      try {
        const savedTransactions = await getAllTransactions(
          user.uid,
          statementKey
        );

        setTransactions(savedTransactions);
        setCurrentStatement({
          id: statementKey,
          rawText: '',
          transactions: savedTransactions,
          accountHolder: '',
          fromDate: '',
          toDate: '',
          timestamp: statementKey,
          fileName: 'Saved Statement',
          processedAt: new Date().toISOString(),
        });
        setError(null);
      } catch (loadError) {
        console.error('Error loading saved statement:', loadError);
        setError('Failed to load saved statement');
      }
    };

    loadSavedStatement(statementKey);
  }, [user, statementKey]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <svg
            className='animate-spin mx-auto h-10 w-10 text-indigo-600'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z'
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4'>
      {/* Error Display */}
      {error && (
        <div
          className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg'
          role='alert'
        >
          <p className='font-bold'>Error</p>
          <p className='text-sm'>{error}</p>
          <button
            onClick={clearError}
            className='mt-2 text-sm underline hover:no-underline'
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File Upload and Processing Section */}
      {transactions.length === 0 && (
        <FileUploadProcessor
          onProcessingComplete={handleProcessingComplete}
          onError={handleError}
          disabled={loading}
        />
      )}

      {/* Insights and Analysis Section */}
      {transactions.length > 0 && (
        <InsightsProcessor transactions={transactions} onError={handleError} />
      )}

      {/* Transaction Display Section */}
      {transactions.length > 0 && (
        <TransactionDisplay transactions={transactions} />
      )}
    </div>
  );
};

export default BankStatementAnalyzer;
