import { ArrowLeft, Clock, Sparkles } from 'lucide-react'
import { Summary } from '@/utils/summary'
import { seekVideo, parseTimestamp, formatTime } from '@/utils/video'

interface DetailsScreenProps {
    topic: Summary
    onBack: () => void
}

export function DetailsScreen({ topic, onBack }: DetailsScreenProps) {
    return (
        <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden">
            <header className="flex items-center gap-4 shrink-0">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-accent rounded-full transition-colors active:scale-90"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold tracking-tight">Deep Dive</h2>
            </header>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-4 shrink-0 relative">
                <div
                    className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full w-fit hover:bg-primary/90 transition-colors cursor-pointer"
                    onClick={() => seekVideo(parseTimestamp(topic.timestamp))}
                    title="Click to seek"
                >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold font-mono tracking-widest">
                        {formatTime(parseTimestamp(topic.timestamp))}
                    </span>
                </div>
                <button
                    className="absolute top-6 right-6 p-2 bg-background border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95"
                    onClick={() => console.log('AI Explanation for main topic')}
                >
                    <Sparkles className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold leading-tight pr-10">{topic.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic">
                    {topic.summary}
                </p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-accent/10 rounded-3xl border border-border/50">
                <div className="px-4 pt-4 shrink-0">
                    <div className="flex items-center gap-2 text-muted-foreground border-b border-border/50 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Granular Timestamps</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-3">
                        {topic.details.map((detail, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:bg-accent/20 transition-all cursor-pointer group"
                                onClick={() => seekVideo(parseTimestamp(detail.timestamp))}
                            >
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></div>
                                    {i !== topic.details.length - 1 && <div className="w-[1px] h-8 bg-border my-1"></div>}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div
                                        className="text-[10px] font-bold font-mono text-primary/60 hover:text-primary transition-colors inline-block"
                                        title="Seek to start"
                                    >
                                        {formatTime(parseTimestamp(detail.timestamp))}
                                    </div>
                                    <p className="text-sm font-semibold group-hover:text-foreground transition-colors">{detail.point}</p>
                                </div>
                                <button
                                    className="p-1.5 opacity-0 group-hover:opacity-100 bg-background border border-border rounded-lg text-muted-foreground hover:text-primary transition-all active:scale-90"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        console.log('AI Explanation for', detail.point)
                                    }}
                                    title="AI Explanation"
                                >

                                    <Sparkles className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

