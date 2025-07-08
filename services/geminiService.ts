
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash-preview-04-17';

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        // Fallback for ArrayBuffer
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        bytes.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        resolve(window.btoa(binary));
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}


export async function getSpeechAnalysis(file: File): Promise<AnalysisResult> {
  const audioPart = await fileToGenerativePart(file);

  const prompt = `
    You are an expert speech analyst AI. Analyze the provided audio file and return a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON object.
    The JSON object must have the following structure:
    {
      "transcript": "string",
      "summary": "string",
      "grammarAnalysis": [
        {
          "original": "string",
          "issue": "string",
          "suggestion": "string",
          "tip": "string"
        }
      ],
      "sentiment": {
        "label": "Positive | Negative | Neutral | Mixed",
        "explanation": "string"
      }
    }

    Instructions for each field:
    - transcript: Provide a full and accurate transcription of the audio.
    - summary: Provide a concise, one-paragraph summary of the transcript.
    - grammarAnalysis: Identify specific lines with grammatical errors, filler words (like 'um', 'ah', 'like'), or awkward phrasing. For each, provide the original text, describe the issue, suggest a correction, and offer a helpful tip for improving spoken English clarity or fluency. If there are no issues, return an empty array.
    - sentiment: Analyze the overall sentiment of the speech. The 'label' must be one of the specified options. Provide a brief 'explanation' for your choice.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                {text: prompt},
                audioPart,
            ],
        },
        config: {
            responseMimeType: "application/json",
            temperature: 0.2
        }
    });
    
    let jsonStr = response.text.trim();

    // Sanitize the response to ensure it's valid JSON
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as AnalysisResult;
    
    // Basic validation of the parsed structure
    if (!parsedData.transcript || !parsedData.summary || !Array.isArray(parsedData.grammarAnalysis) || !parsedData.sentiment) {
        throw new Error("API returned incomplete or malformed JSON data.");
    }
    
    return parsedData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}. Please check your API key and network connection.`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}
