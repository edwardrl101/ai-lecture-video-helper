import { useState, useEffect, useRef } from 'react'
import { Loader2, AudioLines, FileText, Sparkles, Wand2 } from 'lucide-react'
import { generateSummaryDummy, Summary } from '@/utils/summary'
import { Caption } from './InitialScreen'

interface LoadingScreenProps {
    isExtractingAudio: boolean
    onSummaryGenerated: (summaries: Summary[]) => void
    onSummaryGenerateFail: () => void
    captions: Caption[]
}

export function LoadingScreen({ isExtractingAudio, onSummaryGenerated, onSummaryGenerateFail, captions }: LoadingScreenProps) {
    const [step, setStep] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const activeStepRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 1. Validation: Don't run if no captions exist
        if (!captions || captions.length === 0) return;

        // 2. Setup AbortController and Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort(); // This triggers the catch block
        }, 6000);

        const generateSummaries = async () => {
            try {
                // Pass the signal to your dummy function or fetch call
                const resultingSummaries = await generateSummaryDummy(captions, {
                    signal: controller.signal
                });

                // If we reach here, it succeeded before 6 seconds
                clearTimeout(timeoutId);
                onSummaryGenerated(resultingSummaries);

            } catch (err: any) {
                // Check if the error was caused by the timeout (abort)
                if (err.name === 'AbortError') {
                    console.error("Request timed out after 6 seconds");
                } else {
                    console.error("Request failed for other reasons", err);
                }

                onSummaryGenerateFail();
            }
        };
        console.log('generating summaries...')
        generateSummaries();

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
