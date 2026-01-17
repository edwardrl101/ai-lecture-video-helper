import { useEffect, useState } from 'react'
import { Caption, InitialScreen } from './components/InitialScreen'
import { LoadingScreen } from './components/LoadingScreen'
import { ResultScreen } from './components/ResultScreen'
import { DetailsScreen } from './components/DetailsScreen'
import { Summary } from './utils/summary'
import { getCaptions } from './utils/captions'
import { ErrorScreen } from './components/ErrorScreen'

type Screen = 'initial' | 'loading' | 'results' | 'details' | 'error'

function App() {
    const [screen, setScreen] = useState<Screen>('initial')
    const [selectedTopic, setSelectedTopic] = useState<Summary | null>(null)
    const [hasCaptions, setHasCaptions] = useState(false)
    const [captions, setCaptions] = useState<Caption[]>([])
    const [summaries, setSummaries] = useState<Summary[]>([])

    // Simulate caption detection from Panopto
    useEffect(() => {
        const fetchCaptions = async () => {
            try {
                const data = await getCaptions();
                if (data) {
                    setHasCaptions(true);
                    console.log(data)
                    setCaptions(data);
                }
            } catch (err) {
                console.error("Failed to load captions", err);
            }
        };
        fetchCaptions();
    }, [])





    const handleSelectTopic = (topic: Summary) => {
        setSelectedTopic(topic)
        setScreen('details')
    }

    const handleBackToResults = () => {
        setScreen('results')
    }

    const handleStartSummary = async () => {
        setScreen('loading')
    }

    const handleSummaryGenerateFail = () => {
        setScreen('error')
    }

    const handleSummaryGenerated = (summaries: Summary[]) => {
        setSummaries(summaries)
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
                    />
                )}

                {screen === 'loading' && (
                    <LoadingScreen
                        isExtractingAudio={!hasCaptions}
                        onSummaryGenerated={handleSummaryGenerated}
                        onSummaryGenerateFail={handleSummaryGenerateFail}
                        captions={captions}
                    />
                )}

                {screen === 'results' && (
                    <ResultScreen
                        summaries={summaries}
                        onSelectTopic={handleSelectTopic}
                        onSelectRedo={handleStartSummary}
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
