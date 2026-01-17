import OpenAI from "openai";
import fs from "fs";
import 'dotenv/config';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(filePath: string) {
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
    });

    // Check if segments exists and is an array
    if (!transcription.segments) {
        console.error("No segments found in Whisper response. Check your response_format.");
        return [];
    }
    // Extract only the fields necessary for summarization and navigation
    return transcription.segments.map((segment: any) => ({
        start: Math.floor(segment.start), // Round for cleaner UI timestamps
        end: Math.ceil(segment.end),
        text: segment.text.trim(),
    }));
}