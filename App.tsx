import React, { useState, useEffect } from 'react';
import { ViewState, Note, Transaction, AppSettings } from './types';
import { storageService } from './services/storageService';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { NotesView } from './views/NotesView';
import { LedgerView } from './views/LedgerView';
import { SettingsView } from './views/SettingsView';
import { DEFAULT_NOTE_CATEGORIES, DEFAULT_LEDGER_CATEGORIES, DEFAULT_QUOTE } from './constants';

const App: React.FC = () => {
  // State Initialization with Defaults to prevent white flash
  const [view, setView] = useState<ViewState>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    headerQuote: DEFAULT_QUOTE,
    noteCategories: DEFAULT_NOTE_CATEGORIES,
    ledgerCategories: DEFAULT_LEDGER_CATEGORIES
  });
  
  // Track if initial data load is complete to prevent overwriting storage with empty states
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    setNotes(storageService.getNotes());
    setTransactions(storageService.getTransactions());
    const savedSettings = storageService.getSettings();
    if (savedSettings) {
        setSettings(savedSettings);
    }
    setIsLoaded(true);
  }, []);

  // Persistence Effects - Only save if data has been loaded
  useEffect(() => {
    if (isLoaded) storageService.saveNotes(notes);
  }, [notes, isLoaded]);

  useEffect(() => {
    if (isLoaded) storageService.saveTransactions(transactions);
  }, [transactions, isLoaded]);

  useEffect(() => {
    // Ensure we don't save empty settings during initialization
    if (isLoaded && settings.noteCategories.length > 0) storageService.saveSettings(settings);
  }, [settings, isLoaded]);

  // Handlers
  const handleUpdateQuote = (newQuote: string) => {
    const newSettings = { ...settings, headerQuote: newQuote };
    setSettings(newSettings);
    storageService.saveSettings(newSettings); // Immediate save for UX
  };

  const handleReset = () => {
    // 1. Clear Local Storage and restore defaults
    storageService.resetApplication();

    // 2. Reset React State immediately (no reload needed)
    setNotes([]);
    setTransactions([]);
    setSettings({
        headerQuote: DEFAULT_QUOTE,
        noteCategories: DEFAULT_NOTE_CATEGORIES,
        ledgerCategories: DEFAULT_LEDGER_CATEGORIES
    });

    // 3. Navigate back to home
    setView('notes');
  };

  const handleRestore = () => {
    // Reload state from local storage after a successful import
    setNotes(storageService.getNotes());
    setTransactions(storageService.getTransactions());
    const savedSettings = storageService.getSettings();
    if (savedSettings) {
        setSettings(savedSettings);
    }
    alert('数据恢复成功！');
  };

  // Render Content based on View
  const renderContent = () => {
    switch (view) {
      case 'notes':
        return <NotesView notes={notes} setNotes={setNotes} settings={settings} />;
      case 'ledger':
        return <LedgerView transactions={transactions} setTransactions={setTransactions} settings={settings} />;
      case 'settings':
        return <SettingsView settings={settings} setSettings={setSettings} onReset={handleReset} onRestore={handleRestore} />;
      default:
        return <NotesView notes={notes} setNotes={setNotes} settings={settings} />;
    }
  };

  const getTitle = () => {
    if (view === 'notes') return '我的笔记';
    if (view === 'ledger') return '我的账本';
    return '设置';
  };

  return (
    <div className="w-full max-w-md mx-auto h-full bg-gray-50 flex flex-col relative shadow-2xl overflow-y-auto hide-scrollbar">
      {/* Dynamic Header */}
      <Header 
        title={getTitle()}
        quote={settings.headerQuote} 
        onUpdateQuote={handleUpdateQuote}
        isEditingEnabled={view === 'notes'} // Only allow quote editing on notes/home view
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentView={view} onChange={setView} />
    </div>
  );
};

export default App;