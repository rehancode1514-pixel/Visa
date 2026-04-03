import { GoogleGenAI, Type } from "@google/genai";
import Tesseract from "tesseract.js";
import { UserProfile, VisaOpportunity, AutomationInstruction } from "../types";

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

async function extractWithTesseractFallback(base64Image: string): Promise<PassportData | null> {
  try {
    console.log("Attempting local OCR with Tesseract.js fallback...");
    const { data: { text } } = await Tesseract.recognize(base64Image, 'eng');
    
    // Attempt basic MRZ matching from text output
    // Looking for a P< string and the next line
    const lines = text.split('\n').map(l => l.replace(/\s+/g, '').replace(/«|《/g, '<'));
    const mrzLine1 = lines.find(l => l.startsWith('P<') || (l.startsWith('P') && l.includes('<') && l.length > 20));
    const mrzLine2Index = lines.indexOf(mrzLine1 as string) + 1;
    let mrzLine2 = lines[mrzLine2Index] || '';

    if (!mrzLine1 || mrzLine1.length < 20) {
      console.warn("Could not find clear MRZ in image. Tesseract raw text:", text);
      return null;
    }

    const namesPart = mrzLine1.substring(5).split('<<');
    const surname = namesPart[0].replace(/</g, ' ').trim();
    const givenNames = (namesPart[1] || '').replace(/</g, ' ').trim();
    const fullName = `${givenNames} ${surname}`.trim();

    // Approximate MRZ Line 2 parsing
    // It should have ~44 chars. Let's gracefully extract what we can.
    mrzLine2 = mrzLine2.padEnd(44, '<');
    const passportNumber = mrzLine2.substring(0, 9).replace(/</g, '');
    const nationality = mrzLine2.substring(10, 13).replace(/</g, '');
    
    let dobYY = mrzLine2.substring(13, 15).replace(/[OQ]/g, '0').replace(/I/g, '1');
    let dobMM = mrzLine2.substring(15, 17).replace(/[OQ]/g, '0').replace(/I/g, '1');
    let dobDD = mrzLine2.substring(17, 19).replace(/[OQ]/g, '0').replace(/I/g, '1');
    
    let dateOfBirth = "";
    if (!isNaN(parseInt(dobMM)) && parseInt(dobMM) <= 12 && parseInt(dobMM) > 0 && !isNaN(parseInt(dobDD)) && parseInt(dobDD) <= 31 && parseInt(dobDD) > 0) {
      const yearPrefix = parseInt(dobYY) > 30 ? '19' : '20';
      const potentialDate = `${yearPrefix}${dobYY}-${dobMM}-${dobDD}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(potentialDate)) {
        dateOfBirth = potentialDate;
      }
    }

    const genderCode = mrzLine2.substring(20, 21);
    const gender = genderCode === 'M' ? 'Male' : genderCode === 'F' ? 'Female' : 'M';

    let expYY = mrzLine2.substring(21, 23).replace(/[OQ]/g, '0').replace(/I/g, '1');
    let expMM = mrzLine2.substring(23, 25).replace(/[OQ]/g, '0').replace(/I/g, '1');
    let expDD = mrzLine2.substring(25, 27).replace(/[OQ]/g, '0').replace(/I/g, '1');
    
    let expiryDate = "";
    if (!isNaN(parseInt(expMM)) && parseInt(expMM) <= 12 && parseInt(expMM) > 0 && !isNaN(parseInt(expDD)) && parseInt(expDD) <= 31 && parseInt(expDD) > 0) {
      const potentialExpiry = `20${expYY}-${expMM}-${expDD}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(potentialExpiry)) {
        expiryDate = potentialExpiry;
      }
    }

    return {
      full_name: fullName || "Auto Extracted",
      passport_number: passportNumber || "XX0000000",
      nationality: nationality || "UNK",
      date_of_birth: dateOfBirth,
      expiry_date: expiryDate,
      gender: gender,
      confidence_score: 75
    };
  } catch (fallbackError) {
    console.error("Tesseract local OCR fallback also failed:", fallbackError);
    return null;
  }
}

export async function extractPassportData(base64Image: string): Promise<PassportData | null> {
  if (!genAI) {
    console.error("Gemini API key not found. Evaluating with Tesseract...");
    return extractWithTesseractFallback(base64Image);
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
      return extractWithTesseractFallback(base64Image);
    }
    return JSON.parse(text) as PassportData;
  } catch (error: any) {
    console.error("Error extracting passport data with Gemini:", error);
    if (error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('Quota')) {
        return extractWithTesseractFallback(base64Image);
    }
    return null;
  }
}

export async function generateVisaRecommendations(profile: UserProfile): Promise<VisaOpportunity[]> {
  if (!genAI) return [];

  // System prompt to ensure we always find something for the user
  const systemPrompt = `You are an expert Global Visa Discovery Engine. 
    Analyze the user profile and identify 5-10 visa opportunities.
    For an ${profile.nationality} citizen interested in ${profile.purpose}, research specific bilateral agreements, e-visas, and residence permits.
    Even if the passport is weak, find relevant "Digital Nomad" visas, "Study" visas, or "Investment" visas that might be applicable.
    Ensure at least one "Easy" or "Moderate" option if possible, but be realistic.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${systemPrompt}
    
    User Profile:
    Full Name: ${profile.fullName}
    Nationality: ${profile.nationality}
    Current Purpose: ${profile.purpose}
    Estimated Savings: ${profile.financialProofRange}
    Travel History: ${profile.travelHistory.join(', ')}
    Preferred Countries: ${profile.preferredCountries.join(', ')}

    For each opportunity, provide: 
    - country
    - visaType (e.g. Tourist e-Visa, D-Type Work, Digital Nomad)
    - category (Easy, Moderate, Hard)
    - eligibilityScore (0-100)
    - successProbability (0-100)
    - vfsProcessed (boolean)
    - vfsPortalLink (if applicable)
    - requiredForms (array of strings)
    - description (detailed, 2-3 sentences)

    Always return at least 3-5 results. JSON format only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              country: { type: Type.STRING },
              visaType: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["Easy", "Moderate", "Hard"] },
              eligibilityScore: { type: Type.NUMBER },
              successProbability: { type: Type.NUMBER },
              vfsProcessed: { type: Type.BOOLEAN },
              vfsPortalLink: { type: Type.STRING },
              requiredForms: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
            },
            required: ["id", "country", "visaType", "category", "eligibilityScore", "successProbability", "vfsProcessed", "description"],
          }
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    let results = JSON.parse(text) as VisaOpportunity[];
    // Ensure IDs are unique if Gemini misses it
    return results.map((r, i) => ({ ...r, id: r.id || `visa-${i}-${Date.now()}` }));
  } catch (error) {
    console.error("Error generating visa recommendations:", error);
    return [];
  }
}


export async function generateSOP(profile: UserProfile, country: string): Promise<string> {
  if (!genAI) return "";

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a professional Statement of Purpose (SOP) for a ${profile.purpose} visa application for ${country}.
    Applicant: ${profile.fullName}
    Nationality: ${profile.nationality}
    Background: ${profile.travelHistory.join(', ')}
    Financial Proof: ${profile.financialProofRange}
    
    The SOP should be highly professional, persuasive, and structured (Introduction, Purpose of Visit, Travel History, Financial Standing, Ties to Home Country, Conclusion).`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating SOP:", error);
    return "";
  }
}

export async function generateAutomationInstructions(website: string): Promise<AutomationInstruction | null> {
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
    return JSON.parse(text) as AutomationInstruction;
  } catch (error) {
    console.error("Error generating automation instructions:", error);
    return null;
  }
}
