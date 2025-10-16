import { useCallback } from 'react';

import { Transaction } from '@/types';

import {
  deleteProcessedStatement as deleteFromFirestore,
  getAllProcessedStatements as getAllFromFirestore,
  getAllTransactions,
  getProcessedStatement as getFromFirestore,
  ProcessedStatement,
} from '../utils/firestoreStorage';

import { useAuth } from './useAuth';

// Hook to manage Firestore operations with user authentication
export const useFirestoreStorage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Get all processed statements for the current user
  const getAllProcessedStatements = useCallback(async (): Promise<
    ProcessedStatement[]
  > => {
    if (!isAuthenticated || !user?.uid) {
      console.error('User must be authenticated to retrieve statements');
      return [];
    }

    return await getAllFromFirestore(user.uid);
  }, [isAuthenticated, user]);

  const getProcessedStatementTransactions = useCallback(
    async (key: string): Promise<Transaction[]> => {
      if (!isAuthenticated || !user?.uid) {
        console.error('User must be authenticated to retrieve statements');
        return [];
      }

      return await getAllTransactions(user.uid, key);
    },
    [isAuthenticated, user]
  );

  // Get a specific processed statement by ID
  const getProcessedStatement = useCallback(
    async (documentId: string): Promise<ProcessedStatement | null> => {
      if (!isAuthenticated || !user?.uid) {
        console.error('User must be authenticated to retrieve statement');
        return null;
      }

      return await getFromFirestore(documentId, user.uid);
    },
    [isAuthenticated, user]
  );

  // Delete a processed statement
  const deleteProcessedStatement = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.uid) {
        console.error('User must be authenticated to delete statement');
        return false;
      }

      return await deleteFromFirestore(documentId, user.uid);
    },
    [isAuthenticated, user]
  );

  return {
    // State
    isAuthenticated,
    loading,
    userId: user?.uid,

    // Methods
    getAllProcessedStatements,
    getProcessedStatement,
    deleteProcessedStatement,
    getProcessedStatementTransactions,
  };
};
