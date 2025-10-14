declare module '*.css';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  amountString: string;
  type: 'Money In' | 'Money Out';
  category: string;
}

export interface SortConfig {
  key: keyof Transaction;
  direction: 'ascending' | 'descending';
}

export interface StatCardProps {
  title: string;
  value: string;
  color: string;
  substring?: string;
}

export interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  uniqueCategories: string[];
}

export interface MarkdownRendererProps {
  content: string;
}

export interface TransactionExplanationModalProps {
  transaction: Transaction | null;
  explanation: string | null;
  loading: boolean;
  onClose: () => void;
}
