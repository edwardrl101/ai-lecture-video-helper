import { useState, useEffect, useRef } from 'react'
import { Loader2, AudioLines, FileText, Sparkles, Wand2 } from 'lucide-react'
import { generateSummary, Summary } from '@/utils/summary'
import { Caption } from './InitialScreen'
import { transcribeVideo, TranscriptionSegment } from '@/utils/transcription'

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
    const [step, setStep] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const activeStepRef = useRef<HTMLDivElement>(null)

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
                    summaries = await generateSummary(captions, streamUrl, duration, {
                        signal: controller.signal
                    });

                    // Also populate transcription tab from captions
                    if (captions && captions.length > 0) {
                        transcriptionSegments = convertCaptionsToSegments(captions);
                    }
                    // Note: If no captions, backend already transcribed, but we don't have segments here
                    // In this case, transcription tab will be empty - user can click transcribe if needed

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
                        // summaries = await generateSummary(captionsFromTranscription, streamUrl, duration, {
                        //     signal: controller.signal
                        // });
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

    const steps = isExtractingAudio
        ? [
            { label: 'Extracting audio from lecture...', icon: AudioLines },
            { label: 'Transcribing lecture content...', icon: FileText },
            { label: 'Analyzing speaker segments...', icon: Sparkles },
            { label: 'Identifying key themes...', icon: Wand2 },
            { label: 'Using AI to generate summary...', icon: Sparkles },
            { label: 'Finalizing timestamps...', icon: Wand2 }
        ]
        : [
            { label: 'Accessing Panopto captions...', icon: FileText },
            { label: 'Filtering noise and breaks...', icon: Sparkles },
            { label: 'Using AI to generate summary...', icon: Sparkles },
            { label: 'Refining topic transitions...', icon: Wand2 },
            { label: 'Finalizing timestamps...', icon: Wand2 }
        ]

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s < steps.length - 1 ? s + 1 : s))
        }, 1500)
        return () => clearInterval(interval)
    }, [steps.length])

    useEffect(() => {
        if (activeStepRef.current && containerRef.current) {
            const container = containerRef.current
            const activeItem = activeStepRef.current

            const itemOffsetTop = activeItem.offsetTop
            const containerHeight = container.clientHeight
            const itemHeight = activeItem.offsetHeight

            const scrollPos = itemOffsetTop - (containerHeight / 2) + (itemHeight / 2)

            container.scrollTo({
                top: Math.max(0, scrollPos),
                behavior: 'smooth'
            })
        }
    }, [step])

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

                <div
                    ref={containerRef}
                    className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar mask-fade"
                >
                    {steps.map((s, i) => {
                        const Icon = s.icon
                        const isActive = i === step
                        const isCompleted = i < step

                        return (
                            <div
                                key={i}
                                ref={isActive ? activeStepRef : null}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 ${isActive ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]' : 'border-transparent opacity-40'
                                    } ${isCompleted ? 'opacity-20 grayscale' : ''}`}
                            >
                                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {s.label}
                                </span>
                                {isActive && (
                                    <div className="ml-auto flex gap-1 shrink-0">
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
