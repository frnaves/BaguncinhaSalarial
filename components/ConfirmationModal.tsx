import React, { useState, useEffect } from 'react';
import { GeminiParsedResponse, CategoryType } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { Check, X, TrendingUp, TrendingDown } from 'lucide-react';

interface ConfirmationModalProps {
  data: GeminiParsedResponse | null;
  isEditing?: boolean;
  onConfirm: (data: GeminiParsedResponse) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ data, isEditing = false, onConfirm, onCancel }) => {
  const [editedData, setEditedData] = useState<GeminiParsedResponse | null>(null);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  if (!data || !editedData) return null;

  const handleSave = () => {
    onConfirm(editedData);
  };

  const isIncome = editedData.type === 'INCOME';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-5 duration-300">
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isIncome ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">
                    {isEditing ? 'Editar Lançamento' : (isIncome ? 'Confirmar Receita' : 'Confirmar Despesa')}
                </h3>
                <p className="text-sm text-slate-500">
                    {isIncome ? 'Valor será adicionado aos extras do mês.' : 'Classifique corretamente seu gasto.'}
                </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {/* Description */}
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</label>
                <input 
                    type="text" 
                    value={editedData.description}
                    onChange={(e) => setEditedData({...editedData, description: e.target.value})}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                    <input 
                        type="number" 
                        value={editedData.amount}
                        onChange={(e) => setEditedData({...editedData, amount: parseFloat(e.target.value)})}
                        className={`w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</label>
                    <input 
                        type="date" 
                        value={editedData.date}
                        onChange={(e) => setEditedData({...editedData, date: e.target.value})}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Category - Only for Expenses */}
            {!isIncome && (
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classificação</label>
                    <select 
                        value={editedData.category || CategoryType.FIXED}
                        onChange={(e) => setEditedData({...editedData, category: e.target.value as CategoryType})}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 shadow-lg ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            <Check className="w-5 h-5" /> 
            {isEditing ? 'Salvar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;