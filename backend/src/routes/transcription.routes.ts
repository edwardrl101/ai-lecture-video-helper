import { Router } from 'express';
import { createTranscriptionController } from '../controllers/transcription.controller.js';

const router = Router();

router.post('/', createTranscriptionController);

export default router;