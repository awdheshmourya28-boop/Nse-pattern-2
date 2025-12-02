import { GoogleGenAI } from "@google/genai";
import { StockData } from "../types";

// This prompt design follows the user's request for a "ready-to-use prompt for batch inference"
// adapted for the live interactive component.
const generateAnalysisPrompt = (stock: StockData): string => {
  // Summarize backtest data for the prompt
  const occurrences = stock.pastOccurrences || [];
  const wins = occurrences.filter(o => o.outcomePercent > 0).length;
  const total = occurrences.length;
  const backtestSummary = total > 0 
    ? `Analyzed ${total} historical instances of ${stock.pattern}. Win rate: ${Math.round((wins/total)*100)}%. Recent outcomes: ${occurrences.slice(0, 3).map(o => `${o.outcomePercent}%`).join(', ')}.`
    : "No sufficient historical data for this pattern.";

  return `
    You are a senior quantitative technical analyst at a top-tier hedge fund. 
    Analyze the following technical setup for ${stock.name} (${stock.symbol}).

    **Technical Data:**
    - Current Price: ₹${stock.price}
    - Identified Pattern: ${stock.pattern}
    - Pattern Confidence: ${stock.confidenceScore}%
    - Historical Accuracy: ${stock.historicalAccuracy}% (${backtestSummary})
    - Algo-Predicted Move: ${stock.expectedMove}%
    - Volatility Score: ${stock.volatilityScore}/100

    **Instruction:**
    Provide a concise, professional trading assessment in JSON format.
    The response must strictly adhere to this schema:
    {
      "verdict": "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell",
      "summary": "2-3 sentences explaining the setup context.",
      "keyLevels": {
        "support": "Price level",
        "resistance": "Price level",
        "invalidation": "Stop loss level"
      },
      "riskAssessment": "Comment on volatility and position sizing recommendation."
    }
  `;
};

export const fetchAIAnalysis = async (stock: StockData) => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: generateAnalysisPrompt(stock),
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for consistent, analytical output
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};