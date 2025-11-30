import React, { useState } from 'react';
import { Transaction } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS, getCategoryIcon } from '../constants';
import { Trash2, Calendar, Pencil } from 'lucide-react';

interface HistoryModalProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ transactions, onDelete, onEdit, isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  if (!isOpen) return null;

  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                Histórico
            </h2>
            <div className="flex items-center gap-4">
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">
                    ✕
                </button>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            {filteredTransactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <p>Nenhuma transação neste mês.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                                     style={{ backgroundColor: CATEGORY_COLORS[t.category] }}>
                                    {getCategoryIcon(t.category, "w-5 h-5")}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-slate-800 truncate pr-2">{t.description}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="shrink-0">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                        <span>•</span>
                                        <span className="truncate">{CATEGORY_LABELS[t.category]}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-slate-700 mr-1 sm:mr-2 text-sm sm:text-base">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                </span>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => onEdit(t)}
                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(t.id)}
                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;