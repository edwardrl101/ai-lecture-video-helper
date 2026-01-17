import express, { type Request, type Response, type Application } from 'express';
import cors from 'cors';
import { generateLectureSummary } from '../services/groq.js';
import transcriptionRoutes from '../routes/transcription.routes.js';

const app: Application = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello from TypeScript + Express!');
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/transcribe', transcriptionRoutes);

app.post('/generate-summary', async (req: Request, res: Response) => {
    try {
        console.log("Called /generate-summary");
        const { captions, streamUrl, duration } = req.body;

        let captionsToUse = captions;

        // Check if we have captions to work with
        if (!captions || !Array.isArray(captions) || captions.length === 0) {
            // No captions - check if we can auto-transcribe
            if (streamUrl && duration) {
                console.log(`📝 No captions provided. Auto-transcribing from stream...`);
                console.log(`   URL: ${streamUrl.substring(0, 50)}...`);
                console.log(`   Duration: ${duration}s`);

                // Import and call transcription service
                const { createTranscriptionService } = await import('../services/transcription.service.js');
                const transcriptionSegments = await createTranscriptionService({
                    url: streamUrl,
                    duration: duration
                });

                console.log(`✅ Transcription complete: ${transcriptionSegments.length} segments`);

                // Convert transcription segments to caption format
                captionsToUse = transcriptionSegments.map((segment: any) => ({
                    text: segment.text,
                    start: segment.start,
                    end: segment.end
                }));
            } else {
                res.status(400).json({
                    error: 'Either captions array or streamUrl + duration are required'
                });
                return;
            }
        }

        console.log(`Generating summary from ${captionsToUse.length} captions...`);

        const summaries = await generateLectureSummary(captionsToUse);

        console.log(`Generated ${summaries.length} topic summaries`);
        res.json(summaries);

    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({
            error: 'Failed to generate summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});