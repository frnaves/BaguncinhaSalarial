import React, { useState, useEffect } from 'react';
import { Transaction, Income, CategorySettings, GeminiParsedResponse, CategoryType } from './types';
import { DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import InputArea from './components/InputArea';
import ConfirmationModal from './components/ConfirmationModal';
import IncomeSettings from './components/IncomeSettings';
import PercentageSettings from './components/PercentageSettings';
import HistoryModal from './components/HistoryModal';
import LoginScreen from './components/LoginScreen';
import { parseTransactionInput } from './services/geminiService';
import { 
  subscribeToTransactions, 
  saveTransactionToDb, 
  deleteTransactionFromDb,
  subscribeToIncomes,
  saveIncomeToDb,
  subscribeToSettings,
  saveSettingsToDb,
  initializeUserData
} from './services/dbService';
import { auth } from './firebaseConfig';
import { signOut } from './services/authService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { List, CloudOff, AlertTriangle, ExternalLink, RefreshCw, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<string, Income>>({});
  const [settings, setSettings] = useState<CategorySettings>(DEFAULT_SETTINGS);
  
  // Database connection state
  const [dbError, setDbError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0); 

  const [currentDashboardDate, setCurrentDashboardDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<GeminiParsedResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Initialize default data for new users
        try {
            await initializeUserData(currentUser.uid);
        } catch (e) {
            console.error("Initialization error", e);
        }
      } else {
        // Reset state on logout
        setTransactions([]);
        setMonthlyIncomes({});
        setSettings(DEFAULT_SETTINGS);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Database Subscriptions ---
  
  useEffect(() => {
    if (!user) return; // Don't subscribe if no user

    const userId = user.uid;

    // 1. Transactions Listener
    const unsubscribeTransactions = subscribeToTransactions(
      userId,
      (data) => {
        setTransactions(data);
        setDbError(null);
      },
      (error) => {
        console.error("Erro de permissão ou conexão:", error);
        if (error?.message?.includes('Cloud Firestore API has not been used')) {
            setDbError('api_not_ready');
        } else {
            setDbError('generic');
        }
      }
    );

    // 2. Incomes Listener
    const unsubscribeIncomes = subscribeToIncomes(userId, (data) => {
      setMonthlyIncomes(data);
    });

    // 3. Settings Listener
    const unsubscribeSettings = subscribeToSettings(userId, (data) => {
      if (data) {
        setSettings(data);
      }
    });
    
    return () => {
      unsubscribeTransactions();
      unsubscribeIncomes();
      unsubscribeSettings();
    };
  }, [user, retryKey]); // Re-run when user changes or retry

  // Derived State
  const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const currentMonthKey = getMonthKey(currentDashboardDate);
  const currentIncome = monthlyIncomes[currentMonthKey] || { salary: 0, advance: 0, extras: 0 };

  // Handlers
  const handleUpdateIncome = async (newIncome: Income) => {
    if (!user) return;
    setMonthlyIncomes(prev => ({
        ...prev,
        [currentMonthKey]: newIncome
    }));
    await saveIncomeToDb(user.uid, currentMonthKey, newIncome);
  };

  const handleUpdateSettings = async (newSettings: CategorySettings) => {
      if (!user) return;
      setSettings(newSettings);
      await saveSettingsToDb(user.uid, newSettings);
  };

  const handleGeminiInput = async (text?: string, audioBlob?: Blob) => {
    setIsLoading(true);
    try {
      let audioBase64: string | undefined;
      let mimeType: string | undefined;

      if (audioBlob) {
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
      setEditingId(null); 
    } catch (error) {
      console.error("Failed to process input", error);
      alert("Desculpe, não consegui entender. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTransaction = async (data: GeminiParsedResponse) => {
    if (!user) return;

    // Handle Income type
    if (data.type === 'INCOME') {
        const dateObj = new Date(data.date || new Date());
        const targetMonthKey = getMonthKey(dateObj);
        
        const existing = monthlyIncomes[targetMonthKey] || { salary: 0, advance: 0, extras: 0 };
        const updatedIncome = {
            ...existing,
            extras: existing.extras + data.amount
        };

        await saveIncomeToDb(user.uid, targetMonthKey, updatedIncome);
        setPendingTransaction(null);
        return;
    }

    // Handle Expense type
    if (editingId) {
      const original = transactions.find(t => t.id === editingId);
      if (original) {
          const updatedTransaction: Transaction = {
              ...original,
              description: data.description,
              amount: data.amount,
              category: data.category as CategoryType,
              date: data.date || original.date
          };
          await saveTransactionToDb(user.uid, updatedTransaction);
      }
      setEditingId(null);
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description: data.description,
        amount: data.amount,
        category: data.category as CategoryType,
        date: data.date || new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      await saveTransactionToDb(user.uid, newTransaction);
    }
    setPendingTransaction(null);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        await deleteTransactionFromDb(user.uid, id);
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

  const handleRetryConnection = () => {
    setDbError(null);
    setRetryKey(prev => prev + 1);
  };

  // --- Render ---

  if (isAuthLoading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <span className="text-4xl mb-4">💸</span>
                <p className="text-slate-400">Carregando...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💸</span>
                    <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:inline">Baguncinha Salarial</span>
                    <span className="font-bold text-lg tracking-tight text-slate-800 sm:hidden">Baguncinha</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    {dbError ? (
                       <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 animate-pulse cursor-help" title="Erro de conexão.">
                          <CloudOff className="w-3 h-3" />
                       </div>
                    ) : (
                       <div className="hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-medium">Online</span>
                       </div>
                    )}

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Histórico"
                    >
                        <List className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={() => signOut()}
                        className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
        
        {/* Error Banner */}
        {dbError && (
          <div className="bg-amber-600 text-white p-4 text-sm font-medium shadow-lg animate-in slide-in-from-top-2">
             <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-3 text-amber-100 uppercase tracking-wider text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    {dbError === 'api_not_ready' ? 'Aguardando Ativação do Google' : 'Conexão com Banco de Dados'}
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    {dbError === 'api_not_ready' ? (
                        <>
                            <p className="mb-2 font-semibold text-lg">Seu banco de dados foi criado, mas o Google ainda está liberando o acesso.</p>
                            <p className="text-amber-50 mb-4">Isso é normal e pode levar até 5 minutos. Aguarde um pouco e clique em tentar novamente.</p>
                        </>
                    ) : (
                        <>
                            <p className="mb-2 font-semibold text-lg">Não foi possível conectar ao banco de dados.</p>
                            <p className="text-amber-50 mb-4">Verifique se você criou o "Firestore Database" no modo de teste no console do Firebase.</p>
                            <div className="mb-4">
                                <a href="https://console.firebase.google.com/project/baguncinhasalarial/firestore" target="_blank" rel="noopener noreferrer" className="underline hover:text-white font-bold inline-flex items-center gap-1">
                                    Abrir Console do Firebase <ExternalLink className="w-3 h-3"/>
                                </a>
                            </div>
                        </>
                    )}
                    
                    <button 
                        onClick={handleRetryConnection}
                        className="bg-white text-amber-700 py-2 px-4 rounded-lg font-bold hover:bg-amber-50 transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar Conectar Novamente
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-4">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                <div>
                    <p className="text-xs text-slate-500">Olá,</p>
                    <p className="text-sm font-bold text-slate-800 leading-none">{user.displayName || user.email}</p>
                </div>
            </div>

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
            onSave={handleUpdateSettings} 
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