'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFirestoreStorage } from '@/hooks/useFirestoreStorage';

import { ProcessedStatement } from '../utils/firestoreStorage';

import { Checkbox } from '@/components/ui/checkbox';

const createColumns = (
  navigate: ReturnType<typeof useNavigate>
): ColumnDef<ProcessedStatement>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'accountHolder',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Account Holder
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className='font-medium'>
        {row.getValue('accountHolder') ?? 'Unknown Holder'}
      </div>
    ),
  },
  {
    accessorKey: 'fromDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          From Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const fromDate = row.getValue('fromDate') as string;
      return (
        <div>{fromDate ? new Date(fromDate).toLocaleDateString() : ''}</div>
      );
    },
  },
  {
    accessorKey: 'toDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          To Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const toDate = row.getValue('toDate') as string;
      return <div>{toDate ? new Date(toDate).toLocaleDateString() : ''}</div>;
    },
  },
  {
    accessorKey: 'transactionsCount',
    header: () => <div className='text-right'>Transactions</div>,
    cell: ({ row }) => {
      return (
        <div className='text-right font-medium'>
          {row.getValue('transactionsCount') || 0}
        </div>
      );
    },
  },
  {
    accessorKey: 'uploadTime',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Processed At
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const uploadTime = row.getValue('uploadTime') as string;
      return (
        <div>{uploadTime ? new Date(uploadTime).toLocaleString() : ''}</div>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const statement = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(statement.id)}
            >
              <Eye className='mr-2 h-4 w-4' />
              Copy statement ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(`/details/${statement.id}`)}
            >
              <Eye className='mr-2 h-4 w-4' />
              View statement
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className='mr-2 h-4 w-4' />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-red-600'
              onClick={() => {
                const event = new CustomEvent('deleteStatement', {
                  detail: { statementId: statement.id },
                });
                window.dispatchEvent(event);
              }}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function StatementsList() {
  const navigate = useNavigate();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [statements, setStatements] = useState<ProcessedStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    isAuthenticated,
    getAllProcessedStatements,
    deleteProcessedStatement,
  } = useFirestoreStorage();

  // Create columns with navigate function
  const columns = createColumns(navigate);

  // Load statements on component mount
  useEffect(() => {
    const loadStatements = async () => {
      if (!isAuthenticated) {
        setStatements([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedStatements = await getAllProcessedStatements();
        setStatements(fetchedStatements);
      } catch (error) {
        console.error('Error loading statements:', error);
        setStatements([]);
      } finally {
        setLoading(false);
      }
    };

    loadStatements();
  }, [isAuthenticated, getAllProcessedStatements]);

  // Handle statement deletion via custom event
  useEffect(() => {
    const handleDeleteStatement = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { statementId } = customEvent.detail;
      if (window.confirm('Are you sure you want to delete this statement?')) {
        try {
          const success = await deleteProcessedStatement(statementId);
          if (success) {
            setStatements(prev => prev.filter(s => s.id !== statementId));
          }
        } catch (error) {
          console.error('Error deleting statement:', error);
        }
      }
    };

    window.addEventListener('deleteStatement', handleDeleteStatement);
    return () => {
      window.removeEventListener('deleteStatement', handleDeleteStatement);
    };
  }, [deleteProcessedStatement]);

  const table = useReactTable({
    data: statements,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='Filter by account holder...'
          value={
            (table.getColumn('accountHolder')?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table.getColumn('accountHolder')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading statements...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {!isAuthenticated
                    ? 'Please log in to view your statements.'
                    : 'No statements found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
