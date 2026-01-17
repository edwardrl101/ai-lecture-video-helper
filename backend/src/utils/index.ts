import express, { type Request, type Response, type Application } from 'express';
import cors from 'cors';
import { generateLectureSummary } from '../services/groq.js';

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

app.post('/generate-summary', async (req: Request, res: Response) => {
    try {
        console.log("Called")
        const { captions } = req.body;

        if (!captions || !Array.isArray(captions) || captions.length === 0) {
            res.status(400).json({ error: 'Captions array is required' });
            return;
        }

        console.log(`Received ${captions.length} captions, generating summary...`);

        const summaries = await generateLectureSummary(captions);

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