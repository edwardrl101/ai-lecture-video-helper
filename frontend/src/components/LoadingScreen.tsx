import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { generateSummary, Summary } from '@/utils/summary'
import { Caption } from './InitialScreen'
import { transcribeVideo, TranscriptionSegment } from '@/utils/transcription'
import { LoadingSteps } from './LoadingSteps'

interface LoadingScreenProps {
    isExtractingAudio: boolean
    processMode: 'summary' | 'transcription'
    onSummaryGenerated: (summaries: Summary[]) => void
    onTranscriptionGenerated: (segments: TranscriptionSegment[]) => void
    onSummaryGenerateFail: () => void
    captions: Caption[]
    streamUrl: string
    duration: number

}



export function LoadingScreen({ isExtractingAudio, processMode, onSummaryGenerated, onTranscriptionGenerated, onSummaryGenerateFail, captions, streamUrl, duration }: LoadingScreenProps) {


    useEffect(() => {
        // 1. Validation: Don't run if no content source exists
        if ((!captions || captions.length === 0) && !streamUrl) {
            console.error("No captions and no stream URL available.");
            return;
        }

        // Helper function to convert Caption[] to TranscriptionSegment[]
        const convertCaptionsToSegments = (caps: Caption[]): TranscriptionSegment[] => {
            return caps.map((cap, index, arr) => {
                // Parse time string (format: "HH:MM:SS" or "MM:SS" or seconds)
                const parseTime = (timeStr: string): number => {
                    // If it's already a number in string form
                    if (!isNaN(Number(timeStr))) {
                        return Number(timeStr);
                    }
                    // Parse HH:MM:SS or MM:SS format
                    const parts = timeStr.split(':').map(Number);
                    if (parts.length === 3) {
                        return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) {
                        return parts[0] * 60 + parts[1];
                    }
                    return 0;
                };

                const start = parseTime(cap.time);
                // End time is the start of the next caption, or start + 5 for the last one
                const end = index < arr.length - 1
                    ? parseTime(arr[index + 1].time)
                    : start + 5;

                return {
                    start,
                    end,
                    text: cap.caption
                };
            });
        };

        // 2. Setup AbortController and Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort(); // This triggers the catch block
        }, 600000);

        const processLecture = async () => {
            try {
                let summaries;
                let transcriptionSegments;

                if (processMode === 'summary') {
                    // Generate summary (backend may auto-transcribe if no captions)
                    // Generate summary (backend may auto-transcribe if no captions)
                    const result = await generateSummary(captions, streamUrl, duration, {
                        signal: controller.signal
                    });
                    summaries = result.summaries;

                    // Capture auto-generated transcriptions if available
                    if (result.transcriptions && result.transcriptions.length > 0) {
                        transcriptionSegments = result.transcriptions;
                    }

                    // Also populate transcription tab from captions if we have them and no backend transcriptions
                    if ((!transcriptionSegments || transcriptionSegments.length === 0) && captions && captions.length > 0) {
                        transcriptionSegments = convertCaptionsToSegments(captions);
                    }

                } else {
                    // TRANSCRIPTION MODE
                    if (captions && captions.length > 0) {
                        // Use existing captions for both tabs
                        console.log('📝 Using existing captions for both tabs');
                        transcriptionSegments = convertCaptionsToSegments(captions);

                        // Also generate summary from captions
                        // summaries = await generateSummary(captions, streamUrl, duration, {
                        //     signal: controller.signal
                        // });
                    } else {
                        // No captions - transcribe and then summarize
                        console.log('🎤 No captions found, extracting audio...');
                        transcriptionSegments = await transcribeVideo(streamUrl, duration, {
                            signal: controller.signal
                        });

                        // Also generate summary from transcription
                        // Convert segments back to caption format for summary API
                        console.log('📊 Generating summary from transcription...');
                        const captionsFromTranscription = transcriptionSegments.map(seg => ({
                            caption: seg.text,
                            time: String(seg.start)
                        }));
                        const result = await generateSummary(captionsFromTranscription, streamUrl, duration, {
                            signal: controller.signal
                        });
                        summaries = result.summaries;
                    }
                }

                clearTimeout(timeoutId);

                // Populate both tabs
                if (summaries) {
                    onSummaryGenerated(summaries);
                }
                if (transcriptionSegments) {
                    onTranscriptionGenerated(transcriptionSegments);
                }

            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.error("Request timed out after 600 seconds");
                } else {
                    console.error("Process failed", err);
                }
                onSummaryGenerateFail();
            }
        };
        console.log(`🚀 Starting ${processMode} process...`)
        processLecture();


        // 3. Cleanup: Stop everything if user leaves the page
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [captions]); // Only re-run if captions change

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 overflow-hidden">
            <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative bg-card p-10 rounded-full border border-border shadow-2xl">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
            </div>

            <div className="w-full space-y-6 flex flex-col overflow-hidden">
                <div className="text-center space-y-2 shrink-0">
                    <h2 className="text-lg font-bold tracking-tight">Processing Lecture</h2>
                    <p className="text-sm text-muted-foreground">This may take a minute...</p>
                </div>

                <LoadingSteps isExtractingAudio={isExtractingAudio} />
            </div>
        </div>
    )
}
