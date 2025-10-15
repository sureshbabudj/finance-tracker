import { httpsCallable } from 'firebase/functions';
import * as pdfjsLib from 'pdfjs-dist';

import { functions } from '@/firebase/config';

import { Transaction } from '../types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface GenkitPayload {
  contents: { parts: { text: string }[] }[];
  systemInstruction: { parts: { text: string }[] };
}

export interface GenkitResponse {
  data: {
    response: any;
  };
}

// This schema strictly defines the structure we want the model to return.
const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      date: {
        type: 'STRING',
        description: 'The transaction date in YYYY-MM-DD format.',
      },
      description: {
        type: 'STRING',
        description:
          "The cleaned transaction description, e.g., 'ALDI Sued Purchase', 'Payment to John Doe'.",
      },
      amount: {
        type: 'NUMBER',
        description:
          'The numeric value of the transaction. Should be positive.',
      },
      type: {
        type: 'STRING',
        enum: ['Money Out', 'Money In'],
        description: 'Direction of money flow.',
      },
      category: {
        type: 'STRING',
        enum: [
          'Groceries',
          'Shopping',
          'Transport/Travel',
          'Telecom/Utilities',
          'Childcare/Education',
          'Transfer/Payment',
          'Salary/Income',
          'Fees/Other',
          'Refunds',
          'Dining/Fast Food',
          'Online Subscription',
          'Personal Finance',
          'Leisure/Hobby',
        ],
        description: 'The classified category.',
      },
    },
    required: ['date', 'description', 'amount', 'type', 'category'],
  },
};

