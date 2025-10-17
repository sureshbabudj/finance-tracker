'use client';

import React, { useCallback, useState } from 'react';

import { Transaction } from '../types';
import { fetchWithRetry, GenkitPayload } from '../utils/pdfProcessor';

import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

interface InsightsProcessorProps {
  transactions: Transaction[];
  onError: (error: string) => void;
}

export const InsightsProcessor: React.FC<InsightsProcessorProps> = ({
  transactions,
  onError,
}) => {
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Financial Analysis Report
  const generateAnalysisReport = useCallback(async () => {
    if (transactions.length === 0) {
      onError('Please process the statement first to generate the report.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisReport(null);
    onError(''); // Clear previous errors

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
      onError(
        'Failed to generate financial analysis report. Error: ' + errorMessage
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [transactions, onError]);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle>Financial Insights & Analysis</CardTitle>
        <CardDescription>
          Get AI-powered insights into your spending patterns and financial
          habits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Generate Report Button */}
          <div className='flex justify-between items-center'>
            <div>
              <h4 className='text-md font-semibold text-gray-700'>
                AI Financial Analysis
              </h4>
              <p className='text-sm text-gray-500'>
                Generate personalized insights based on your transaction data
              </p>
            </div>
            <Button
              onClick={generateAnalysisReport}
              disabled={isAnalyzing}
              className='px-6 py-2'
            >
              {isAnalyzing ? (
                <span className='flex items-center'>
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Generate Financial Report'
              )}
            </Button>
          </div>

          {/* Analysis Report Display */}
          {analysisReport && (
            <div className='mt-6'>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                <div className='flex items-center mb-4'>
                  <h3 className='text-lg font-medium text-blue-800'>
                    📊 Financial Analysis Report
                  </h3>
                </div>
                <div className='bg-white p-4 rounded border'>
                  <div
                    className='prose prose-sm max-w-none text-gray-700'
                    dangerouslySetInnerHTML={{
                      __html: analysisReport
                        .replace(
                          /## /g,
                          '<h2 class="text-lg font-bold mt-4 mb-2">'
                        )
                        .replace(
                          /### /g,
                          '<h3 class="text-md font-semibold mt-3 mb-2">'
                        )
                        .replace(/\* /g, '<li>')
                        .replace(/\n/g, '<br/>')
                        .replace(/<li>/g, '<ul class="list-disc ml-4"><li>')
                        .replace(/<br\/><br\/>/g, '</ul><br/>'),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
