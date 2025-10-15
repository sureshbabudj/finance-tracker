'use client';

import { ArrowDownUp, Cpu, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { SortConfig, Transaction } from '../types';
import {
  extractStatementMetadata,
  getProcessedStatement,
  ProcessedStatement,
  saveProcessedStatement,
} from '../utils/localStorage';
import {
  extractTextFromPDF,
  fetchWithRetry,
  GenkitPayload,
  processAndCategorizeCSVTransactions,
  processAndCategorizeTransactions,
  processCSVFile,
} from '../utils/pdfProcessor';

import { TransactionsSummary } from './transactions-summary';
import { Filters, TransactionsTable } from './transactions-table';
import { TransactionExplanationModal } from './UI';
import { Button } from './ui/button';

const BankStatementAnalyzer: React.FC<{ statementKey?: string }> = ({
  statementKey,
}) => {
  const navigate = useNavigate();
  // All state variables
  const [rawText, setRawText] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [error, setError] = useState<string | null>(null);

  // --- File Upload & Format Analysis state ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [formatAnalysis, setFormatAnalysis] = useState<string | null>(null);
  const [isAnalyzingFormat, setIsAnalyzingFormat] = useState<boolean>(false);

  // --- LLM feature state ---
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);
  const [transactionExplanation, setTransactionExplanation] = useState<
    string | null
  >(null);

  // --- Filter and Sort State ---
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'descending',
  });

  // Get unique categories from the processed data
  const uniqueCategories = useMemo(() => {
    const categories = transactions.map(t => t.category).filter(Boolean);
    return ['All', ...new Set(categories)].sort();
  }, [transactions]);

  // --- File Upload Processing ---
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isCSV =
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (!isPDF && !isCSV) {
      setError('Please upload a PDF or CSV file');
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);
    setError(null);
    setFormatAnalysis(
      `🔄 Processing ${isPDF ? 'PDF' : 'CSV'} and categorizing transactions...`
    );
    setTransactions([]); // Clear previous transactions

    try {
      let extractedText: string;
      let processedTransactions: Transaction[];

      if (isPDF) {
        // Extract text from PDF
        extractedText = await extractTextFromPDF(file);
        setRawText(extractedText as string); // Show raw text for reference

        // Process PDF text with standard processing
        processedTransactions =
          await processAndCategorizeTransactions(extractedText);
      } else {
        // Process CSV file
        extractedText = await processCSVFile(file);
        setRawText(extractedText); // Show raw CSV for reference

        // Process CSV with specialized CSV processing
        processedTransactions =
          await processAndCategorizeCSVTransactions(extractedText);
      }

      // Extract metadata for localStorage
      const metadata = extractStatementMetadata(extractedText);
      const timestamp = Date.now().toString();

      // Create statement object for localStorage
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

      // Save to localStorage
      const key = await saveProcessedStatement(processedStatement);

      // navigate to the new statement view if key is available with react-router-dom

      setFormatAnalysis(
        `✅ Successfully processed ${processedTransactions.length} transactions! (Saved to storage)`
      );

      if (key) {
        navigate(`/details/${key}`);
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(
        `Error processing PDF: ${errorMessage}. Please try extracting text manually and pasting it below.`
      );
      setRawText(''); // Clear on error
      setFormatAnalysis(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // --- Manual Processing (for pasted text) ---
  const processManualText = async () => {
    if (!rawText.trim()) {
      setError('Please provide bank statement text first');
      return;
    }

    setIsAnalyzingFormat(true);
    setError(null);
    setFormatAnalysis('🔄 Processing and categorizing transactions...');
    setTransactions([]);

    try {
      const processedTransactions =
        await processAndCategorizeTransactions(rawText);

      // Extract metadata for localStorage
      const metadata = extractStatementMetadata(rawText);
      const timestamp = Date.now().toString();

      // Create statement object for localStorage
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

      // Save to localStorage
      const key = await saveProcessedStatement(processedStatement);
      setFormatAnalysis(
        `✅ Successfully processed ${processedTransactions.length} transactions! (Saved to storage)`
      );
      if (key) {
        navigate(`/details/${key}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError('Error processing transactions: ' + errorMessage);
      setFormatAnalysis(null);
    } finally {
      setIsAnalyzingFormat(false);
    }
  };

  // --- Reset/Clear Functions ---
  const clearAll = () => {
    setUploadedFile(null);
    setRawText('');
    setTransactions([]);
    setFormatAnalysis(null);
    setAnalysisReport(null);
    setSelectedTransaction(null);
    setTransactionExplanation(null);
    setError(null);
    setIsProcessingFile(false);
    setIsAnalyzingFormat(false);
    // Reset file input
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    // --- Load Saved Statement ---
    const loadSavedStatement = (statement: ProcessedStatement) => {
      setRawText(statement.rawText);
      setTransactions(statement.transactions);
      setFormatAnalysis(
        `✅ Loaded saved statement: ${statement.accountHolder} (${statement.transactions.length} transactions)`
      );
      setUploadedFile(null);
      setError(null);
      setAnalysisReport(null);
      setSelectedTransaction(null);
      setTransactionExplanation(null);
    };
    if (statementKey) {
      const statement = getProcessedStatement(statementKey);
      if (statement) {
        loadSavedStatement(statement);
      }
    } else {
      clearAll();
    }
  }, [statementKey]);

  // --- Financial Analysis Report ---
  const generateAnalysisReport = useCallback(async () => {
    if (transactions.length === 0) {
      setError('Please process the statement first to generate the report.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisReport(null);
    setError(null);

    // Prepare data for the model
    const transactionsString = transactions
      .map(
        t =>
          `${t.date} | ${t.description} | ${t.amountString} | Category: ${t.category}`
      )
      .join('\n');

    const reportSystemInstruction = `You are a helpful and detailed financial advisor. Analyze the following list of transactions. Generate a three-part report:
1. Summary: A brief paragraph on overall spending and income trends.
2. Top Insights: Identify the top 3-5 categories of spending (Money Out) and provide one actionable tip for each category to save money.
3. Budget Recommendation: Based on the income and spending patterns, provide one general financial recommendation.
Format the output using markdown headers (## and ###) and lists (*).`;

    const reportUserQuery = `Analyze these transactions:\n\n${transactionsString}`;

    const payload: GenkitPayload = {
      contents: [{ parts: [{ text: reportUserQuery }] }],
      systemInstruction: { parts: [{ text: reportSystemInstruction }] },
    };

    try {
      const response = await fetchWithRetry(payload);
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysisReport(
        text ||
          'Could not generate report. The model returned an empty response.'
      );
    } catch (e) {
      console.error('Report generation error:', e);
      const errorMessage =
        e instanceof Error ? e.message : 'Unknown error occurred';
      setError(
        'Failed to generate financial analysis report. Error: ' + errorMessage
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [transactions]);

  // --- Transaction Explanation ---
  const explainTransaction = useCallback(async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionExplanation(null);
    setExplanationLoading(true);

    const explanationSystemInstruction = `You are a helpful financial assistant. Analyze the single transaction provided by the user. Explain in simple terms what this transaction likely represents based on the description and category. Suggest if the assigned category is accurate or if a more specific sub-category might be better (e.g., 'Groceries' could be 'Indian Groceries'). Provide a maximum of three concise sentences.`;

    const explanationUserQuery = `Explain this transaction: Date: ${transaction.date}, Description: ${transaction.description}, Amount: ${transaction.amountString}, Category: ${transaction.category}`;

    const payload = {
      contents: [{ parts: [{ text: explanationUserQuery }] }],
      systemInstruction: { parts: [{ text: explanationSystemInstruction }] },
    };

    try {
      const response = await fetchWithRetry(payload);
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      setTransactionExplanation(text || 'Could not generate explanation.');
    } catch (e) {
      console.error('Explanation error:', e);
      const errorMessage =
        e instanceof Error ? e.message : 'Unknown error occurred';
      setTransactionExplanation(
        'Failed to get explanation. Error: ' + errorMessage
      );
    } finally {
      setExplanationLoading(false);
    }
  }, []);

  // --- Filtering and Sorting Logic ---
  const sortedAndFilteredTransactions = useMemo(() => {
    let filtered = transactions.slice();

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.category.toLowerCase().includes(lowerSearch) ||
          t.amountString.toLowerCase().includes(lowerSearch)
      );
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [transactions, search, categoryFilter, sortConfig]);

  const handleSort = (key: keyof Transaction) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction) => {
    if (sortConfig.key !== key) {
      return <ArrowDownUp className='w-4 h-4' />; // Unsorted
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  // --- Main Render Function ---
  return (
    <div className='p-4'>
      {/* Input & Action Panel */}
      {transactions.length === 0 && (
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
                      <span className='font-semibold'>Click to upload</span>{' '}
                      your bank statement
                    </p>
                    <p className='text-xs text-indigo-500'>PDF or CSV files</p>
                  </div>
                  <input
                    id='pdf-upload'
                    type='file'
                    accept='.pdf,.csv'
                    className='hidden'
                    onChange={handleFileUpload}
                    disabled={isProcessingFile}
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
                  className=' transition-colors'
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
            ></textarea>

            <Button
              onClick={processManualText}
              size='lg'
              disabled={isAnalyzingFormat || isProcessingFile}
              className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition duration-200 shadow-md ${
                isAnalyzingFormat || isProcessingFile
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {isAnalyzingFormat || isProcessingFile ? (
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
      )}

      {/* Status/Error Messages */}
      {error && (
        <div
          className='mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg'
          role='alert'
        >
          <p className='font-bold'>Processing Error</p>
          <p className='text-sm'>{error}</p>
        </div>
      )}

      {/* Analysis Dashboard */}
      {transactions.length > 0 && (
        <div className='mt-2'>
          <TransactionsSummary
            transactions={transactions}
            analysisReport={analysisReport}
            isAnalyzing={isAnalyzing}
            generateAnalysisReport={generateAnalysisReport}
          />

          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>
                Transaction Details ({sortedAndFilteredTransactions.length} of{' '}
                {transactions.length})
              </CardTitle>
              <CardDescription>
                View and manage your financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <Filters
                search={search}
                setSearch={setSearch}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                uniqueCategories={uniqueCategories}
              />

              <TransactionsTable
                transactions={sortedAndFilteredTransactions}
                onSort={handleSort}
                getSortIcon={getSortIcon}
                onExplain={explainTransaction}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Explanation Modal */}
      <TransactionExplanationModal
        transaction={selectedTransaction}
        explanation={transactionExplanation}
        loading={explanationLoading}
        onClose={() => {
          setSelectedTransaction(null);
          setTransactionExplanation(null);
        }}
      />
    </div>
  );
};

export default BankStatementAnalyzer;
