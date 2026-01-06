import { GoogleGenAI, Type } from "@google/genai";

/**
 * Suggerisce le impostazioni di stampa. 
 * Se la chiave API non è presente, restituisce un errore gestito invece di far crashare l'app.
 */
export const suggestSettings = async (material: string, brand: string) => {
  const apiKey = process.env.API_KEY;
  
  // Se la chiave è mancante o è una stringa vuota/placeholder, usciamo subito senza errori fatali
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "" || apiKey.includes("YOUR_")) {
    console.warn("AI inattiva: API_KEY non trovata nelle variabili d'ambiente.");
    return { error: "API_KEY_MISSING" };
  }

  try {
    // Inizializziamo solo se abbiamo una chiave plausibile
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest optimal 3D printing settings for ${brand} ${material} filament.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nozzleTemp: { type: Type.NUMBER, description: "Suggested nozzle temperature" },
            bedTemp: { type: Type.NUMBER, description: "Suggested bed temperature" },
            flowRate: { type: Type.NUMBER, description: "Suggested flow rate" },
            pressureAdvance: { type: Type.NUMBER, description: "Suggested pressure advance" },
            tips: { type: Type.STRING, description: "Short tip" }
          },
          required: ["nozzleTemp", "bedTemp", "flowRate", "pressureAdvance", "tips"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Errore chiamata AI:", error);
    return null;
  }
};