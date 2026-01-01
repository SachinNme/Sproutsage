
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PlantCareInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const PLANT_CARE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING },
    scientificName: { type: Type.STRING },
    description: { type: Type.STRING },
    watering: { type: Type.STRING },
    light: { type: Type.STRING },
    soil: { type: Type.STRING },
    temperature: { type: Type.STRING },
    humidity: { type: Type.STRING },
    potentialProblems: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: [
    "commonName", "scientificName", "description", 
    "watering", "light", "soil", "temperature", 
    "humidity", "potentialProblems"
  ]
};

export const identifyPlant = async (base64Image: string): Promise<PlantCareInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: 'Identify this plant and provide comprehensive care details. Return exactly in the requested JSON format.',
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PLANT_CARE_SCHEMA,
      },
    });

    const resultText = response.text || '';
    return JSON.parse(resultText) as PlantCareInfo;
  } catch (error) {
    console.error('Plant identification failed:', error);
    throw new Error('Failed to identify plant. Please try a clearer photo.');
  }
};

export const createChat = () => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are SproutSage, a master gardener and botanist with 20 years of experience. You are friendly, encouraging, and deeply knowledgeable. Your mission is to provide expert, practical, and highly actionable gardening advice.

When users report issues, be specific and professional:
1. Pests: Identify common culprits (like aphids, spider mites, scale, or fungus gnats) and suggest organic/sustainable treatments (neem oil, insecticidal soap, beneficial insects, or companion planting).
2. Diseases: Recognize signs of fungal, bacterial, or viral infections (powdery mildew, leaf spot, blight, or root rot) and provide clear recovery steps (improved airflow, sterilization of tools, pruning, or soil treatment).
3. Nutrient Deficiencies: Diagnose deficiencies based on leaf patterns (yellowing/chlorosis, stunted growth, or necrosis) and recommend specific organic amendments or fertilizer adjustments.

Always emphasize sustainable, organic, and environmentally friendly practices. Keep your responses concise, organized (using bullet points for clarity), and maintain your persona as a wise, green-thumbed mentor. If the user asks something non-gardening related, politely steer them back to the world of plants.`,
    },
  });
};
