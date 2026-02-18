import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Singleton to hold the chat session state
let chatSession: any = null;

export const sendChatMessage = async (message: string) => {
  const ai = getAI();
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are RescueBot, an intelligent assistant for the RescuePulse community response app. Your primary goal is to assist users with emergency preparedness, provide immediate (but provisional) first-aid guidance, and help them navigate the app. Always prioritize safety and advise calling professional emergency services (911/999) for critical situations. Be concise, calm, and supportive.",
      }
    });
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("ChatBot Error:", error);
    return "I'm having trouble connecting right now. Please check your internet connection or try again later.";
  }
};

export const getFirstAidAdvice = async (description: string, category: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide immediate, concise first-aid steps for a bystander responding to the following emergency:
      Category: ${category}
      Situation: ${description}
      
      Format the response as clear, numbered bullet points. Keep it professional and life-saving focused.`,
      config: {
        systemInstruction: "You are an emergency response medical dispatcher providing clear, concise, and accurate first-aid advice to non-professionals.",
        temperature: 0.3,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ensure the area is safe. Call professional emergency services immediately. Stay with the victim and keep them calm.";
  }
};

export const analyzeSituation = async (description: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this emergency description: "${description}". Categorize it and suggest priority level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "One of: Medical, Fire, Security, Mechanical, Other" },
            priority: { type: Type.STRING, description: "High, Medium, Low" },
            summary: { type: Type.STRING, description: "One sentence summary" }
          },
          required: ["category", "priority", "summary"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { category: 'Other', priority: 'Medium', summary: description };
  }
};

export const findNearbyPlaces = async (lat: number, lng: number, query: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Required for Google Maps Grounding
      contents: `Find ${query} near these coordinates: ${lat}, ${lng}. Return a list of the top 3 closest locations.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    // The SDK returns grounding metadata in the candidates
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract map URIs and titles
    // Note: The actual text response will contain the natural language answer, 
    // but we can look at the text or just return the text which usually contains the list.
    return response.text;
  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return "Unable to retrieve nearby locations at this time. Please use a local map app.";
  }
};