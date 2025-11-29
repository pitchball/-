import React from 'react';
import { NotebookPen, Wallet, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChange }) => {
  const navItemClass = (view: ViewState) => `
    flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200
    ${currentView === view ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 pb-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
      <button onClick={() => onChange('notes')} className={navItemClass('notes')}>
        <NotebookPen size={24} strokeWidth={currentView === 'notes' ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">笔记</span>
      </button>
      <button onClick={() => onChange('ledger')} className={navItemClass('ledger')}>
        <Wallet size={24} strokeWidth={currentView === 'ledger' ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">账本</span>
      </button>
      <button onClick={() => onChange('settings')} className={navItemClass('settings')}>
        <Settings size={24} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">设置</span>
      </button>
    </div>
  );
};