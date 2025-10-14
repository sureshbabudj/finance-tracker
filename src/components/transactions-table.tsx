import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FiltersProps, Transaction } from '@/types';

export const Filters = ({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  uniqueCategories,
}: FiltersProps) => (
  <div className='flex flex-col sm:flex-row gap-4 mb-4'>
    <Input
      type='text'
      defaultValue={search}
      placeholder='Search description, category, or amount...'
      onChange={e => setSearch(e.target.value)}
    />
    <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v)}>
      <SelectTrigger>
        <SelectValue placeholder='Select a category' />
      </SelectTrigger>
      <SelectContent>
        {uniqueCategories.map((category: string) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export function TransactionsTable({
  onSort,
  getSortIcon,
  transactions,
  onExplain,
}: {
  onSort: (key: keyof Transaction) => void;
  getSortIcon: (key: keyof Transaction) => any | string | null;
  transactions: Transaction[];
  onExplain: (t: Transaction) => void;
}) {
  return (
    <>
      <div className='overflow-hidden rounded-md border'>
        <div className='relative w-full overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  'Date',
                  'Description',
                  'Category',
                  'Amount',
                  'Type',
                  'Actions',
                ].map((header, index) => {
                  const keyMap: Record<string, keyof Transaction> = {
                    Date: 'date',
                    Description: 'description',
                    Category: 'category',
                    Amount: 'amount',
                    Type: 'type',
                  };
                  const sortKey = keyMap[header];
                  return (
                    <TableHead
                      key={header}
                      onClick={sortKey ? () => onSort(sortKey) : undefined}
                      className={`px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none ${
                        sortKey ? 'cursor-pointer hover:bg-gray-100' : ''
                      } ${index === 0 ? 'rounded-tl-xl' : ''} ${
                        index === 5 ? 'rounded-tr-xl' : ''
                      }`}
                    >
                      <span className='flex items-center'>
                        {header}
                        {sortKey && (
                          <span className='ml-1 text-xs'>
                            {getSortIcon(sortKey)}
                          </span>
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(t => (
                <TableRow
                  key={t.id}
                  className='hover:bg-indigo-50 transition duration-100'
                >
                  <TableCell className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {t.date}
                  </TableCell>
                  <TableCell className='px-6 py-4 max-w-sm overflow-hidden text-ellipsis text-sm text-gray-700'>
                    {t.description}
                  </TableCell>
                  <TableCell className='px-6 py-4 whitespace-nowrap'>
                    <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell className='px-6 py-4 whitespace-nowrap text-sm font-bold'>
                    <span
                      className={
                        t.type === 'Money Out'
                          ? 'text-red-500'
                          : 'text-green-600'
                      }
                    >
                      {t.amountString}
                    </span>
                  </TableCell>
                  <TableCell className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {t.type}
                  </TableCell>
                  <TableCell className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <Button onClick={() => onExplain(t)}>✨ Explain</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
