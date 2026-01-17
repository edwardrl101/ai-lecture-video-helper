import type { Transcription, TranscriptionInput } from '../interfaces/transcription.interface.js';
import { transcribeAudio } from './openai.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');
import ffmpegStatic from 'ffmpeg-static';
// import { PassThrough } from 'stream';
const videoUrl: string = 'https://s-cloudfront.cdn.ap.panopto.com/sessions/6022add8-4a07-47c6-a3d7-b3c6008a6bd2/fd4adc57-aaed-404b-ae6c-b3c6008a6bda-6283352b-6ff7-4cba-a309-b3c6008dd0be.hls/785609/fragmented.mp4https://s-cloudfront.cdn.ap.panopto.com/sessions/6022add8-4a07-47c6-a3d7-b3c6008a6bd2/fd4adc57-aaed-404b-ae6c-b3c6008a6bda-6283352b-6ff7-4cba-a309-b3c6008dd0be.hls/785609/fragmented.mp4';
const outputFileName: string = 'output.mp3';

// Check if the path exists and tell fluent-ffmpeg where it is
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    throw new Error("FFmpeg binary path could not be resolved.");
}

export const createTranscriptionService = async (data: TranscriptionInput): Promise<any> => {
    await convertToAudio(data.url, outputFileName);
    const transcription = await transcribeAudio(outputFileName);
    return transcription;
};



const convertToAudio = (videoUrl: string, outputFileName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(videoUrl)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate(64)
            .format('mp3')
            .on('start', (commandLine: string) => {
                console.log(`Spawned FFmpeg with command: ${commandLine}`);
            })
            .on('progress', (progress: any) => {
                const percent = progress.percent ? `${progress.percent.toFixed(2)}%` : 'unknown';
                console.log(`Processing: ${percent} done`);
            })
            .on('error', (err: Error) => {
                console.error(`An error occurred: ${err.message}`);
                reject(err);
            })
            .on('end', () => {
                console.log('Finished conversion!');
                resolve();
            });

        command.save(outputFileName);
    });
}