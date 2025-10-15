'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Transaction } from '@/types';

import { MarkdownRenderer, StatCard } from './UI';
import { Button } from './ui/button';

export function TransactionsSummary({
  transactions,
  analysisReport,
  isAnalyzing,
  generateAnalysisReport,
}: {
  transactions: Transaction[];
  analysisReport: string | null;
  isAnalyzing: boolean;
  generateAnalysisReport: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  if (transactions.length === 0) return null;

  const totalOut = transactions
    .filter(t => t.type === 'Money Out')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIn = transactions
    .filter(t => t.type === 'Money In')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIn - totalOut;

  const categorySummary = transactions.reduce(
    (acc: Record<string, number>, t) => {
      if (t.type === 'Money Out') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    },
    {}
  );

  const sortedCategories = Object.entries(categorySummary)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <>
      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Summary & Insights
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6 mb-6'>
        <StatCard
          title='Total Money In'
          value={`€${totalIn.toFixed(2)}`}
          color='text-green-600'
        />
        <StatCard
          title='Total Money Out'
          value={`-€${totalOut.toFixed(2)}`}
          color='text-red-600'
        />
        <StatCard
          title='Net Flow'
          value={`${netFlow >= 0 ? '+' : '-'}€${Math.abs(netFlow).toFixed(2)}`}
          color={netFlow >= 0 ? 'text-blue-600' : 'text-red-600'}
        />
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className='flex flex-col gap-2'
      >
        <div className='flex items-center justify-between gap-4 px-4'>
          <h3 className='text-lg font-medium text-gray-700 mb-2'>
            Top Spending Categories (Money Out)
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='icon' className='size-8'>
              <ChevronsUpDown />
              <span className='sr-only'>Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <li className='flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100'>
          <span className='font-medium text-gray-600'>
            {sortedCategories[0][0]}
          </span>
          <span
            className={`font-bold ${
              (sortedCategories[0][1] as number) > 500
                ? 'text-red-500'
                : 'text-orange-500'
            }`}
          >{`-€${(sortedCategories[0][1] as number).toFixed(2)}`}</span>
        </li>
        <CollapsibleContent className='flex flex-col gap-2'>
          {sortedCategories.slice(1).map(([category, amount]) => (
            <li
              key={category}
              className='flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100'
            >
              <span className='font-medium text-gray-600'>{category}</span>
              <span
                className={`font-bold ${
                  (amount as number) > 500 ? 'text-red-500' : 'text-orange-500'
                }`}
              >{`-€${(amount as number).toFixed(2)}`}</span>
            </li>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <div className='mt-6'>
        <Button
          size='lg'
          onClick={generateAnalysisReport}
          disabled={isAnalyzing}
          className={`w-full ${isAnalyzing ? 'cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <span className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
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
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Generating Report...
            </span>
          ) : (
            '✨ Generate Financial Insights Report'
          )}
        </Button>
      </div>

      {analysisReport && (
        <div className='mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl shadow-md'>
          <h2 className='text-xl font-bold text-yellow-800 mb-4'>
            Gemini Financial Report
          </h2>
          <div className='text-sm text-gray-800'>
            <MarkdownRenderer content={analysisReport} />
          </div>
        </div>
      )}
    </>
  );
}
