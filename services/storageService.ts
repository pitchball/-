import { Note, Transaction, AppSettings } from '../types';
import { DEFAULT_NOTE_CATEGORIES, DEFAULT_LEDGER_CATEGORIES, DEFAULT_QUOTE } from '../constants';

const KEYS = {
  NOTES: 'mononote_notes',
  TRANSACTIONS: 'mononote_transactions',
  SETTINGS: 'mononote_settings',
};

export const storageService = {
  getNotes: (): Note[] => {
    try {
      const data = localStorage.getItem(KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotes: (notes: Note[]) => {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  },

  getTransactions: (): Transaction[] => {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      headerQuote: DEFAULT_QUOTE,
      noteCategories: DEFAULT_NOTE_CATEGORIES,
      ledgerCategories: DEFAULT_LEDGER_CATEGORIES,
    };
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  exportData: (): string => {
    // Get raw data or fallback to defaults explicitly for export
    const notesStr = localStorage.getItem(KEYS.NOTES);
    const notes = notesStr ? JSON.parse(notesStr) : [];
    
    const transStr = localStorage.getItem(KEYS.TRANSACTIONS);
    const transactions = transStr ? JSON.parse(transStr) : [];
    
    let settings = {
        headerQuote: DEFAULT_QUOTE,
        noteCategories: DEFAULT_NOTE_CATEGORIES,
        ledgerCategories: DEFAULT_LEDGER_CATEGORIES,
    };
    
    const settingsStr = localStorage.getItem(KEYS.SETTINGS);
    if (settingsStr) {
        try {
            const parsedSettings = JSON.parse(settingsStr);
            settings = { ...settings, ...parsedSettings };
        } catch (e) {
            console.error('Failed to parse settings for export', e);
        }
    }

    const data = {
      notes,
      transactions,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      
      if (!Array.isArray(data.notes) && !Array.isArray(data.transactions)) {
        throw new Error('Invalid data format');
      }

      if (data.notes) localStorage.setItem(KEYS.NOTES, JSON.stringify(data.notes));
      if (data.transactions) localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      
      if (data.settings) {
          const currentDefaults = {
              headerQuote: DEFAULT_QUOTE,
              noteCategories: DEFAULT_NOTE_CATEGORIES,
              ledgerCategories: DEFAULT_LEDGER_CATEGORIES,
          };
          const mergedSettings = { ...currentDefaults, ...data.settings };
          localStorage.setItem(KEYS.SETTINGS, JSON.stringify(mergedSettings));
      }
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetApplication: () => {
    localStorage.clear();
    // Immediately restore defaults to prevent empty state issues
    const defaultSettings = {
        headerQuote: DEFAULT_QUOTE,
        noteCategories: DEFAULT_NOTE_CATEGORIES,
        ledgerCategories: DEFAULT_LEDGER_CATEGORIES,
    };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
};