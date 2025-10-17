'use client';

import { Cpu, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Transaction } from '../types';
import {
  extractStatementMetadata,
  ProcessedStatement,
} from '../utils/localStorage';
import {
  extractTextFromPDF,
  processAndCategorizeCSVTransactions,
  processAndCategorizeTransactions,
  processCSVFile,
} from '../utils/pdfProcessor';

import { Button } from './ui/button';

interface FileUploadProcessorProps {
  onProcessingComplete: (statement: ProcessedStatement) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const FileUploadProcessor: React.FC<FileUploadProcessorProps> = ({
  onProcessingComplete,
  onError,
  disabled = false,
}) => {
  // File Upload & Format Analysis state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [formatAnalysis, setFormatAnalysis] = useState<string | null>(null);
  const [isAnalyzingFormat, setIsAnalyzingFormat] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');

  // File Upload Processing
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isCSV =
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (!isPDF && !isCSV) {
      onError('Please upload a PDF or CSV file');
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);
    onError(''); // Clear any previous errors
    setFormatAnalysis(
      `🔄 Processing ${isPDF ? 'PDF' : 'CSV'} and categorizing transactions...`
    );

    try {
      let extractedText: string;
      let processedTransactions: Transaction[];

      if (isPDF) {
        // Extract text from PDF
        extractedText = await extractTextFromPDF(file);
        setRawText(extractedText as string);

        // Process PDF text with standard processing
        processedTransactions =
          await processAndCategorizeTransactions(extractedText);
      } else {
        // Process CSV file
        extractedText = await processCSVFile(file);
        setRawText(extractedText);

        // Process CSV with specialized CSV processing
        processedTransactions =
          await processAndCategorizeCSVTransactions(extractedText);
      }

      // Extract metadata for processing
      const metadata = extractStatementMetadata(extractedText);
      const timestamp = Date.now().toString();

      // Create statement object
      const processedStatement: ProcessedStatement = {
        id: timestamp,
        accountHolder: metadata.accountHolder,
        fromDate: metadata.fromDate,
        toDate: metadata.toDate,
        timestamp,
        transactions: processedTransactions,
        rawText: extractedText,
        fileName: file.name,
        processedAt: new Date().toISOString(),
      };

      console.log('Processed Statement:', processedStatement);

      setFormatAnalysis(
        `✅ Successfully processed ${processedTransactions.length} transactions!`
      );

      // Call the completion handler
      onProcessingComplete(processedStatement);
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onError(
        `Error processing file: ${errorMessage}. Please try extracting text manually and pasting it below.`
      );
      setRawText('');
      setFormatAnalysis(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Manual Processing (for pasted text)
  const processManualText = async () => {
    if (!rawText.trim()) {
      onError('Please provide bank statement text first');
      return;
    }

    setIsAnalyzingFormat(true);
    onError(''); // Clear any previous errors
    setFormatAnalysis('🔄 Processing and categorizing transactions...');

    try {
      const processedTransactions =
        await processAndCategorizeTransactions(rawText);

      // Extract metadata
      const metadata = extractStatementMetadata(rawText);
      const timestamp = Date.now().toString();

      // Create statement object
      const processedStatement: ProcessedStatement = {
        id: timestamp,
        accountHolder: metadata.accountHolder,
        fromDate: metadata.fromDate,
        toDate: metadata.toDate,
        timestamp,
        transactions: processedTransactions,
        rawText: rawText,
        fileName: 'Manual Entry',
        processedAt: new Date().toISOString(),
      };

      setFormatAnalysis(
        `✅ Successfully processed ${processedTransactions.length} transactions!`
      );

      // Call the completion handler
      onProcessingComplete(processedStatement);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onError('Error processing transactions: ' + errorMessage);
      setFormatAnalysis(null);
    } finally {
      setIsAnalyzingFormat(false);
    }
  };

  // Reset/Clear Functions
  const clearAll = () => {
    setUploadedFile(null);
    setRawText('');
    setFormatAnalysis(null);
    onError(''); // Clear errors
    setIsProcessingFile(false);
    setIsAnalyzingFormat(false);
    // Reset file input
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const isProcessing = isProcessingFile || isAnalyzingFormat;

  return (
    <div>
      <h3 className='text-lg font-bold pb-4'>
        Create and Process New Bank Statement
      </h3>
      <div className='max-w-6xl mx-auto space-y-4'>
        {/* File Upload Section */}
        <div className='border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-indigo-50'>
          <h3 className='text-lg font-medium text-gray-700 mb-3'>
            📄 Upload Bank Statement (PDF or CSV)
          </h3>
          <div className='flex items-center justify-center w-full'>
            <label
              htmlFor='pdf-upload'
              className='flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-indigo-50 transition-colors'
            >
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <svg
                  className='w-8 h-8 mb-4 text-indigo-500'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 20 16'
                >
                  <path
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                  />
                </svg>
                <p className='mb-2 text-sm text-indigo-600'>
                  <span className='font-semibold'>Click to upload</span> your
                  bank statement
                </p>
                <p className='text-xs text-indigo-500'>PDF or CSV files</p>
              </div>
              <input
                id='pdf-upload'
                type='file'
                accept='.pdf,.csv'
                className='hidden'
                onChange={handleFileUpload}
                disabled={disabled || isProcessing}
              />
            </label>
          </div>
          {uploadedFile && (
            <div className='mt-3 text-sm text-green-600'>
              ✅ Uploaded: {uploadedFile.name}
            </div>
          )}
          {isProcessingFile && (
            <div className='mt-3 text-sm text-indigo-600 flex items-center'>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4'
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
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing file...
            </div>
          )}
          <div className='mt-3 flex justify-end'>
            <Button
              onClick={clearAll}
              variant='destructive'
              className='transition-colors'
              disabled={disabled || isProcessing}
            >
              <Trash2 className='w-4 h-4 mr-1' />
              Clear & Reset
            </Button>
          </div>
        </div>

        {/* Processing Status Section */}
        {formatAnalysis && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center mb-3'>
              <h3 className='text-md font-medium text-green-800'>
                📊 Processing Status
              </h3>
            </div>
            <div className='bg-white p-3 rounded border text-sm text-green-700'>
              {formatAnalysis}
            </div>
          </div>
        )}

        {/* Manual Text Input Section */}
        <div className='space-y-4'>
          <label
            htmlFor='raw-text'
            className='block text-sm font-medium text-gray-700'
          >
            Bank Statement Data (Extracted from PDF/CSV)
          </label>
          <textarea
            id='raw-text'
            rows={8}
            className='w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm'
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder='Upload a PDF/CSV above or paste bank statement data here...'
            disabled={disabled}
          />

          <Button
            onClick={processManualText}
            size='lg'
            disabled={disabled || isProcessing}
            className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition duration-200 shadow-md ${
              disabled || isProcessing
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {isProcessing ? (
              <span className='flex items-center justify-center'>
                <Cpu className='w-5 h-5 mr-2 animate-spin' />
                Processing & Categorizing...
              </span>
            ) : (
              <span className='flex items-center justify-center'>
                <Cpu className='w-5 h-5 mr-2' />
                Process & Categorize Transactions
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
