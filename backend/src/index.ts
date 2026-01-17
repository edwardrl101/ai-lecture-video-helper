import express, { type Request, type Response, type Application } from 'express';
import transcriptionRoutes from './routes/transcription.routes.js';

const app: Application = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/transcribe', transcriptionRoutes);


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});