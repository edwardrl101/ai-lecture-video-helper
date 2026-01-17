import type { Transcription, TranscriptionInput } from '../interfaces/transcription.interface.js';
import { transcribeAudio } from './openai.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// import { PassThrough } from 'stream';
const videoUrl: string = 'https://s-cloudfront.cdn.ap.panopto.com/sessions/c2405e48-0c2e-469e-a67f-b3ca00db4a0e/e14faa86-2c3f-4dff-953a-b3ca00db4a18-b5830cf8-3068-4665-89c2-b3d0006027d9.hls/310791/fragmented.mp4';
const outputFileName: string = 'output.opus';



// Check if the path exists and tell fluent-ffmpeg where it is
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    throw new Error("FFmpeg binary path could not be resolved.");
}
if (ffprobeStatic) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
} else {
    throw new Error("FFprobe binary path could not be resolved.");
}

export const createTranscriptionService = async (data: TranscriptionInput): Promise<any> => {
    await convertToAudio(data.url, outputFileName);
    const transcription = await transcribeAudio(outputFileName);
    return transcription;
};
const convertToAudio = async (videoUrl: string, outputFileName: string) => {
    const metadata: any = await new Promise((resolve, reject) => {
        ffmpeg(videoUrl).ffprobe((err: any, data: any) => {
            if (err) reject(err);
            else resolve(data);
        });
    });

    const totalDuration = metadata.format.duration;
    console.log(`Video duration: ${totalDuration} seconds`);
    await processInParallel(totalDuration, 900);
}


async function processInParallel(totalDuration: number, segmentDuration: number) {
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
        .mergeToFile('final_output.mp3', './temp_dir/');
}