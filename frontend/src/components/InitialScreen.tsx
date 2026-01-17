import { MessageSquare, AlertCircle, Sparkles } from 'lucide-react'
import { getCaptions } from '@/utils/captions'

export interface Caption {
    time: string
    caption: string
}

interface InitialScreenProps {
    hasCaptions: boolean
    onStartSummary: () => void
}

export function InitialScreen({ onStartSummary, hasCaptions }: InitialScreenProps) {

    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card p-6 rounded-full border border-border">
                    {hasCaptions ? (
                        <MessageSquare className="w-12 h-12 text-primary" />
                    ) : (
                        <AlertCircle className="w-12 h-12 text-destructive" />
                    )}
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold tracking-tight">
                    {hasCaptions ? 'Captions Detected' : 'No Captions Found'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                    {hasCaptions
                        ? 'We found lecture captions! We can generate a summary directly using the Panopto API.'
                        : 'No captions were found. We will need to extract medical audio and transcribe it first.'}
                </p>
            </div>

            <button
                onClick={onStartSummary}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-primary-foreground transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20"
            >
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                Generate AI Summary
            </button>
            <button
                onClick={getCaptions}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-primary-foreground transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20"
            >
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                get captions
            </button>

            {!hasCaptions && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        Audio Extraction Required
                    </span>
                </div>
            )}
        </div>
    )
}
