import { GoogleGenAI, Type } from "@google/genai";
import { CategoryType, GeminiParsedResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = () => {
  const now = new Date();
  const dateContext = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isoDate = now.toISOString().split('T')[0];

  return `
You are a smart financial assistant for a Brazilian user. 
Your goal is to extract transaction details from natural language input.

First, determine if the input is an **EXPENSE** (spending money) or **INCOME** (receiving money).

If **INCOME** (e.g., "Received salary", "Sold bike", "Extra money"):
- Type: 'INCOME'
- Category: null (ignore category)

If **EXPENSE** (e.g., "Paid rent", "Uber", "Burger"):
- Type: 'EXPENSE'
- Classify into one of these STRICT categories (No "Other" allowed. You must choose the best fit):
  - FIXED: Essential bills (rent, water, light, grocery, health, pets).
  - COMFORT: Quality of life upgrades (Uber, cleaning service, non-essential comfort).
  - GOALS: Saving for trips, buying gifts, short-term goals.
  - PLEASURES: Fun, iFood/delivery, cinema, streaming services, parties.
  - FREEDOM: Investments, stocks, emergency fund.
  - KNOWLEDGE: Courses, books, school, education.

Context:
- Current Date: ${dateContext}
- ISO Date Reference: ${isoDate}

Rules:
1. If the user mentions a specific date (e.g., "ontem", "dia 15"), parse it to ISO format YYYY-MM-DD. 
2. If no date is mentioned, use the ISO Date Reference (${isoDate}).
3. If the currency is not specified, assume BRL (R$). Return only the number.
4. Translate the description to a clean, short title in Portuguese.
`;
};

export const parseTransactionInput = async (
  textInput?: string,
  audioBase64?: string,
  mimeType?: string
): Promise<GeminiParsedResponse> => {
  try {
    const parts: any[] = [];
    
    // Prioritize Audio, then Text
    if (audioBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      });
      parts.push({ text: "Analise este áudio e extraia a transação." });
    } else if (textInput && textInput.trim().length > 0) {
      parts.push({ text: textInput });
    } else {
      throw new Error("No valid input provided (empty text or missing audio).");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: getSystemInstruction(),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { 
              type: Type.STRING, 
              enum: [
                CategoryType.FIXED, 
                CategoryType.COMFORT, 
                CategoryType.GOALS, 
                CategoryType.PLEASURES, 
                CategoryType.FREEDOM, 
                CategoryType.KNOWLEDGE
              ],
              nullable: true
            },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" }
          },
          required: ["type", "description", "amount"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const parsed = JSON.parse(response.text) as GeminiParsedResponse;
    
    // Fallback if date is missing
    if (!parsed.date) {
        parsed.date = new Date().toISOString().split('T')[0];
    }

    // Ensure category is present if Expense, fallback to FIXED if model fails to strictly categorize
    if (parsed.type === 'EXPENSE' && !parsed.category) {
        parsed.category = CategoryType.FIXED; 
    }

    return parsed;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};