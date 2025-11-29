import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface HeaderProps {
  quote: string;
  onUpdateQuote: (newQuote: string) => void;
  title: string;
  isEditingEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ quote, onUpdateQuote, title, isEditingEnabled = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempQuote, setTempQuote] = useState(quote);

  const handleSave = () => {
    if (tempQuote.trim()) {
      onUpdateQuote(tempQuote);
    }
    setIsEditing(false);
  };

  return (
    <div className="pt-12 pb-6 px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300">
      <div className="flex justify-between items-end mb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>
      
      {isEditingEnabled && (
        <div className="relative group">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={tempQuote}
                onChange={(e) => setTempQuote(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none text-sm text-gray-600 font-medium py-1"
              />
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempQuote(quote);
                setIsEditing(true);
              }}
              className="text-sm text-gray-500 font-medium cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <span>"{quote}"</span>
              <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
