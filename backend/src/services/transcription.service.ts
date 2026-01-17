import type { Transcription, TranscriptionInput } from '../interfaces/transcription.interface.js';
import { transcribeAudio } from './openai.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// import { PassThrough } from 'stream';
// Output file used for temporary audio storage
const TEMP_OUTPUT_FILE = 'output.mp3';
const TEMP_DIR = './temp_dir';

// Check if the path exists and tell fluent-ffmpeg where it is
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    throw new Error("FFmpeg binary path could not be resolved.");
}

if (ffprobeStatic && ffprobeStatic.path) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
} else {
    console.warn("ffprobe-static path could not be resolved, falling back to system ffprobe.");
}


export const createTranscriptionService = async (data: TranscriptionInput): Promise<any> => {
    await convertToAudio(data.duration, data.url, TEMP_OUTPUT_FILE);
    // const transcription = await transcribeAudio(TEMP);
    // return transcription;
    return [];
};
const convertToAudio = async (duration: number, videoUrl: string, outputFileName: string) => {
    console.log(`Video duration: ${duration} seconds`);
    await processInParallel(videoUrl, duration, 900, outputFileName);
}


async function processInParallel(videoUrl: string, totalDuration: number, segmentDuration: number) {
    const tasks = [];

    // Step 1: Create separate conversion tasks for each segment
    for (let start = 0; start < totalDuration; start += segmentDuration) {
        tasks.push(new Promise((resolve, reject) => {
            const outputName = `temp_part_${start}.opus`;
            ffmpeg(videoUrl)
                .setStartTime(start)
                .setDuration(segmentDuration)
                .noVideo()
                .audioCodec('libopus')
                .audioBitrate('32k')
                .audioFrequency(16000)
                .audioChannels(1)
                .format('opus')
                .on('end', () => resolve(outputName))
                .on('error', reject)
                .save(outputName);
        }));
    }

    // Step 2: Run all conversions in parallel
    const tempFiles = await Promise.all(tasks);

    // Step 3: Combine all temp files into one final output
    const mergedCommand = ffmpeg();
    tempFiles.forEach(file => mergedCommand.input(file));

    mergedCommand
        .on('end', () => console.log('Final audio combined!'))
        .mergeToFile(TEMP_OUTPUT_FILE, TEMP_DIR);
}