import React, { useState, useEffect } from 'react';
import { Transaction, Income, CategorySettings, GeminiParsedResponse, CategoryType } from './types';
import { DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import InputArea from './components/InputArea';
import ConfirmationModal from './components/ConfirmationModal';
import IncomeSettings from './components/IncomeSettings';
import PercentageSettings from './components/PercentageSettings';
import HistoryModal from './components/HistoryModal';
import { parseTransactionInput } from './services/geminiService';
import { List } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Income is now stored per month: Key "YYYY-MM" -> Income object
  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<string, Income>>(() => {
    const saved = localStorage.getItem('finance_monthly_incomes');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing monthly incomes", e);
            return {};
        }
    }
    
    // Migration for legacy single income format
    const legacy = localStorage.getItem('finance_income');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            return { [currentKey]: parsed };
        } catch (e) {
            return {};
        }
    }

    return {};
  });

  const [settings, setSettings] = useState<CategorySettings>(() => {
    const saved = localStorage.getItem('finance_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [currentDashboardDate, setCurrentDashboardDate] = useState(new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<GeminiParsedResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_monthly_incomes', JSON.stringify(monthlyIncomes));
  }, [monthlyIncomes]);

  useEffect(() => {
    localStorage.setItem('finance_settings', JSON.stringify(settings));
  }, [settings]);

  // Derived State for Current Month
  const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const currentMonthKey = getMonthKey(currentDashboardDate);
  const currentIncome = monthlyIncomes[currentMonthKey] || { salary: 0, advance: 0, extras: 0 };

  // Handlers
  const handleUpdateIncome = (newIncome: Income) => {
    setMonthlyIncomes(prev => ({
        ...prev,
        [currentMonthKey]: newIncome
    }));
  };

  const handleGeminiInput = async (text?: string, audioBlob?: Blob) => {
    setIsLoading(true);
    try {
      let audioBase64: string | undefined;
      let mimeType: string | undefined;

      if (audioBlob) {
        // Convert Blob to Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
             const base64Data = reader.result as string;
             resolve(base64Data.split(',')[1]);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        audioBase64 = await base64Promise;
        mimeType = audioBlob.type;
      }

      const result = await parseTransactionInput(text, audioBase64, mimeType);
      setPendingTransaction(result);
      setEditingId(null); // Ensure we are in create mode
    } catch (error) {
      console.error("Failed to process input", error);
      alert("Desculpe, não consegui entender. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTransaction = (data: GeminiParsedResponse) => {
    
    // Handle Income type specifically
    if (data.type === 'INCOME') {
        const dateObj = new Date(data.date || new Date());
        const targetMonthKey = getMonthKey(dateObj);
        
        setMonthlyIncomes(prev => {
            const existing = prev[targetMonthKey] || { salary: 0, advance: 0, extras: 0 };
            return {
                ...prev,
                [targetMonthKey]: {
                    ...existing,
                    extras: existing.extras + data.amount
                }
            };
        });
        
        // If the income date is in a different month than currently viewed, maybe switch view or just notify?
        // For simplicity, we just save it.
        setPendingTransaction(null);
        return;
    }

    // Handle Expense type
    if (editingId) {
      // Update existing transaction
      setTransactions(prev => prev.map(t => 
        t.id === editingId 
          ? { 
              ...t, 
              description: data.description, 
              amount: data.amount, 
              category: data.category as CategoryType, 
              date: data.date || t.date 
            } 
          : t
      ));
      setEditingId(null);
    } else {
      // Create new transaction
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description: data.description,
        amount: data.amount,
        category: data.category as CategoryType,
        date: data.date || new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      setTransactions(prev => [...prev, newTransaction]);
    }
    setPendingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const startEditingTransaction = (transaction: Transaction) => {
    setPendingTransaction({
      type: 'EXPENSE',
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date
    });
    setEditingId(transaction.id);
    setShowHistoryModal(false); 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💸</span>
                    <span className="font-bold text-xl tracking-tight text-slate-800">Baguncinha Salarial</span>
                </div>
                <button 
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                    <List className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Histórico</span>
                </button>
            </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
            <Dashboard 
                transactions={transactions}
                income={currentIncome}
                settings={settings}
                currentDate={currentDashboardDate}
                onDateChange={setCurrentDashboardDate}
                onOpenIncomeSettings={() => setShowIncomeModal(true)}
                onOpenPercentageSettings={() => setShowSettingsModal(true)}
            />
        </main>

        {/* Input Area */}
        <InputArea onSend={handleGeminiInput} isLoading={isLoading} />

        {/* Modals */}
        <ConfirmationModal 
            data={pendingTransaction} 
            isEditing={!!editingId}
            onConfirm={confirmTransaction} 
            onCancel={() => {
              setPendingTransaction(null);
              setEditingId(null);
            }} 
        />

        <IncomeSettings 
            income={currentIncome} 
            setIncome={handleUpdateIncome} 
            isOpen={showIncomeModal} 
            onClose={() => setShowIncomeModal(false)}
            currentDate={currentDashboardDate}
        />

        <PercentageSettings 
            settings={settings} 
            onSave={setSettings} 
            isOpen={showSettingsModal} 
            onClose={() => setShowSettingsModal(false)} 
        />

        <HistoryModal 
            transactions={transactions}
            onDelete={deleteTransaction}
            onEdit={startEditingTransaction}
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
        />
    </div>
  );
};

export default App;