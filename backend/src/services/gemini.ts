import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

interface Caption {
    text: string;
    start?: number;
    end?: number;
}

interface Summary {
    id: string;
    title: string;
    timestamp: string;
    summary: string;
    details: string[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const SYSTEM_PROMPT = `You are an expert lecture summarizer. Given lecture captions/transcript, identify the key topics discussed and create structured summaries.

For each major topic, provide:
- A clear, concise title
- An approximate timestamp (based on position in transcript)
- A 1-2 sentence summary
- 3-5 key bullet points

Respond ONLY with valid JSON in this exact format:
{
  "summaries": [
    {
      "id": "1",
      "title": "Topic Title",
      "timestamp": "MM:SS",
      "summary": "Brief summary of this topic.",
      "details": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}`;

export async function generateLectureSummary(captions: Caption[]): Promise<Summary[]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Use v1beta for advanced features like responseMimeType
    const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" },
        { apiVersion: "v1beta" }
    );

    // Combine captions into a single transcript
    const transcript = captions.map(c => c.text).join(' ');

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\nLecture Transcript:\n${transcript}` }]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const responseText = result.response.text();
    if (!responseText) {
        throw new Error('No response from Gemini');
    }

    try {
        const parsed = JSON.parse(responseText);
        return parsed.summaries;
    } catch (err) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Invalid JSON response from AI");
    }
}
