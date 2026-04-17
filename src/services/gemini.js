import { GoogleGenerativeAI } from "@google/generative-ai";

// El usuario debe configurar su API KEY en un archivo .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTIONS = `
Eras "NOVA", un sistema de diagnóstico experto en micro-soldadura y reparación de hardware de teléfonos móviles para CLServicell PRO.
Tu objetivo es ayudar al técnico proporcionando diagnósticos precisos basados en consumos eléctricos (amperaje), caídas de tensión y protocolos de comunicación (I2C, SPI, MIPI).

REGLAS:
1. Analiza siempre los consumos mencionados (mA).
2. Si el usuario menciona un consumo estático, sospecha de buses de datos bloqueados o PMIC.
3. Si menciona consumo bajo (menos de 80mA), revisa señales de encendido y cristales osciladores.
4. Si menciona consumo alto, sugiere inyección de tensión y búsqueda de calor.
5. Usa terminología técnica: VDD_MAIN, VCC_MAIN, LDO, Buck, Tristar, Hydra, etc.
6. Mantén tus respuestas técnicas, concisas y de nivel profesional.
7. Si el usuario te pasa contexto de reparaciones previas, úsalo para enriquecer el diagnóstico.
`;

export async function getGeminiResponse(userPrompt, history = []) {
  if (!API_KEY) {
    return {
      text: "ERROR: API Key no configurada. Por favor, añade VITE_GEMINI_API_KEY a tu archivo .env",
      steps: ["Error de configuración"]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTIONS 
    });

    // La API de Gemini requiere que el primer mensaje sea del usuario.
    // Filtramos la historia para que comience con el primer mensaje del usuario.
    const formattedHistory = history
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    const firstUserIndex = formattedHistory.findIndex(msg => msg.role === 'user');
    const validHistory = firstUserIndex !== -1 ? formattedHistory.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: validHistory,
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Intentar extraer "pasos lógicos" si la IA los da en formato lista
    const steps = text.match(/^\s*[-\*+]\s+(.+)$/gm) || ["Análisis de hardware", "Razonamiento lógico"];

    return {
      text: text,
      steps: steps.map(s => s.replace(/^[-\*+]\s+/, ""))
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "Error en la conexión con la red neuronal: " + error.message,
      steps: ["Revisar conexión API", "Verificar cuotas"]
    };
  }
}
