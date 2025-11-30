import React, { useState } from 'react';
import { CategorySettings, CategoryType } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { Settings } from 'lucide-react';

interface PercentageSettingsProps {
  settings: CategorySettings;
  onSave: (settings: CategorySettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PercentageSettings: React.FC<PercentageSettingsProps> = ({ settings, onSave, isOpen, onClose }) => {
  const [localSettings, setLocalSettings] = useState<CategorySettings>(settings);

  if (!isOpen) return null;

  const categories = Object.values(CategoryType);
  
  const handleChange = (cat: CategoryType, value: string) => {
    const num = parseInt(value) || 0;
    setLocalSettings({ ...localSettings, [cat]: num });
  };

  const total = categories.reduce((acc, cat) => acc + localSettings[cat], 0);
  const isValid = total === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-600" />
            Configurar Potes
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
            {categories.map(cat => (
                <div key={cat} className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">{CATEGORY_LABELS[cat]}</label>
                    <div className="relative w-24">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={localSettings[cat]}
                            onChange={(e) => handleChange(cat, e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                </div>
            ))}
        </div>

        <div className={`mt-6 p-4 rounded-lg flex justify-between items-center ${isValid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            <span className="font-semibold">Total</span>
            <span className="font-bold text-xl">{total}%</span>
        </div>
        {!isValid && <p className="text-xs text-red-500 mt-2 text-center">O total deve ser exatamente 100%.</p>}

        <button
          onClick={() => {
              if (isValid) {
                  onSave(localSettings);
                  onClose();
              }
          }}
          disabled={!isValid}
          className={`w-full mt-6 py-2.5 rounded-lg font-medium transition-colors ${
              isValid 
              ? 'bg-slate-900 hover:bg-slate-800 text-white' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default PercentageSettings;