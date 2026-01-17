import type { Request, Response } from 'express';
import type { TranscriptionInput } from '../interfaces/transcription.interface.js';
import { createTranscriptionService } from '../services/transcription.service.js';

export const createTranscriptionController = async (req: Request<{}, {}, TranscriptionInput>, res: Response) => {
    try {
        // 1. Extract data
        const transcriptionInputData = req.body;

        // 2. Call the service
        const transcription = await createTranscriptionService(transcriptionInputData);

        // 3. Send success response
        res.status(201).json(transcription);
    } catch (error: any) {
        // 4. Handle errors (validation or database errors)
        res.status(400).json({ message: error.message });
    }
};