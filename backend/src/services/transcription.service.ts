import type { Transcription, TranscriptionInput } from '../interfaces/transcription.interface.js';
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

export const createTranscriptionService = async (data: TranscriptionInput): Promise<Transcription[]> => {
    await convertToAudio(data.url, outputFileName);
    return [];
};



const convertToAudio = async (videoUrl: string, outputFileName: string) => {
    // const audioStream = new PassThrough();
    const command = ffmpeg(videoUrl)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate(64)
        .format('mp3')
        .on('start', (commandLine: string) => {
            console.log(`Spawned FFmpeg with command: ${commandLine}`);
        })
        .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('error', (err: Error) => {
            console.error(`An error occurred: ${err.message}`);
        })
        .on('end', () => {
            console.log('Finished conversion!');
        });

    // Option A: Save to a local file
    command.save(outputFileName);

    // Option B: Pipe to a stream (Better for sending to an API)
    // command.pipe(audioStream);
}