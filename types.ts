export interface Note {
  id: string;
  content: string;
  category: string;
  createdAt: number;
  color: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface AppSettings {
  headerQuote: string;
  noteCategories: string[];
  ledgerCategories: string[];
}

export type ViewState = 'notes' | 'ledger' | 'settings';
