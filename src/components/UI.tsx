import { ArrowUpRight } from 'lucide-react';
import markdownit from 'markdown-it';

import {
  MarkdownRendererProps,
  StatCardProps,
  TransactionExplanationModalProps,
} from '../types';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const md = markdownit();

export const StatCard = ({ title, value, substring, color }: StatCardProps) => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
      <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      <ArrowUpRight className='h-4 w-4 text-green-500' />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {substring && (
        <p className='text-xs text-muted-foreground'>{substring}</p>
      )}
    </CardContent>
  </Card>
);

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />;
};

export const TransactionExplanationModal = ({
  transaction,
  explanation,
  loading,
  onClose,
}: TransactionExplanationModalProps) => {
  if (!transaction) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100'
        onClick={e => e.stopPropagation()} // Prevent close on modal body click
      >
        <h2 className='text-xl font-bold text-indigo-700 border-b pb-2 mb-4 flex justify-between items-center'>
          Transaction Detail & Explanation
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-800 transition'
          >
            &times;
          </button>
        </h2>

        <div className='space-y-2 mb-4 text-sm'>
          <p className='font-semibold text-gray-700'>
            Date: <span className='font-normal'>{transaction.date}</span>
          </p>
          <p className='font-semibold text-gray-700'>
            Amount:{' '}
            <span
              className={`font-normal ${
                transaction.type === 'Money Out'
                  ? 'text-red-500'
                  : 'text-green-600'
              }`}
            >
              {transaction.amountString}
            </span>
          </p>
          <p className='font-semibold text-gray-700'>
            Category:{' '}
            <span className='font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded'>
              {transaction.category}
            </span>
          </p>
          <p className='font-semibold text-gray-700'>Description:</p>
          <p className='bg-gray-50 p-2 rounded italic text-gray-600'>
            {transaction.description}
          </p>
        </div>

        <div className='mt-4 border-t pt-4'>
          <h3 className='font-bold text-gray-800 mb-2'>
            ✨ Gemini&apos;s Insight:
          </h3>
          {loading ? (
            <p className='text-indigo-500 flex items-center'>
              <svg
                className='animate-spin -ml-1 mr-2 h-5 w-5'
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
              Analyzing transaction details...
            </p>
          ) : (
            <p className='text-gray-700'>{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
};
