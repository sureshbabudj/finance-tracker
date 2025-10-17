/* eslint-disable no-undef */
import {
  GenerateContentRequest,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  CallableRequest,
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

// --- Type Definitions ---
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  amountString: string;
  type: 'Money In' | 'Money Out';
  category: string;
}

interface Task {
  type:
    | 'process-transactions'
    | 'explain-transaction'
    | 'summarize-transactions';
  data?: Record<string, unknown>;
}
interface GenkitPayload {
  model?: string;
  contents: GenerateContentRequest['contents'];
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
  task?: Task;
  statementId?: string;
}
// --- End Type Definitions ---

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

const GENKIT_API_SECRET = defineSecret('GENKIT_API_KEY');

setGlobalOptions({ maxInstances: 10 });

const getCollectionPath = (userId: string, statementId: string) => {
  const appId = process.env.CLOUD_FIREBASE_APP_ID || 'default-app-id';
  // Path to the transactions subcollection
  return `artifacts/${appId}/users/${userId}/statements/${statementId}/transactions`;
};

const getStatementDocumentPath = (userId: string, statementId: string) => {
  const appId = process.env.CLOUD_FIREBASE_APP_ID || 'default-app-id';
  // Path to the statement document itself
  return `artifacts/${appId}/users/${userId}/statements/${statementId}`;
};

// Main Callable Function
export const genkitProxy = onCall<GenkitPayload>(
  { secrets: [GENKIT_API_SECRET], memory: '1GiB', timeoutSeconds: 300, cpu: 1 },
  async (request: CallableRequest<GenkitPayload>): Promise<any> => {
    // Changed return type to 'any' for the mixed return value
    const userId = request.auth?.uid;

    if (!userId) {
      logger.warn('Unauthorized access attempt to genkitSecureProxy.');
      throw new HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const {
      model = 'gemini-2.5-flash-preview-05-20',
      contents,
      systemInstruction,
      generationConfig,
      task,
      statementId,
    } = request.data;

    try {
      // Access the Secret Manager value
      // eslint-disable-next-line no-undef
      const apiKey = process.env.GENKIT_API_SECRET;

      if (!apiKey) {
        logger.error(
          'Configuration Error: GENKIT_API_SECRET secret is not available at runtime.'
        );
        throw new HttpsError(
          'internal',
          'API service configuration is missing.'
        );
      }

      const genai = new GoogleGenerativeAI(apiKey);
      const generativeModel = genai.getGenerativeModel({ model });

      logger.info(
        `User ${userId} calling model: ${model} for task: ${task?.type}`,
        { model }
      );

      const generateContentRequest: GenerateContentRequest = {
        contents: contents,
        generationConfig: (generationConfig as any) ?? {},
        systemInstruction,
      };

      const result = await generativeModel.generateContent(
        generateContentRequest
      );

      // --- Data Processing and Storage Logic ---
      if (task?.type === 'process-transactions') {
        const responseText =
          result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText || !statementId) {
          throw new HttpsError(
            'failed-precondition',
            'Missing API response text or statement ID for processing.'
          );
        }

        // 1. Parse the JSON response
        const transactions: Transaction[] = JSON.parse(responseText);

        // NEW: Get the reference to the parent document
        const statementDocPath = getStatementDocumentPath(userId, statementId);
        const statementDocRef = db.doc(statementDocPath);

        // 2. Setup batch and paths
        const batch = db.batch();
        const collectionPath = getCollectionPath(userId, statementId);
        const collectionRef = db.collection(collectionPath);

        logger.info(
          `Attempting to save ${transactions.length} transactions to: ${collectionPath}`
        );

        // FIX 1: Add a placeholder field to the parent statement document
        // This makes the document officially "exist" and visible in the console
        batch.set(statementDocRef, {
          status: 'processing_complete',
          uploadTime: new Date().toISOString(),
          transactionCount: transactions.length,
        });

        logger.info(
          `Attempting to save ${transactions.length} transactions to: ${collectionPath}`
        );

        // 3. Batch write all transactions
        transactions.forEach(t => {
          // Add UI formatting on the server for consistency
          const amountValue = parseFloat(t.amount as any);

          if (isNaN(amountValue)) {
            logger.warn(
              `Skipping transaction due to invalid amount: ${t.amount}`
            );
            return;
          }

          const formattedTransaction = {
            ...t,
            amount: amountValue,
            amountString:
              t.type === 'Money Out'
                ? `-€${amountValue.toFixed(2)}`
                : `+€${amountValue.toFixed(2)}`,
            timestamp: new Date().toISOString(),
          } as any;

          const newDocRef = collectionRef.doc();

          // Use .doc() without arguments to generate an ID, then batch.set()
          batch.set(newDocRef, formattedTransaction);
        });

        // 4. COMMIT THE BATCH (This is the critical step that was failing silently)
        await batch.commit();

        logger.info(
          `Successfully committed ${transactions.length} transactions.`
        );

        // 5. Return success data to the client
        return {
          status: 'success',
          message: `Successfully classified and saved ${transactions.length} transactions.`,
          statementId: statementId,
        };
      }
      return result;
    } catch (error) {
      logger.error('Error calling Genkit API or Processing:', error);

      // If the error is an object and not already an HttpsError, log its contents
      if (!(error instanceof HttpsError)) {
        logger.error(error);
      }

      throw new HttpsError(
        'internal',
        `An unexpected error occurred: ${(error as Error).message || 'check logs for details'}`
      );
    }
  }
);
