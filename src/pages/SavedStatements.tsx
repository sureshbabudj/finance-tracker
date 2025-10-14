import { FileText } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  deleteProcessedStatement,
  getAllProcessedStatements,
  ProcessedStatement,
} from '../utils/localStorage';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';

export const SavedStatements = () => {
  const [savedStatements, setSavedStatements] = React.useState<
    ProcessedStatement[]
  >([]);

  React.useEffect(() => {
    const statements = getAllProcessedStatements();
    setSavedStatements(statements);
  }, []);

  const handleDelete = (key: string) => {
    if (confirm('Are you sure you want to delete this statement?')) {
      deleteProcessedStatement(key);
      setSavedStatements(getAllProcessedStatements());
    }
  };

  if (savedStatements.length === 0) {
    return null;
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold flex items-center gap-2'>
          <FileText className='w-6 h-6' /> Saved Statements
          <span className='text-sm'>({savedStatements.length})</span>
        </h2>
      </div>

      <div className='space-y-3'>
        {savedStatements.map(statement => {
          const storageKey = `${statement.accountHolder.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${statement.fromDate.replace(/[^0-9]/g, '')}_to_${statement.toDate.replace(/[^0-9]/g, '')}_${statement.timestamp}`;

          return (
            <div key={statement.id} className='border rounded-xl'>
              <Item>
                <ItemContent>
                  <ItemTitle> {statement.accountHolder}</ItemTitle>
                  <ItemDescription>
                    <p className='text-sm'>
                      {statement.fromDate} to {statement.toDate}
                    </p>
                    <p className='text-xs'>
                      {statement.transactions.length} transactions •{' '}
                      {statement.fileName}
                    </p>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button asChild variant='outline' size='sm'>
                    <Link to={`/details/${statement.id}`}>View</Link>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleDelete(storageKey)}
                  >
                    Delete
                  </Button>
                </ItemActions>
              </Item>
            </div>
          );
        })}
      </div>
    </div>
  );
};
