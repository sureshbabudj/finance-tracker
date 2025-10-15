/* eslint-disable no-undef */
import {
  GenerateContentRequest,
  GenerateContentResult,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { initializeApp } from 'firebase-admin/app';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  CallableRequest,
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

interface GenkitPayload {
  model?: string;
  contents: GenerateContentRequest['contents'];
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
}

// Initialize Firebase Admin SDK (needed for auth context)
initializeApp();

const GENKIT_API_SECRET = defineSecret('GENKIT_API_KEY');

setGlobalOptions({ maxInstances: 10 });

export const genkitProxy = onCall<GenkitPayload>(
  { secrets: [GENKIT_API_SECRET], memory: '1GiB', timeoutSeconds: 300, cpu: 1 },
  async (
    request: CallableRequest<GenkitPayload>
  ): Promise<GenerateContentResult> => {
    if (!request.auth) {
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
    } = request.data;

    try {
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

      logger.info(`User ${request.auth.uid} calling model: ${model}`, {
        model,
      });

      const generateContentRequest: GenerateContentRequest = {
        contents: contents,
        generationConfig: generationConfig ?? {},
        systemInstruction,
      };
      const result = await generativeModel.generateContent(
        generateContentRequest
      );

      return result;
    } catch (error) {
      logger.error('Error calling Genkit API:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error(error);
      throw new HttpsError(
        'internal',
        'An unexpected error occurred during API call.'
      );
    }
  }
);