// --- PDF Processing Functions ---
const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) throw new Error('Failed to read file');

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Combine text items with proper spacing
          const pageText = textContent.items
            .map(item => ('str' in item ? item.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ') // Clean up multiple spaces
            .trim();

          if (pageText) {
            fullText += pageText + '\n';
          }
        }

        if (!fullText.trim()) {
          reject(new Error('No text content found in PDF'));
          return;
        }

        resolve(fullText.trim());
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Enhanced PDF text processing function
const processRawPDFText = (rawText: string): string => {
  // Clean and format PDF text
  const lines = rawText.split('\n').filter((line: string) => line.trim());

  // Basic structure detection
  const processedText = lines.map((line: string) => {
    // Clean up excessive whitespace
    const cleanLine = line.replace(/\s+/g, ' ').trim();

    // Mark potential transaction lines (containing amounts, dates, etc.)
    if (
      cleanLine.match(
        /\d{1,2}[/-\\.]\d{1,2}[/-\\.]\d{2,4}|\w{3}\s+\d{1,2},?\s+\d{4}/
      )
    ) {
      return `[TRANSACTION] ${cleanLine}`;
    }

    // Mark potential amounts
    if (cleanLine.match(/[$€£¥]\s*\d+[.,]\d{2}|\d+[.,]\d{2}\s*[$€£¥]/)) {
      return `[AMOUNT] ${cleanLine}`;
    }

    return cleanLine;
  });

  return processedText.join('\n');
};

// --- Utility Functions ---
const fetchWithRetry = async (payload: GenkitPayload, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const genkitSecureProxy = httpsCallable(functions, 'genkitProxy', {
        timeout: 300000, // 5 minutes
      });
      const result = await genkitSecureProxy(payload);
      return (result as GenkitResponse).data.response;
    } catch (error) {
      // Attempt failed, will retry if attempts remaining
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Single API call function to process PDF and return categorized transactions
const processAndCategorizeTransactions = async (
  rawPdfText: string
): Promise<Transaction[]> => {
  const processedText = processRawPDFText(rawPdfText);

  const comprehensiveInstruction = `
You are a world-class financial analysis engine. Process the provided raw bank statement text and:

1. EXTRACT all transactions from the text
2. STANDARDIZE the format
3. CATEGORIZE each transaction
4. RETURN properly structured JSON

EXTRACTION & FORMATTING RULES:
- Parse any date format and convert to YYYY-MM-DD
- Extract merchant names, amounts, and transaction types
- Identify Money In vs Money Out transactions
- Clean up descriptions and references

CATEGORIZATION GUIDELINES:
- 'Groceries': ALDI, Rewe, EDEKA, Lidl, Albert Heijn, AEZ
- 'Shopping': Amazon, Temu, Ernsting's Family, Woolworth, H&M, Zalando
- 'Dining/Fast Food': Burger King, McDonald's, Subway, restaurants
- 'Transport/Travel': DB Vertrieb GmbH, MVV, Airbnb, transport
- 'Telecom/Utilities': E-Plus Service GmbH, mobile/internet providers
- 'Childcare/Education': Schools, daycare, education fees
- 'Transfer/Payment': Person-to-person transfers, payments
- 'Salary/Income': Salary, income, benefits
- 'Fees/Other': Bank fees, charges, misc
- 'Personal Finance': Savings, investments, financial services
- 'Leisure/Hobby': Entertainment, hobbies, recreation

Return a JSON array of transaction objects with the exact schema provided.
`;

  const payload = {
    contents: [
      { parts: [{ text: `Process this bank statement:\n\n${processedText}` }] },
    ],
    systemInstruction: { parts: [{ text: comprehensiveInstruction }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  try {
    const response = await fetchWithRetry(payload);
    const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      throw new Error('API response was empty or incorrectly structured.');
    }

    const transactions = JSON.parse(jsonText);

    // Add UI formatting
    const formattedTransactions = transactions.map(
      (t: Transaction, index: number) => ({
        ...t,
        id: index.toString(),
        amountString:
          t.type === 'Money Out'
            ? `-€${t.amount.toFixed(2)}`
            : `+€${t.amount.toFixed(2)}`,
      })
    );

    return formattedTransactions;
  } catch (error) {
    console.error('Processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Error processing transactions: ' + errorMessage);
  }
};

// CSV processing function
const processCSVFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const csvText = e.target?.result as string;
      resolve(csvText);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    reader.readAsText(file);
  });
};

// Process CSV data and categorize transactions
const processAndCategorizeCSVTransactions = async (
  csvText: string
): Promise<Transaction[]> => {
  const comprehensiveInstruction = `
You are a world-class financial analysis engine. Process the provided CSV bank statement data and:

1. EXTRACT all transactions from the CSV data
2. STANDARDIZE the format
3. CATEGORIZE each transaction
4. RETURN properly structured JSON

CSV PROCESSING RULES:
- The first row may contain column headers (Date, Description, Amount, etc.)
- If headers are present, use them to identify fields
- If no headers, process based on field positions and delimiters
- Parse any date format and convert to YYYY-MM-DD
- Extract merchant names, amounts, and transaction types
- Identify Money In vs Money Out transactions (positive/negative amounts or debit/credit indicators)
- Clean up descriptions and references

CATEGORIZATION GUIDELINES:
- 'Groceries': ALDI, Rewe, EDEKA, Lidl, Albert Heijn, AEZ, supermarket names
- 'Shopping': Amazon, Temu, Ernsting's Family, Woolworth, H&M, Zalando, retail stores
- 'Dining/Fast Food': Burger King, McDonald's, Subway, restaurants, food delivery
- 'Transport/Travel': DB Vertrieb GmbH, MVV, Airbnb, transport, fuel, parking
- 'Telecom/Utilities': E-Plus Service GmbH, mobile/internet providers, electricity, gas
- 'Childcare/Education': Schools, daycare, education fees, books
- 'Transfer/Payment': Person-to-person transfers, payments, wire transfers
- 'Salary/Income': Salary, income, benefits, refunds, returns
- 'Fees/Other': Bank fees, charges, ATM fees, miscellaneous
- 'Personal Finance': Savings, investments, financial services, insurance
- 'Leisure/Hobby': Entertainment, hobbies, recreation, subscriptions

IMPORTANT CSV CONSIDERATIONS:
- Handle different CSV formats (comma, semicolon, tab delimited)
- Account for quoted fields that may contain delimiters
- Process empty fields gracefully
- Detect currency symbols and amounts
- Handle different date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)

Return a JSON array of transaction objects with the exact schema provided.
`;

  const payload = {
    contents: [
      { parts: [{ text: `Process this CSV bank statement:\n\n${csvText}` }] },
    ],
    systemInstruction: { parts: [{ text: comprehensiveInstruction }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  try {
    const response = await fetchWithRetry(payload);
    const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      throw new Error('API response was empty or incorrectly structured.');
    }

    const transactions = JSON.parse(jsonText);

    // Add UI formatting
    const formattedTransactions = transactions.map(
      (t: Transaction, index: number) => ({
        ...t,
        id: index.toString(),
        amountString:
          t.type === 'Money Out'
            ? `-€${t.amount.toFixed(2)}`
            : `+€${t.amount.toFixed(2)}`,
      })
    );

    return formattedTransactions;
  } catch (error) {
    console.error('CSV Processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error('Error processing CSV transactions: ' + errorMessage);
  }
};

export {
  extractTextFromPDF,
  fetchWithRetry,
  processAndCategorizeCSVTransactions,
  processAndCategorizeTransactions,
  processCSVFile,
};
