import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface PassportData {
  full_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  expiry_date: string;
  gender: string;
  confidence_score: number;
}

export async function extractPassportData(base64Image: string): Promise<PassportData | null> {
  if (!genAI) {
    console.error("Gemini API key not found. Please check your .env file.");
    return null;
  }

  try {
    const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = base64Image.split(",")[1] || base64Image;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: "Perform OCR on this passport bio page and extract the following information in JSON format: Full Name, Passport Number, Nationality, Date of Birth, Expiry Date, Gender. Also provide a confidence score from 0-100. Ensure the dates are in YYYY-MM-DD format.",
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
            passport_number: { type: Type.STRING },
            nationality: { type: Type.STRING },
            date_of_birth: { type: Type.STRING },
            expiry_date: { type: Type.STRING },
            gender: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
          },
          required: ["full_name", "passport_number", "nationality", "date_of_birth", "expiry_date", "gender", "confidence_score"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty response text");
      return null;
    }
    return JSON.parse(text) as PassportData;
  } catch (error) {
    console.error("Error extracting passport data with Gemini:", error);
    return null;
  }
}

export interface AutomationInstructions {
  website: string;
  steps: string[];
  manual_steps: string[];
}

export async function generateAutomationInstructions(website: string): Promise<AutomationInstructions | null> {
  if (!genAI) return null;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate structured automation instructions for a Playwright bot to apply for a visa on ${website}. Include a list of automated steps and a list of manual intervention points (like OTP, CAPTCHA, etc.). Return in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            website: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            manual_steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["website", "steps", "manual_steps"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AutomationInstructions;
  } catch (error) {
    console.error("Error generating automation instructions:", error);
    return null;
  }
}
