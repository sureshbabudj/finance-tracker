import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import { Transaction } from '@/types';

import { db } from '../firebase/config';

export interface ProcessedStatement {
  id: string;
  accountHolder: string;
  fromDate: string;
  toDate: string;
  uploadTime: string;
  transactionsCount: number;
  insights: boolean;
  fileName?: string;
  status: string;
}

// Collection name for statements
const APP_ID = import.meta.env.VITE_APP_ID || 'default-app-id';
const STATEMENTS_COLLECTION = `artifacts/${APP_ID}/users/{currentUserId}/statements`;

// Generate document ID in the format: account_holder_name_from_date_to_date_unique_timestamp
export const generateDocumentId = (
  accountHolder: string,
  fromDate: string,
  toDate: string,
  timestamp: string
): string => {
  const cleanAccountHolder = accountHolder
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  const cleanFromDate = fromDate.replace(/[^0-9]/g, '');
  const cleanToDate = toDate.replace(/[^0-9]/g, '');

  return `${cleanAccountHolder}_${cleanFromDate}_to_${cleanToDate}_${timestamp}`;
};

// Convert Firestore document to ProcessedStatement
const firestoreDocToStatement = (
  docSnapshot: QueryDocumentSnapshot<DocumentData>
): ProcessedStatement => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    accountHolder: data.accountHolder,
    fromDate: data.fromDate,
    toDate: data.toDate,
    uploadTime: data.uploadTime,
    transactionsCount: data.transactionCount,
    insights: data.insights || false,
    status: data.status || 'processing',
  };
};

// Get all processed statements for a specific user from Firestore
export const getAllProcessedStatements = async (
  userId: string
): Promise<ProcessedStatement[]> => {
  try {
    if (!userId) {
      console.error('User ID is required to retrieve statements');
      return [];
    }

    const statementsRef = collection(
      db,
      STATEMENTS_COLLECTION.replace('{currentUserId}', userId)
    );
    const q = query(statementsRef, orderBy('uploadTime', 'desc'));

    const querySnapshot = await getDocs(q);
    const statements: ProcessedStatement[] = [];

    querySnapshot.forEach(doc => {
      try {
        const statement = firestoreDocToStatement(doc);
        statements.push(statement);
      } catch (parseError) {
        console.warn(
          `Failed to parse statement with ID: ${doc.id}`,
          parseError
        );
      }
    });

    return statements;
  } catch (error) {
    console.error('Error retrieving statements from Firestore:', error);
    return [];
  }
};

// Get a specific processed statement by document ID and user ID
export const getProcessedStatement = async (
  documentId: string,
  userId: string
): Promise<ProcessedStatement | null> => {
  try {
    if (!userId) {
      console.error('User ID is required to retrieve statement');
      return null;
    }

    const docRef = doc(
      db,
      STATEMENTS_COLLECTION.replace('{currentUserId}', userId),
      documentId
    );
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();

      // Verify that the statement belongs to the requesting user
      if (data.userId !== userId) {
        console.error('Statement does not belong to the requesting user');
        return null;
      }

      return firestoreDocToStatement(
        docSnapshot as QueryDocumentSnapshot<DocumentData>
      );
    }

    return null;
  } catch (error) {
    console.error('Error retrieving statement from Firestore:', error);
    return null;
  }
};

// Delete a processed statement
export const deleteProcessedStatement = async (
  documentId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!userId) {
      console.error('User ID is required to delete statement');
      return false;
    }

    // First verify that the statement belongs to the user
    const statement = await getProcessedStatement(documentId, userId);
    if (!statement) {
      console.error('Statement not found or does not belong to user');
      return false;
    }

    const docRef = doc(
      db,
      STATEMENTS_COLLECTION.replace('{currentUserId}', userId),
      documentId
    );
    await deleteDoc(docRef);

    console.log('Statement deleted successfully:', documentId);
    return true;
  } catch (error) {
    console.error('Error deleting statement from Firestore:', error);
    return false;
  }
};

export const getAllTransactions = async (
  userId: string,
  statementId: string
): Promise<Transaction[]> => {
  try {
    if (!userId) {
      console.error('User ID is required to retrieve transactions');
      return [];
    }

    const statementsRef = collection(
      db,
      `${STATEMENTS_COLLECTION.replace('{currentUserId}', userId)}/${statementId}/transactions`
    );
    const q = query(statementsRef);

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    for (const doc of querySnapshot.docs) {
      try {
        const data = doc.data();
        if (data) {
          transactions.push(data as Transaction);
        }
      } catch (parseError) {
        console.warn(
          `Failed to parse transactions for statement with ID: ${doc.id}`,
          parseError
        );
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error retrieving transactions from Firestore:', error);
    return [];
  }
};
