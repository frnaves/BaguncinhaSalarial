import { db } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  query, 
} from "firebase/firestore";
import { Transaction, Income, CategorySettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

// --- Initialization ---

export const initializeUserData = async (userId: string) => {
  if (!userId) return;
  
  // Check if user has settings configured. If not, it's likely a first access.
  const settingsRef = doc(db, "users", userId, "config", "categories");
  const settingsSnap = await getDoc(settingsRef);

  if (!settingsSnap.exists()) {
    // Save default settings to DB
    await setDoc(settingsRef, DEFAULT_SETTINGS);
  }
};

// --- Transactions ---

export const subscribeToTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void,
  onError?: (error: any) => void
) => {
  if (!userId) return () => {};

  const q = query(collection(db, "users", userId, "transactions"));
  
  return onSnapshot(q, 
    (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Transaction);
      });
      callback(data);
    },
    (error) => {
      console.error("Erro no listener de transações:", error);
      if (onError) onError(error);
    }
  );
};

export const saveTransactionToDb = async (userId: string, transaction: Transaction) => {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId, "transactions", transaction.id);
    await setDoc(docRef, transaction);
  } catch (e) {
    console.error("Erro ao salvar transação: ", e);
    throw e;
  }
};

export const deleteTransactionFromDb = async (userId: string, id: string) => {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, "users", userId, "transactions", id));
  } catch (e) {
    console.error("Erro ao deletar transação: ", e);
    throw e;
  }
};

// --- Incomes ---

export const subscribeToIncomes = (
  userId: string, 
  callback: (incomes: Record<string, Income>) => void
) => {
  if (!userId) return () => {};

  const q = query(collection(db, "users", userId, "monthly_incomes"));
  
  return onSnapshot(q, (snapshot) => {
    const data: Record<string, Income> = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data() as Income;
    });
    callback(data);
  });
};

export const saveIncomeToDb = async (userId: string, monthKey: string, income: Income) => {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId, "monthly_incomes", monthKey);
    await setDoc(docRef, income);
  } catch (e) {
    console.error("Erro ao salvar renda: ", e);
  }
};

// --- Settings ---

export const subscribeToSettings = (
  userId: string, 
  callback: (settings: CategorySettings | null) => void
) => {
  if (!userId) return () => {};

  const docRef = doc(db, "users", userId, "config", "categories");
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as CategorySettings);
    } else {
      callback(null);
    }
  });
};

export const saveSettingsToDb = async (userId: string, settings: CategorySettings) => {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId, "config", "categories");
    await setDoc(docRef, settings);
  } catch (e) {
    console.error("Erro ao salvar configurações: ", e);
  }
};