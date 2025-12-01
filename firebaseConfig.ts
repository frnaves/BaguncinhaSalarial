import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- INSTRUÇÕES ---
// 1. Vá no console do Firebase (Configurações do Projeto > Geral > Role até o fim).
// 2. Selecione a opção "Config" (bolinha redonda).
// 3. Copie os valores e substitua abaixo (mantenha as aspas).

const firebaseConfig = {
  apiKey: "AIzaSyADA8PoFdQHt69qyxFxeydHL0MERZRcMdU",
  authDomain: "baguncinhasalarial.firebaseapp.com",
  projectId: "baguncinhasalarial",
  storageBucket: "baguncinhasalarial.firebasestorage.app",
  messagingSenderId: "436061402692",
  appId: "1:436061402692:web:5fae942d6e8583d16bae11",
  measurementId: "G-7Q71NHYLG4"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta serviços
export const db = getFirestore(app);
export const auth = getAuth(app);