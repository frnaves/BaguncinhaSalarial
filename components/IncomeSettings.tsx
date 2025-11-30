import React from 'react';
import { Income } from '../types';
import { DollarSign } from 'lucide-react';

interface IncomeSettingsProps {
  income: Income;
  setIncome: (income: Income) => void;
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
}

const IncomeSettings: React.FC<IncomeSettingsProps> = ({ income, setIncome, isOpen, onClose, currentDate }) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof Income, value: string) => {
    const numValue = parseFloat(value) || 0;
    setIncome({ ...income, [field]: numValue });
  };

  const total = income.salary + income.advance + income.extras;

  // Format month name to show context (e.g. "Fevereiro 2024")
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                Configurar Proventos
            </h2>
            <p className="text-sm text-slate-500 mt-1">
                Ref. {capitalizedMonth}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Salário Líquido</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input
                type="number"
                value={income.salary || ''}
                onChange={(e) => handleChange('salary', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Adiantamento (Vale)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input
                type="number"
                value={income.advance || ''}
                onChange={(e) => handleChange('advance', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Extras / Outros</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input
                type="number"
                value={income.extras || ''}
                onChange={(e) => handleChange('extras', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
             <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total Mensal</span>
                <span className="font-bold text-xl text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
             </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

export default IncomeSettings;