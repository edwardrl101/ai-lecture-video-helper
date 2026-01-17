import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Clock, BookOpen, Sparkles, AudioLines, FileDown, FileText, RotateCcw, ChevronDown, Send, X } from 'lucide-react'
import { Summary } from '@/utils/summary'
import { TranscriptionSegment } from '@/utils/transcription'
import { seekVideo, parseTimestamp, formatTime } from '@/utils/video'

import { jsPDF } from 'jspdf'

interface ResultScreenProps {
    summaries: Summary[]
    transcriptions: TranscriptionSegment[]
    initialMode: 'summary' | 'transcription'
    onSelectTopic: (topic: Summary) => void
    onRedo: () => void
    onRedoWithPrompt: (prompt: string) => void
}

export function ResultScreen({ summaries, transcriptions, initialMode, onSelectTopic, onRedo, onRedoWithPrompt }: ResultScreenProps) {
    const [viewMode, setViewMode] = useState<'summary' | 'transcription'>(initialMode)
    const [isRedoDropdownOpen, setIsRedoDropdownOpen] = useState(false)
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
    const [customPrompt, setCustomPrompt] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsRedoDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])


    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        const title = "Lecture Transcription"
        doc.setFontSize(20)
        doc.text(title, 20, 20)
        doc.setFontSize(12)

        let y = 30
        const margin = 20
        const pageWidth = doc.internal.pageSize.getWidth()
        const maxWidth = pageWidth - (margin * 2)

        transcriptions.forEach((segment) => {
            const time = `[${formatTime(segment.start)}]`
            const text = segment.text
            const fullText = `${time} ${text}`

            const lines = doc.splitTextToSize(fullText, maxWidth)

            if (y + (lines.length * 7) > 280) {
                doc.addPage()
                y = 20
            }

            doc.text(lines, margin, y)
            y += (lines.length * 7) + 2
        })

        doc.save('transcription.pdf')
    }

    const handleDownloadSummaryPDF = () => {
        const doc = new jsPDF()
        const title = "Lecture Summary"
        doc.setFontSize(20)
        doc.text(title, 20, 20)

        let y = 35
        const margin = 20
        const pageWidth = doc.internal.pageSize.getWidth()
        const maxWidth = pageWidth - (margin * 2)

        summaries.forEach((topic) => {
            // Topic Title
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            const titleLines = doc.splitTextToSize(`${topic.timestamp} - ${topic.title}`, maxWidth)
            if (y + (titleLines.length * 7) > 280) {
                doc.addPage()
                y = 20
            }
            doc.text(titleLines, margin, y)
            y += (titleLines.length * 7) + 2

            // Topic Summary
            doc.setFontSize(11)
            doc.setFont("helvetica", "normal")
            const summaryLines = doc.splitTextToSize(topic.summary, maxWidth)
            if (y + (summaryLines.length * 6) > 280) {
                doc.addPage()
                y = 20
            }
            doc.text(summaryLines, margin, y)
            y += (summaryLines.length * 6) + 4

            // Details
            topic.details.forEach((detail) => {
                const detailText = `• [${detail.timestamp}] ${detail.point}`
                const detailLines = doc.splitTextToSize(detailText, maxWidth - 5)
                if (y + (detailLines.length * 5) > 280) {
                    doc.addPage()
                    y = 20
                }
                doc.text(detailLines, margin + 5, y)
                y += (detailLines.length * 5) + 1
            })
            y += 5
        })

        doc.save('lecture-summary.pdf')
    }

    const handleDownloadMarkdown = () => {
        let content = `# Lecture Summary\n\n`

        summaries.forEach((topic) => {
            content += `## ${topic.timestamp} - ${topic.title}\n\n`
            content += `${topic.summary}\n\n`

            if (topic.details && topic.details.length > 0) {
                content += `### Key Points\n`
                topic.details.forEach((detail) => {
                    content += `- [${detail.timestamp}] ${detail.point}\n`
                })
                content += `\n`
            }
            content += `---\n\n`
        })

        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'lecture-summary.md'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }


    return (
        <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
            <div className="flex p-1 bg-muted rounded-xl shrink-0">
                <button
                    onClick={() => setViewMode('summary')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${viewMode === 'summary' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Summary
                </button>
                <button
                    onClick={() => setViewMode('transcription')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${viewMode === 'transcription' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <AudioLines className="w-3.5 h-3.5" />
                    Transcript
                </button>
            </div>


            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-accent/10 rounded-3xl border border-border/50">
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {/* Sticky Header for Download Buttons */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                {viewMode === 'summary' ? (
                                    <>
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        Lecture Summary
                                    </>
                                ) : (
                                    <>
                                        <AudioLines className="w-4 h-4 text-primary" />
                                        Transcription
                                    </>
                                )}
                            </h2>

                            {/* Redo Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsRedoDropdownOpen(!isRedoDropdownOpen)}
                                    className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground text-[10px] font-bold rounded-md transition-all border border-border"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Redo
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isRedoDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isRedoDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => {
                                                onRedo()
                                                setIsRedoDropdownOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold hover:bg-accent transition-colors text-left"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-primary" />
                                            Back to Initial Screen
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsPromptModalOpen(true)
                                                setIsRedoDropdownOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold hover:bg-accent transition-colors text-left border-t border-border"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            Redo with extra prompt
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewMode === 'summary' ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownloadMarkdown}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-full transition-all border border-primary/20"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    MD
                                </button>
                                <button
                                    onClick={handleDownloadSummaryPDF}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-full transition-all border border-primary/20"
                                >
                                    <FileDown className="w-3.5 h-3.5" />
                                    PDF
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-full transition-all border border-primary/20"
                            >
                                <FileDown className="w-3.5 h-3.5" />
                                Download PDF
                            </button>
                        )}
                    </div>

                    <div className="p-4">
                        <div className="grid gap-4">
                            {viewMode === 'summary' ? (
                                summaries.map((summary) => (
                                    <div
                                        key={summary.id}
                                        onClick={() => onSelectTopic(summary)}
                                        className="group relative bg-card hover:bg-accent/30 border border-border p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div
                                                className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    seekVideo(parseTimestamp(summary.timestamp));
                                                }}
                                                title="Click to seek"
                                            >
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
                                                    {formatTime(parseTimestamp(summary.timestamp))}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        console.log('AI Explanation for', summary.title)
                                                    }}
                                                    title="AI Explanation"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                                                {summary.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {summary.summary}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">{summary.details.length} Sub-topics</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-4">
                                    {transcriptions.map((segment, i) => (
                                        <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-accent/20 transition-colors">
                                            <div
                                                className="shrink-0 text-[10px] font-bold font-mono text-primary bg-primary/10 px-2 py-1 h-fit rounded-md hover:bg-primary/20 transition-colors cursor-pointer"
                                                onClick={() => seekVideo(segment.start)}
                                                title="Click to seek"
                                            >
                                                {formatTime(segment.start)}
                                            </div>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {segment.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Redo with Extra Prompt Modal */}
            {isPromptModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg">Extra AI Instructions</h3>
                                </div>
                                <button
                                    onClick={() => setIsPromptModalOpen(false)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Add an extra instruction or focus area while generating the summaries.
                            </p>

                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="e.g., Focus more on the mathematical derivations..."
                                className="w-full h-32 p-4 bg-accent/20 border border-border rounded-2xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                            />

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsPromptModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold rounded-xl border border-border hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!customPrompt.trim()}
                                    onClick={() => {
                                        onRedoWithPrompt(customPrompt)
                                        setIsPromptModalOpen(false)
                                    }}
                                    className="flex-[2] py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    Regenerate Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
