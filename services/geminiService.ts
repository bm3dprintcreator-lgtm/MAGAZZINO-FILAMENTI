
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestSettings = async (material: string, brand: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest optimal 3D printing settings for ${brand} ${material} filament.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nozzleTemp: { type: Type.NUMBER, description: "Suggested nozzle temperature in Celsius" },
            bedTemp: { type: Type.NUMBER, description: "Suggested bed temperature in Celsius" },
            flowRate: { type: Type.NUMBER, description: "Suggested flow rate (usually 0.9 to 1.05)" },
            pressureAdvance: { type: Type.NUMBER, description: "Suggested starting pressure advance value" },
            tips: { type: Type.STRING, description: "One short tip for this material" }
          },
          required: ["nozzleTemp", "bedTemp", "flowRate", "pressureAdvance", "tips"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Error suggesting settings:", error);
    return null;
  }
};
