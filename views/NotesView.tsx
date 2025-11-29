import React, { useState } from 'react';
import { Plus, X, Trash2, Tag, Search, AlertCircle } from 'lucide-react';
import { Note, AppSettings } from '../types';
import { NOTE_COLORS } from '../constants';

// Safe ID generator fallback
const safeUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // fallback
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

interface NotesViewProps {
  notes: Note[];
  settings: AppSettings;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, settings, setNotes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New/Edit Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState(settings.noteCategories[0]);
  const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[0]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const openNewNoteModal = () => {
    setEditingId(null);
    setNewNoteContent('');
    setNewNoteCategory(settings.noteCategories[0]);
    setNewNoteColor(NOTE_COLORS[0]);
    setIsModalOpen(true);
  };

  const openEditNoteModal = (note: Note) => {
    setEditingId(note.id);
    setNewNoteContent(note.content);
    setNewNoteCategory(note.category);
    setNewNoteColor(note.color);
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!newNoteContent.trim()) return;

    if (editingId) {
      // Update existing note
      setNotes(prev => prev.map(note => 
        note.id === editingId 
          ? { 
              ...note, 
              content: newNoteContent, 
              category: newNoteCategory, 
              color: newNoteColor 
            } 
          : note
      ));
    } else {
      // Create new note
      const newNote: Note = {
        id: safeUUID(),
        content: newNoteContent,
        category: newNoteCategory,
        createdAt: Date.now(),
        color: newNoteColor,
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsModalOpen(false);
    setNewNoteContent('');
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setNotes(prev => prev.filter(n => n.id !== deleteId));
      setDeleteId(null);
      // If we were editing the deleted note, close the modal
      if (editingId === deleteId) {
        setIsModalOpen(false);
        setEditingId(null);
      }
    }
  };

  return (
    <div className="pb-24 px-4 min-h-screen">
      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('全部')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === '全部' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          全部
        </button>
        {settings.noteCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="搜索笔记..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-100 transition-all text-sm outline-none"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <Tag size={24} />
            </div>
            <p className="text-sm">空空如也</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => openEditNoteModal(note)}
              className={`p-5 rounded-3xl shadow-sm border border-black/5 relative group transition-all ${note.color} flex flex-col justify-between min-h-[160px] cursor-pointer hover:shadow-md active:scale-[0.99]`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold tracking-wider uppercase opacity-50">{note.category}</span>
                   <button 
                     onClick={(e) => { 
                       e.preventDefault();
                       e.stopPropagation(); 
                       setDeleteId(note.id);
                     }}
                     className="text-gray-400 hover:text-red-500 transition-colors p-3 -m-2 -mt-2 rounded-full hover:bg-red-50 z-10 relative cursor-pointer"
                     title="删除笔记"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {note.content}
                </p>
              </div>
              <div className="mt-4 text-[10px] text-gray-400">
                {new Date(note.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNewNoteModal}
        className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-90 z-30"
      >
        <Plus size={28} />
      </button>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? '编辑笔记' : '新建笔记'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>
            
            <textarea
              autoFocus
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="记录点什么..."
              className="w-full h-32 p-4 bg-gray-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 mb-4 text-sm"
            />

            <div className="mb-4">
               <label className="text-xs font-semibold text-gray-500 mb-2 block">分类</label>
               <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                 {settings.noteCategories.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setNewNoteCategory(cat)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                       newNoteCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            <div className="mb-6">
               <label className="text-xs font-semibold text-gray-500 mb-2 block">颜色</label>
               <div className="flex gap-2">
                 {NOTE_COLORS.map(color => (
                   <button
                     key={color}
                     onClick={() => setNewNoteColor(color)}
                     className={`w-8 h-8 rounded-full border border-gray-200 ${color} ${
                       newNoteColor === color ? 'ring-2 ring-offset-2 ring-black' : ''
                     }`}
                   />
                 ))}
               </div>
            </div>

            <button
              onClick={handleSaveNote}
              className="w-full py-3 bg-black text-white rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {editingId ? '更新笔记' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">删除笔记</h3>
              <p className="text-sm text-gray-500 mb-6">确定要删除这条笔记吗？此操作无法撤销。</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};