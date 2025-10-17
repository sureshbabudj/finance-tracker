'use client';

import { ArrowDownUp } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { SortConfig, Transaction } from '../types';
import { fetchWithRetry } from '../utils/pdfProcessor';

import { Filters, TransactionsTable } from './transactions-table';
import { TransactionExplanationModal } from './UI';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

interface TransactionDisplayProps {
  transactions: Transaction[];
  _onError?: (error: string) => void; // Made optional and prefixed with underscore
}

export const TransactionDisplay: React.FC<TransactionDisplayProps> = ({
  transactions,
}) => {
  // Transaction Explanation state
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);
  const [transactionExplanation, setTransactionExplanation] = useState<
    string | null
  >(null);

  // Filter and Sort State
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

  // Calculate summary stats
  const totalOut = useMemo(
    () =>
      transactions
        .filter(t => t.type === 'Money Out')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalIn = useMemo(
    () =>
      transactions
        .filter(t => t.type === 'Money In')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netFlow = totalIn - totalOut;

  // Transaction Explanation
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

  // Filtering and Sorting Logic
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

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className='mt-6 space-y-6'>
      {/* Quick Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-gray-600'>
            Total Transactions
          </h4>
          <p className='text-2xl font-bold text-gray-900'>
            {transactions.length}
          </p>
        </div>
        <div className='bg-green-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-green-600'>Money In</h4>
          <p className='text-2xl font-bold text-green-700'>
            {totalIn.toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </p>
        </div>
        <div className='bg-red-50 p-4 rounded-lg'>
          <h4 className='text-sm font-medium text-red-600'>Money Out</h4>
          <p className='text-2xl font-bold text-red-700'>
            {Math.abs(totalOut).toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            netFlow >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <h4
            className={`text-sm font-medium ${
              netFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            Net Flow
          </h4>
          <p
            className={`text-2xl font-bold ${
              netFlow >= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {netFlow.toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </p>
        </div>
      </div>

      {/* Transaction Details */}
      <Card>
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
