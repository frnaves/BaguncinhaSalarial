import React from 'react';
import { Transaction, Income, CategorySettings, CategoryType } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, getCategoryIcon, CATEGORY_DESCRIPTIONS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Edit3, Calendar, BarChart3 } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  income: Income;
  settings: CategorySettings;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onOpenIncomeSettings: () => void;
  onOpenPercentageSettings: () => void;
  onCategoryClick: (category: CategoryType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  income, 
  settings, 
  currentDate,
  onDateChange,
  onOpenIncomeSettings,
  onOpenPercentageSettings,
  onCategoryClick
}) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Format for input type="month" (YYYY-MM)
  const monthInputValue = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month] = e.target.value.split('-').map(Number);
    // Create date strictly based on selected year/month, setting day to 15 to avoid timezone edge cases jumping months
    const newDate = new Date(year, month - 1, 15);
    onDateChange(newDate);
  };

  // Filter transactions for selected month
  const monthlyTransactions = transactions.filter(t => {
    const [y, m] = t.date.split('-').map(Number);
    return m - 1 === currentMonth && y === currentYear;
  });

  const totalIncome = income.salary + income.advance + income.extras;
  const totalExpenses = monthlyTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = totalIncome - totalExpenses;

  // Calculate stats per category
  // IMPORTANT: We filter Object.values to only get string keys, not reverse mapping numbers if enum was numeric (it's string enum so safe)
  const categories = Object.values(CategoryType);
  
  const stats = categories.map(cat => {
    const limitPercentage = settings[cat];
    const limitAmount = (totalIncome * limitPercentage) / 100;
    const spent = monthlyTransactions.filter(t => t.category === cat).reduce((acc, curr) => acc + curr.amount, 0);
    const percentUsed = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;
    
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      limitAmount,
      spent,
      percentUsed,
      color: CATEGORY_COLORS[cat]
    };
  });

  // PREPARE CHART DATA: Total Income based
  // 1. Add categories with spending
  const pieData = stats.filter(s => s.spent > 0).map(s => ({
    name: s.label,
    value: s.spent,
    color: s.color,
    isRemaining: false
  }));

  // 2. Add Remaining Balance (if positive) to represent the "rest" of the income pie
  if (remaining > 0) {
      pieData.push({
          name: "Saldo Restante",
          value: remaining,
          color: "#e2e8f0", // slate-200, neutral color
          isRemaining: true
      });
  }

  // PREPARE WEEKLY DATA
  const initialCategoryValues = categories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<string, number>);

  const weeklyData = [
    { name: 'Sem 1', fullLabel: 'Semana 1 (1-7)', total: 0, ...initialCategoryValues },
    { name: 'Sem 2', fullLabel: 'Semana 2 (8-14)', total: 0, ...initialCategoryValues },
    { name: 'Sem 3', fullLabel: 'Semana 3 (15-21)', total: 0, ...initialCategoryValues },
    { name: 'Sem 4+', fullLabel: 'Semana 4+ (22-Fim)', total: 0, ...initialCategoryValues },
  ];

  monthlyTransactions.forEach(t => {
    const day = parseInt(t.date.split('-')[2]);
    let index = 3;
    if (day <= 7) index = 0;
    else if (day <= 14) index = 1;
    else if (day <= 21) index = 2;

    weeklyData[index].total += t.amount;
    const cat = t.category as string;
    // @ts-ignore
    if (weeklyData[index][cat] !== undefined) {
         // @ts-ignore
        weeklyData[index][cat] += t.amount;
    }
  });

  const averageWeekly = totalExpenses / 4;
  const highestWeek = [...weeklyData].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="space-y-6 pb-24">
      
      {/* Date Navigation */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold capitalize">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
         </div>
         <input 
            type="month" 
            value={monthInputValue}
            onChange={handleMonthChange}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-600"
         />
      </div>

      {/* Header / Summary Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <PieChart width={200} height={200}>
             <Pie data={[{value: 100}]} cx="50%" cy="50%" outerRadius={80} fill="#fff" />
          </PieChart>
        </div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-slate-300 text-sm font-medium mb-1">Saldo Disponível</h2>
                    <p className="text-4xl font-bold tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
                    </p>
                </div>
                <button onClick={onOpenIncomeSettings} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-sm transition-colors">
                    <Edit3 className="w-5 h-5 text-indigo-200" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-indigo-200 mb-1">Receitas</p>
                    <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-red-200 mb-1">Despesas</p>
                    <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
            <div 
                key={stat.category} 
                onClick={() => onCategoryClick(stat.category)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
                title="Clique para ver histórico"
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                             {getCategoryIcon(stat.category)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{stat.label}</h3>
                            <p className="text-xs text-slate-500">{CATEGORY_DESCRIPTIONS[stat.category].split(':')[0]}</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {settings[stat.category]}%
                    </span>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.spent)}
                        </span>
                        <span className="font-medium text-slate-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.limitAmount)}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ 
                                width: `${Math.min(stat.percentUsed, 100)}%`,
                                backgroundColor: stat.percentUsed > 100 ? '#ef4444' : stat.color 
                            }} 
                        />
                    </div>
                    {stat.percentUsed > 100 && (
                        <p className="text-xs text-red-500 mt-2 font-medium">Limite excedido!</p>
                    )}
                </div>
            </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <button onClick={onOpenPercentageSettings} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
            Ajustar Porcentagens dos Potes
        </button>
      </div>

      {/* Analytics Section */}
      {(totalExpenses > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weekly Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800">Análise Semanal</h3>
                </div>

                <div className="h-64 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                formatter={(value: number) => value > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : ''}
                                labelStyle={{color: '#1e293b', fontWeight: 'bold'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                            {categories.map((cat) => (
                                <Bar 
                                    key={cat} 
                                    dataKey={cat} 
                                    name={CATEGORY_LABELS[cat]} 
                                    stackId="a" 
                                    fill={CATEGORY_COLORS[cat]} 
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Média Semanal</p>
                        <p className="font-semibold text-slate-800">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageWeekly)}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Pico de Gasto</p>
                        <div className="flex flex-col">
                             <span className="font-semibold text-slate-800">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(highestWeek.total)}
                             </span>
                             <span className="text-[10px] text-slate-400">{highestWeek.fullLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Composition */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Composição da Renda</h3>
                <p className="text-sm text-slate-500 mb-6">Gastos vs. Saldo Disponível</p>
                
                <div className="flex-1 min-h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Restante</span>
                        <span className={`text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {totalIncome > 0 ? Math.floor((remaining / totalIncome) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;