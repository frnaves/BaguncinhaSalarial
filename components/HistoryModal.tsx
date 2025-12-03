import React, { useState, useEffect } from 'react';
import { Transaction, CategoryType } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS, getCategoryIcon } from '../constants';
import { Trash2, Calendar, Pencil, Download, Filter } from 'lucide-react';

interface HistoryModalProps {
  transactions: Transaction[];
  initialCategory?: CategoryType;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  transactions, 
  initialCategory, 
  onDelete, 
  onEdit, 
  isOpen, 
  onClose 
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState<CategoryType | 'ALL'>('ALL');

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setFilterCategory(initialCategory);
      } else {
        setFilterCategory('ALL');
      }
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .filter(t => filterCategory === 'ALL' || t.category === filterCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Não há dados para exportar neste período.");
      return;
    }

    const headers = ['Data', 'Descrição', 'Categoria', 'Valor (R$)'];
    const csvContent = [
      headers.join(';'),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
        CATEGORY_LABELS[t.category],
        t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',') // Excel friendly format
      ].join(';'))
    ].join('\n');

    // Add BOM for Excel utf-8 compatibility
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `baguncinha_export_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-slate-600" />
              Histórico
            </h2>
            <p className="text-sm text-slate-500 mt-1">
                {filteredTransactions.length} lançamentos encontrados
            </p>
          </div>
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
             <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
             />

             <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Filter className="w-4 h-4" />
                </div>
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as CategoryType | 'ALL')}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                >
                    <option value="ALL">Todas Categorias</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
             </div>

             <button 
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                title="Exportar CSV"
             >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
             </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Nenhum lançamento neste mês/filtro.</p>
            </div>
          ) : (
            filteredTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow group">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-full bg-slate-50"
                    style={{ color: CATEGORY_COLORS[t.category] }}
                  >
                    {getCategoryIcon(t.category)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{t.description}</p>
                    <div className="flex gap-2 text-xs text-slate-500">
                        <span>{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <span>•</span>
                        <span>{CATEGORY_LABELS[t.category]}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <span className="font-bold text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </span>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEdit(t)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-sm text-slate-500">
            <span>Total Filtrado:</span>
            <span className="font-bold text-slate-800 text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredTransactions.reduce((acc, t) => acc + t.amount, 0))}
            </span>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;