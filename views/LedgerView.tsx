import React, { useState, useMemo } from 'react';
import { Plus, X, Trash2, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, TrendingUp, Calendar, AlertCircle, List } from 'lucide-react';
import { Transaction, AppSettings, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

// Color palettes
const INCOME_COLORS = ['#10b981', '#3b82f6', '#06b6d4', '#8b5cf6']; // Green/Blue shades
const EXPENSE_COLORS = ['#ef4444', '#f59e0b', '#ec4899', '#f43f5e', '#6366f1']; // Red/Warm shades

interface LedgerViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ transactions, settings, setTransactions }) => {
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Date filter for Stats
  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(settings.ledgerCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // All-time Summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, total: income - expense };
  }, [transactions]);

  // Daily Stats Calculation
  const dailyStats = useMemo(() => {
    const dayTransactions = transactions
      .filter(t => t.date === statsDate)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by time desc
    
    // Calculate totals for the specific day
    let income = 0;
    let expense = 0;
    const categoryMap: {[key: string]: { value: number, type: TransactionType }} = {};

    dayTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;

      // Group by category for the pie chart
      // Key format: "Type-Category" to handle same category name in both (rare but possible)
      const key = `${t.type}-${t.category}`;
      if (!categoryMap[key]) {
        categoryMap[key] = { value: 0, type: t.type };
      }
      categoryMap[key].value += t.amount;
    });

    const totalVolume = income + expense;

    // Convert map to array and assign colors
    let incomeIdx = 0;
    let expenseIdx = 0;
    
    const pieData = Object.entries(categoryMap)
      .map(([key, data]) => {
        const categoryName = key.split('-')[1];
        const color = data.type === 'income' 
          ? INCOME_COLORS[incomeIdx++ % INCOME_COLORS.length]
          : EXPENSE_COLORS[expenseIdx++ % EXPENSE_COLORS.length];
        
        return {
          name: categoryName,
          value: data.value,
          type: data.type,
          color: color
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by amount

    return { income, expense, totalVolume, pieData, dayTransactions };
  }, [transactions, statsDate]);

  // Sort transactions for main list: Date DESC, then Timestamp DESC
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.timestamp - a.timestamp;
    });
  }, [transactions]);

  const openNewTransactionModal = () => {
    setEditingId(null);
    setAmount('');
    setDesc('');
    setType('expense');
    setCategory(settings.ledgerCategories[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditTransactionModal = (t: Transaction) => {
    setEditingId(t.id);
    setAmount(t.amount.toString());
    setDesc(t.description === t.category ? '' : t.description);
    setType(t.type);
    setCategory(t.category);
    setDate(t.date);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效的金额');
      return;
    }

    const description = desc.trim() || category;

    if (editingId) {
      // Update Existing
      setTransactions(prev => prev.map(t => 
        t.id === editingId 
        ? {
            ...t,
            amount: parseFloat(amount),
            description,
            type,
            category,
            date
          }
        : t
      ));
    } else {
      // Create New
      const newTrans: Transaction = {
        id: safeUUID(),
        amount: parseFloat(amount),
        description,
        type,
        category,
        date,
        timestamp: Date.now(),
      };
      setTransactions(prev => [newTrans, ...prev]);
    }

    setIsModalOpen(false);
    setAmount('');
    setDesc('');
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setTransactions(prev => prev.filter(t => t.id !== deleteId));
      setDeleteId(null);
      if (editingId === deleteId) {
        setIsModalOpen(false);
        setEditingId(null);
      }
    }
  };

  return (
    <div className="pb-24 px-4 min-h-screen">
      {/* CSS Hack to make date input fully clickable */}
      <style>{`
        .date-input-full-click::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">总结余</p>
          <h2 className="text-3xl font-bold mb-6">¥{summary.total.toFixed(2)}</h2>
          <div className="flex gap-8">
            <div>
              <div className="flex items-center gap-1 text-green-400 mb-1">
                <div className="p-1 bg-green-400/20 rounded-full"><ArrowDownRight size={12} /></div>
                <span className="text-xs font-semibold">总收入</span>
              </div>
              <p className="text-lg font-medium">¥{summary.income.toFixed(2)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-red-400 mb-1">
                 <div className="p-1 bg-red-400/20 rounded-full"><ArrowUpRight size={12} /></div>
                <span className="text-xs font-semibold">总支出</span>
              </div>
              <p className="text-lg font-medium">¥{summary.expense.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex bg-gray-200 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
          }`}
        >
          全部明细
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'stats' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
          }`}
        >
          每日统计
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {sortedTransactions.map(t => (
            <div 
              key={t.id} 
              onClick={() => openEditTransactionModal(t)}
              className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-50 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {t.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.description}</p>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{t.date}</span>
                    <span>•</span>
                    <span>{t.category}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                  {t.type === 'income' ? '+' : '-'}¥{t.amount.toFixed(2)}
                </p>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteId(t.id);
                  }}
                  className="text-gray-300 hover:text-red-500 p-3 -m-3 mt-1 transition-colors cursor-pointer relative z-10"
                  title="删除记录"
                >
                   <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
             <div className="text-center text-gray-400 py-10">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无账单</p>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[200px]">
                {/* Header & Date Picker */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <PieIcon size={18} className="text-blue-500" />
                    收支分析
                    </h3>
                    <div className="relative flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors group flex-shrink-0 select-none overflow-hidden">
                        <Calendar size={16} className="text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-700 tracking-wide min-w-[70px] text-center">{statsDate}</span>
                        
                        {/* Fully overlaid transparent input with forced trigger area */}
                        <input 
                        type="date" 
                        value={statsDate}
                        onChange={(e) => setStatsDate(e.target.value)}
                        className="date-input-full-click absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        title="选择日期"
                        />
                    </div>
                </div>
                
                {/* Daily Totals Cards */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">当日收入</p>
                    <p className="text-lg font-bold text-green-700">¥{dailyStats.income.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                    <p className="text-xs text-red-600 font-medium mb-1">当日支出</p>
                    <p className="text-lg font-bold text-red-700">¥{dailyStats.expense.toFixed(2)}</p>
                    </div>
                </div>

                {/* Combined Pie Chart Section */}
                <div>
                    {dailyStats.pieData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Calendar size={24} className="mb-2 opacity-50" />
                            <p className="text-xs">当日无收支记录</p>
                        </div>
                    ) : (
                        <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                收支构成
                                <span className="text-gray-800">¥{dailyStats.totalVolume.toFixed(2)}</span>
                            </h4>
                            <div className="h-48 w-full relative mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dailyStats.pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {dailyStats.pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `¥${value.toFixed(2)}`}
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs text-gray-400 font-medium">总流量</span>
                                    <span className="text-sm font-bold text-gray-800">¥{dailyStats.totalVolume.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Unified Legend */}
                            <div className="space-y-2">
                                {dailyStats.pieData.map((item) => {
                                    const percentage = ((item.value / dailyStats.totalVolume) * 100).toFixed(1);
                                    return (
                                        <div key={`${item.type}-${item.name}`} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-2.5 h-2.5 rounded-full" 
                                                    style={{ backgroundColor: item.color }}
                                                ></div>
                                                <span className="text-gray-600 font-medium">{item.name}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                                    item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.type === 'income' ? '收' : '支'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400">{percentage}%</span>
                                                <span className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                                                    ¥{item.value.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Transaction List */}
            {dailyStats.dayTransactions.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <List size={14} />
                        当日明细 ({dailyStats.dayTransactions.length})
                    </h4>
                    <div className="space-y-2">
                        {dailyStats.dayTransactions.map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => openEditTransactionModal(t)}
                              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer active:bg-gray-50 transition-colors -mx-2 px-2 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                        {t.type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{t.description}</p>
                                        <p className="text-[10px] text-gray-400">{t.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-bold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {t.type === 'income' ? '+' : '-'}¥{t.amount.toFixed(2)}
                                    </p>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteId(t.id);
                                        }}
                                        className="text-gray-300 hover:text-red-500 text-[10px] p-2 -m-2 inline-block relative z-10"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openNewTransactionModal}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-90 z-30"
      >
        <Plus size={28} />
      </button>

      {/* Modal - Increased z-index to 100 to cover navigation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingId ? '编辑账目' : '记一笔'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
               <button 
                 onClick={() => setType('expense')}
                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white shadow text-red-500' : 'text-gray-500'}`}
               >支出</button>
               <button 
                 onClick={() => setType('income')}
                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white shadow text-green-500' : 'text-gray-500'}`}
               >收入</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">金额</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              
              <div>
                 <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">描述 (选填)</label>
                 <input
                  type="text"
                  placeholder={category}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-gray-50 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">分类</label>
                   <div className="relative">
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-50 p-3 rounded-xl text-sm focus:outline-none appearance-none"
                    >
                        {settings.ledgerCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ArrowDownRight size={14} className="rotate-45" />
                    </div>
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">日期</label>
                   <div className="relative">
                     {/* Improved date input styling for mobile touch */}
                     <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-50 p-3 rounded-xl text-sm focus:outline-none min-h-[44px]"
                        style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    />
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Calendar size={14} />
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-4 mt-6 text-white rounded-2xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all ${
                type === 'expense' ? 'bg-red-500 shadow-red-500/20' : 'bg-green-500 shadow-green-500/20'
              }`}
            >
              {editingId ? '保存修改' : `保存${type === 'expense' ? '支出' : '收入'}`}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">删除记录</h3>
              <p className="text-sm text-gray-500 mb-6">确定要删除这条账目吗？此操作无法撤销。</p>
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