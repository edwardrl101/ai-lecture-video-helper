import { AlertCircle, Sparkles } from 'lucide-react'

interface ErrorScreenProps {
    onSelectRedo: () => void
}

export function ErrorScreen({ onSelectRedo }: ErrorScreenProps) {

    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card p-6 rounded-full border border-border">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold tracking-tight">
                    {'Error Generating Summaries'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                    {'Please try generating again.'}
                </p>
            </div>

            <button
                onClick={onSelectRedo}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-primary-foreground transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20"
            >
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                Generate AI Summary
            </button>
        </div>
    )
}
