import { useEffect, useState } from 'react'
import { Caption, InitialScreen } from './components/InitialScreen'
import { LoadingScreen } from './components/LoadingScreen'
import { ResultScreen } from './components/ResultScreen'
import { DetailsScreen } from './components/DetailsScreen'
import { Summary } from './utils/summary'
import { getCaptions } from './utils/captions'
import { getStreamUrl } from './utils/audio'
import { ErrorScreen } from './components/ErrorScreen'
import { TranscriptionSegment } from './utils/transcription'


type Screen = 'initial' | 'loading' | 'results' | 'details' | 'error'
type ProcessMode = 'summary' | 'transcription'


function App() {
    const [screen, setScreen] = useState<Screen>('initial')
    const [selectedTopic, setSelectedTopic] = useState<Summary | null>(null)
    const [hasCaptions, setHasCaptions] = useState(false)
    const [captions, setCaptions] = useState<Caption[]>([])
    const [streamUrl, setStreamUrl] = useState<string>("")
    const [duration, setDuration] = useState<number>(0)
    const [summaries, setSummaries] = useState<Summary[]>([])
    const [transcriptions, setTranscriptions] = useState<TranscriptionSegment[]>([])
    const [processMode, setProcessMode] = useState<ProcessMode>('summary')



    // Simulate caption detection from Panopto
    useEffect(() => {
        const initializeData = async () => {
            try {
                console.log("🔍 Checking Panopto data...");

                // Run both fetches in parallel for better performance
                const [captionData, url] = await Promise.all([
                    getCaptions(),
                    getStreamUrl()
                ]);

                // 1. Handle Captions
                if (captionData && captionData.length > 0) {
                    setHasCaptions(true);
                    setCaptions(captionData);
                    console.log(captionData)
                    console.log(`✅ Loaded ${captionData.length} captions`);
                } else {
                    setHasCaptions(false);
                    console.log("ℹ️ No captions found");
                }

                // 2. Handle Stream URL
                if (url) {
                    setStreamUrl(url.url);
                    setDuration(url.duration);
                    console.log("✅ Stream URL captured:", url.url);
                } else {
                    console.log("ℹ️ No Stream URL found");
                }


            } catch (err) {
                console.error("❌ Initialization failed", err);
                setHasCaptions(false);
            }
        };

        initializeData();
    }, []);





    const handleSelectTopic = (topic: Summary) => {
        setSelectedTopic(topic)
        setScreen('details')
    }

    const handleBackToResults = () => {
        setScreen('results')
    }

    const handleStartSummary = async () => {
        setProcessMode('summary')
        setScreen('loading')
    }

    const handleStartTranscription = async () => {
        setProcessMode('transcription')
        setScreen('loading')
    }


    const handleSummaryGenerateFail = () => {
        setScreen('error')
    }

    const handleSummaryGenerated = (summaries: Summary[]) => {
        setSummaries(summaries)
        setScreen('results')
    }

    const handleTranscriptionGenerated = (segments: TranscriptionSegment[]) => {
        setTranscriptions(segments)
        setScreen('results')
    }


    return (
        <div className="w-[450px] min-h-[600px] max-h-[650px] bg-background text-foreground flex flex-col p-6 shadow-2xl relative overflow-hidden border border-border/50">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>

            <header className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black italic shadow-lg shadow-primary/30">
                        L
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">LectureHelper</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
                {screen === 'initial' && (
                    <InitialScreen
                        hasCaptions={hasCaptions}
                        onStartSummary={handleStartSummary}
                        onStartTranscription={handleStartTranscription}
                    />
                )}


                {screen === 'loading' && (
                    <LoadingScreen
                        isExtractingAudio={!hasCaptions}
                        processMode={processMode}
                        onSummaryGenerated={handleSummaryGenerated}
                        onTranscriptionGenerated={handleTranscriptionGenerated}
                        onSummaryGenerateFail={handleSummaryGenerateFail}
                        captions={captions}
                        streamUrl={streamUrl}
                        duration={duration}
                    />
                )}



                {screen === 'results' && (
                    <ResultScreen
                        summaries={summaries}
                        transcriptions={transcriptions}
                        initialMode={processMode}
                        onSelectTopic={handleSelectTopic}
                    />
                )}


                {screen === 'details' && selectedTopic && (
                    <DetailsScreen
                        topic={selectedTopic}
                        onBack={handleBackToResults}
                    />
                )}

                {screen === 'error' && (
                    <ErrorScreen
                        onSelectRedo={handleStartSummary}
                    />
                )}
            </main>

            <footer className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center gap-2">
                <div className="flex gap-4">
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Agent Ready
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        v1.2.0-Alpha
                    </span>
                </div>
            </footer>
        </div>
    )
}

export default App
