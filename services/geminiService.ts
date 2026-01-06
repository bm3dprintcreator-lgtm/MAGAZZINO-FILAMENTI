import { GoogleGenAI, Type } from "@google/genai";

export const suggestSettings = async (material: string, brand: string) => {
  // Recupero della chiave
  const apiKey = process.env.API_KEY;
  
  // Se la chiave non è configurata correttamente, non procediamo nemmeno
  // Questo evita l'errore "An API Key must be set" che blocca l'app
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "" || apiKey.includes("YOUR_")) {
    console.warn("AI in pausa: Configura la API_KEY su Vercel per attivare i suggerimenti.");
    return { error: "API_KEY_MISSING" };
  }

  try {
    // Inizializziamo il client solo se abbiamo una chiave valida
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
    console.error("Errore durante la chiamata AI:", error);
    return null;
  }
};