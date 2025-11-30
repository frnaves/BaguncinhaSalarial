export enum CategoryType {
  FIXED = 'FIXED',         // 40%
  COMFORT = 'COMFORT',     // 10%
  GOALS = 'GOALS',         // 10%
  PLEASURES = 'PLEASURES', // 10%
  FREEDOM = 'FREEDOM',     // 25%
  KNOWLEDGE = 'KNOWLEDGE', // 5%
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: CategoryType;
  date: string; // ISO String
  createdAt: number;
}

export interface Income {
  salary: number;
  advance: number;
  extras: number;
}

export interface CategorySettings {
  [CategoryType.FIXED]: number;
  [CategoryType.COMFORT]: number;
  [CategoryType.GOALS]: number;
  [CategoryType.PLEASURES]: number;
  [CategoryType.FREEDOM]: number;
  [CategoryType.KNOWLEDGE]: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface GeminiParsedResponse {
  type: TransactionType;
  description: string;
  amount: number;
  category?: CategoryType; // Optional because INCOME doesn't need it
  date?: string; 
}