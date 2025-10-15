import { Transaction } from '../types';

export interface ProcessedStatement {
  id: string;
  accountHolder: string;
  fromDate: string;
  toDate: string;
  timestamp: string;
  transactions: Transaction[];
  rawText: string;
  fileName?: string;
  processedAt: string;
}

// Generate storage key in the format: account_holder_name_from_date_to_date_unique_timestamp
export const generateStorageKey = (
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

// Save processed statement to localStorage
export const saveProcessedStatement = async (
  statement: ProcessedStatement
): Promise<string | undefined> => {
  try {
    const key = generateStorageKey(
      statement.accountHolder,
      statement.fromDate,
      statement.toDate,
      statement.timestamp
    );
    await localStorage.setItem(key, JSON.stringify({ ...statement, id: key }));
    return key;
  } catch (error) {
    console.error('Error saving statement to localStorage:', error);
    return undefined;
  }
};

// Get all processed statements from localStorage
export const getAllProcessedStatements = (): ProcessedStatement[] => {
  try {
    const statements: ProcessedStatement[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_to_')) {
        // This looks like one of our statement keys
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const statement = JSON.parse(value) as ProcessedStatement;
            statements.push({ ...statement, id: key });
          } catch (parseError) {
            console.warn(
              `Failed to parse statement with key: ${key}`,
              parseError
            );
          }
        }
      }
    }
    return statements.sort(
      (a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
  } catch (error) {
    console.error('Error retrieving statements from localStorage:', error);
    return [];
  }
};

// Get a specific processed statement by key
export const getProcessedStatement = (
  key: string
): ProcessedStatement | null => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as ProcessedStatement;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving statement from localStorage:', error);
    return null;
  }
};

// Delete a processed statement
export const deleteProcessedStatement = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error deleting statement from localStorage:', error);
    return false;
  }
};

// Clear all processed statements
export const clearAllProcessedStatements = (): boolean => {
  try {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_to_')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing statements from localStorage:', error);
    return false;
  }
};

// Normalize date to YYYY-MM-DD format
const normalizeDate = (dateStr: string): string => {
  try {
    // Handle different date formats
    const cleanDate = dateStr.replace(/[^\d/\-\\.]/g, '');
    const parts = cleanDate.split(/[/\-\\.]/);

    if (parts.length === 3) {
      let day, month, year;

      // Determine format based on which part is likely the year
      if (parts[2].length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY
        day = parts[0];
        month = parts[1];
        year = parts[2];
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        // Assume DD/MM/YY format
        day = parts[0];
        month = parts[1];
        year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      }

      // Ensure two-digit month and day
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');

      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.warn('Error normalizing date:', dateStr, error);
  }

  // Fallback to current date
  return new Date().toISOString().split('T')[0];
};

// Extract account holder and date range from raw PDF/CSV text
export const extractStatementMetadata = (rawText: string) => {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  let accountHolder = 'Unknown_Account_Holder';
  let fromDate = '';
  let toDate = '';

  // Check if this is CSV data (contains comma-separated values)
  const isCSV = lines.some(
    line => line.includes(',') && line.split(',').length > 2
  );

  if (isCSV) {
    // CSV-specific extraction
    // For CSV, account holder is often not in the data, so use a default
    accountHolder = 'CSV_Statement_User';

    // Extract dates from CSV data (look for date patterns in first column)
    const datePattern =
      /^\d{4}-\d{2}-\d{2}|\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4}/;
    const dates = lines
      .map(line => {
        const firstColumn = line.split(',')[0]?.replace(/"/g, '').trim();
        return firstColumn?.match(datePattern)?.[0];
      })
      .filter(Boolean)
      .map(dateStr => normalizeDate(dateStr!))
      .sort();

    if (dates.length >= 2) {
      fromDate = dates[0];
      toDate = dates[dates.length - 1];
    }
  } else {
    // PDF text extraction (original logic)
    // Common patterns for account holder extraction
    const accountHolderPatterns = [
      /Account\s+Holder[:\s]+([^\n\r]+)/i,
      /Kontoinhaber[:\s]+([^\n\r]+)/i,
      /Name[:\s]+([^\n\r]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, // First and last name pattern
    ];

    // Extract account holder from PDF text
    for (const line of lines.slice(0, 20)) {
      // Check first 20 lines
      for (const pattern of accountHolderPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          accountHolder = match[1].trim();
          break;
        }
      }
      if (accountHolder !== 'Unknown_Account_Holder') break;
    }

    // Common patterns for date range extraction
    const dateRangePatterns = [
      /from\s+(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})\s+to\s+(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})/i,
      /(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})\s*-\s*(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})/,
      /statement\s+period[:\s]+(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})\s+to\s+(\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4})/i,
    ];

    // Extract date range from PDF text
    const fullText = rawText;
    for (const pattern of dateRangePatterns) {
      const match = fullText.match(pattern);
      if (match && match[1] && match[2]) {
        fromDate = normalizeDate(match[1]);
        toDate = normalizeDate(match[2]);
        break;
      }
    }
  }

  // If no date range found, try to find individual dates and make an estimate
  if (!fromDate || !toDate) {
    const dateMatches = rawText.match(/\d{1,2}[/\-\\.]\d{1,2}[/\-\\.]\d{2,4}/g);
    if (dateMatches && dateMatches.length >= 2) {
      const dates = dateMatches.map(normalizeDate).sort();
      fromDate = dates[0];
      toDate = dates[dates.length - 1];
    }
  }

  // Fallback dates if still not found
  if (!fromDate) fromDate = new Date().toISOString().split('T')[0];
  if (!toDate) toDate = new Date().toISOString().split('T')[0];

  return {
    accountHolder: accountHolder || 'Unknown_Account_Holder',
    fromDate,
    toDate,
  };
};
