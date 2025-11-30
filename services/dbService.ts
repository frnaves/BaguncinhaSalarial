import { db } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from "firebase/firestore";
import { Transaction, Income, CategorySettings } from "../types";

// Para simplificar e permitir uso imediato, usaremos um ID fixo de usuário.
// Futuramente, você pode implementar Login com Firebase Auth.
const USER_ID = "usuario_padrao";

// --- Transactions ---

export const subscribeToTransactions = (
  callback: (transactions: Transaction[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(collection(db, "users", USER_ID, "transactions"));
  
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

export const saveTransactionToDb = async (transaction: Transaction) => {
  try {
    const docRef = doc(db, "users", USER_ID, "transactions", transaction.id);
    await setDoc(docRef, transaction);
  } catch (e) {
    console.error("Erro ao salvar transação: ", e);
    throw e;
  }
};

export const deleteTransactionFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, "users", USER_ID, "transactions", id));
  } catch (e) {
    console.error("Erro ao deletar transação: ", e);
    throw e;
  }
};

// --- Incomes ---

export const subscribeToIncomes = (callback: (incomes: Record<string, Income>) => void) => {
  const q = query(collection(db, "users", USER_ID, "monthly_incomes"));
  
  return onSnapshot(q, (snapshot) => {
    const data: Record<string, Income> = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data() as Income;
    });
    callback(data);
  });
};

export const saveIncomeToDb = async (monthKey: string, income: Income) => {
  try {
    const docRef = doc(db, "users", USER_ID, "monthly_incomes", monthKey);
    await setDoc(docRef, income);
  } catch (e) {
    console.error("Erro ao salvar renda: ", e);
  }
};

// --- Settings ---

export const subscribeToSettings = (callback: (settings: CategorySettings | null) => void) => {
  const docRef = doc(db, "users", USER_ID, "config", "categories");
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as CategorySettings);
    } else {
      callback(null);
    }
  });
};

export const saveSettingsToDb = async (settings: CategorySettings) => {
  try {
    const docRef = doc(db, "users", USER_ID, "config", "categories");
    await setDoc(docRef, settings);
  } catch (e) {
    console.error("Erro ao salvar configurações: ", e);
  }
};