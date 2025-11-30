import React from 'react';
import { CategoryType, CategorySettings } from './types';
import { 
  Home, 
  Coffee, 
  Target, 
  Smile, 
  TrendingUp, 
  BookOpen 
} from 'lucide-react';

export const DEFAULT_SETTINGS: CategorySettings = {
  [CategoryType.FIXED]: 40,
  [CategoryType.COMFORT]: 10,
  [CategoryType.GOALS]: 10,
  [CategoryType.PLEASURES]: 10,
  [CategoryType.FREEDOM]: 25,
  [CategoryType.KNOWLEDGE]: 5,
};

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Custos Fixos',
  [CategoryType.COMFORT]: 'Conforto',
  [CategoryType.GOALS]: 'Metas',
  [CategoryType.PLEASURES]: 'Prazeres',
  [CategoryType.FREEDOM]: 'Liberdade Financeira',
  [CategoryType.KNOWLEDGE]: 'Conhecimento',
};

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: '#3b82f6', // Blue
  [CategoryType.COMFORT]: '#a855f7', // Purple
  [CategoryType.GOALS]: '#f59e0b', // Amber
  [CategoryType.PLEASURES]: '#ec4899', // Pink
  [CategoryType.FREEDOM]: '#10b981', // Emerald
  [CategoryType.KNOWLEDGE]: '#06b6d4', // Cyan
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Contas essenciais: aluguel, luz, mercado, saúde.',
  [CategoryType.COMFORT]: 'Qualidade de vida: Uber, serviços extras.',
  [CategoryType.GOALS]: 'Presentes, viagens, reservas de curto prazo.',
  [CategoryType.PLEASURES]: 'Lazer: iFood, cinema, streaming.',
  [CategoryType.FREEDOM]: 'Investimentos, aposentadoria, emergência.',
  [CategoryType.KNOWLEDGE]: 'Cursos, livros, educação.',
};

export const getCategoryIcon = (category: CategoryType, className: string = "w-5 h-5") => {
  switch (category) {
    case CategoryType.FIXED: return <Home className={className} />;
    case CategoryType.COMFORT: return <Coffee className={className} />;
    case CategoryType.GOALS: return <Target className={className} />;
    case CategoryType.PLEASURES: return <Smile className={className} />;
    case CategoryType.FREEDOM: return <TrendingUp className={className} />;
    case CategoryType.KNOWLEDGE: return <BookOpen className={className} />;
    default: return <Home className={className} />;
  }
};