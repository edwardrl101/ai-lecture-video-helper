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

    return transcription.segments;
}