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
    details: { point: string; timestamp: string }[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const SYSTEM_PROMPT = `You are an expert academic assistant specializing in lecture indexing. 
Your task is to transform a lecture transcript into a highly navigable, hierarchical JSON summary.
Make sure to summarize the full lecture until the end.

### INSTRUCTIONS:
1. IDENTIFY main topics and their specific sub-points, maximum 3-6 per topic.
2. TIMESTAMPS: 
   - Every Main Topic must have a 'timestamp'.
   - Every Detail bullet point MUST have its own specific 'timestamp' indicating exactly when that sub-topic begins.
3. STRUCTURE: Use a nested JSON format. Titles should be professional (e.g., "Introduction to SQL Constraints" instead of "SQL stuff").
4. SUMMARIES: Keep the top-level 'summary' to 1-2 insightful sentences.
5. ACCURACY: Ensure timestamps are chronologically increasing and exist within the transcript.

### OUTPUT FORMAT:
Respond ONLY with a JSON object following this strict schema:
{
  "summaries": [
    {
      "id": 1,
      "title": "string",
      "timestamp": "MM:SS",
      "summary": "string",
      "details": [
        { "point": "string", "timestamp": "MM:SS" }
      ]
    }
  ]
}`;

export async function generateLectureSummary(captions: Caption[], additionalPrompt?: string): Promise<Summary[]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Use v1beta for advanced features like responseMimeType
    const model = genAI.getGenerativeModel(
        {
            model: "gemini-2.5-flash",
            generationConfig: {
                maxOutputTokens: 8192, // Increase this significantly
                temperature: 0.1,      // Keep low for consistent JSON
            }
        },
        { apiVersion: "v1beta" }
    );

    // Combine captions into a single transcript
    const transcript = captions.map(c => c.text).join(' ');

    let fullUserPrompt = `${SYSTEM_PROMPT}\n\nLecture Transcript:\n${transcript}`;

    if (additionalPrompt) {
        fullUserPrompt += `\n\nADDITIONAL INSTRUCTION FROM USER:\n${additionalPrompt}`;
    }

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: fullUserPrompt }]
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
