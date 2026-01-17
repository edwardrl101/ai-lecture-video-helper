import type { TranscriptionInput } from '../interfaces/transcription.interface.js';
import { transcribeAudio } from './openai.js';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Absolute paths for robustness
const ROOT_DIR = process.cwd();
const TEMP_DIR = path.resolve(ROOT_DIR, 'temp_audio');
const SOURCE_AUDIO = path.resolve(TEMP_DIR, 'source_audio.mp3');

// Configure FFmpeg paths
if (process.env.NODE_ENV === 'production') {
    // In production (Docker), we prefer the system-installed ffmpeg
    console.log("Using system ffmpeg in production");
} else if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    console.warn("ffmpeg-static path could not be resolved, falling back to system ffmpeg.");
}

if (ffprobeStatic && ffprobeStatic.path) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
} else {
    console.warn("ffprobe-static path could not be resolved, falling back to system ffprobe.");
}

export const createTranscriptionService = async (data: TranscriptionInput): Promise<any> => {
    // 1. Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    try {
        console.log(`🚀 Starting Turbo Transcription for: ${data.url}`);

        // 2. Optimized Audio Extraction (Turbo Mode)
        // Convert to 16kHz Mono immediately. High-quality stereo is a waste.
        await extractSourceAudio(data.url, SOURCE_AUDIO);

        const duration = data.duration;
        const SEGMENT_DURATION = 600; // 10 minutes (600s)
        const segmentFiles: { path: string; start: number }[] = [];

        // 3. Sequential Slicing (Fast & Robust)
        console.log("✂️ Slicing audio into segments...");
        for (let start = 0; start < duration; start += SEGMENT_DURATION) {
            const segmentPath = path.resolve(TEMP_DIR, `segment_${start}.mp3`);
            await sliceAudio(SOURCE_AUDIO, start, SEGMENT_DURATION, segmentPath);
            segmentFiles.push({ path: segmentPath, start });
        }

        // 4. Parallel Transcription (The "Fan-Out")
        console.log(`🎙️ Sending ${segmentFiles.length} segments to Whisper in parallel...`);
        const transcriptionPromises = segmentFiles.map(async (file) => {
            const segments = await transcribeAudio(file.path);
            // Offset timestamps
            return segments.map((s: any) => ({
                ...s,
                start: s.start + file.start,
                end: s.end + file.start
            }));
        });

        const results = await Promise.allSettled(transcriptionPromises);

        const allSegments: any[] = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allSegments.push(...result.value);
            } else {
                console.error(`❌ Segment ${index} failed:`, result.reason);
            }
        });

        // 5. Final Stitching & Cleanup
        allSegments.sort((a, b) => a.start - b.start);

        console.log("✅ Transcription complete!");
        return allSegments;

    } catch (error) {
        console.error("Transcription service error:", error);
        throw error;
    } finally {
        // Cleanup all temp files
        cleanupDir(TEMP_DIR);
    }
};

const extractSourceAudio = (url: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(url)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate('64k')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('start', (cmd: string) => console.log('FFmpeg Extraction Command:', cmd))
            .on('error', (err: any) => reject(err))
            .on('end', () => resolve())
            .save(outputPath);
    });
};

const sliceAudio = (inputPath: string, start: number, duration: number, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Use -ss before -i for fast seeking, and -c copy for no re-encoding
        ffmpeg()
            .input(inputPath)
            .setStartTime(start)
            .setDuration(duration)
            .outputOptions('-c copy') // Fast slicing without re-encoding
            .on('error', (err: any) => reject(err))
            .on('end', () => resolve())
            .save(outputPath);
    });
};

const cleanupDir = (dirPath: string) => {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            fs.unlinkSync(path.join(dirPath, file));
        }
    }
};