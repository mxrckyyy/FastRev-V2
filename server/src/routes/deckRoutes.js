import { Router } from 'express';
import { getDecks, getDeckById, updateDeck, deleteDeck } from '../controllers/deckController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All deck management endpoints require authentication
router.use(authenticate);

router.get('/', getDecks);
router.get('/:deckId', getDeckById);
router.patch('/:deckId', updateDeck);
router.delete('/:deckId', deleteDeck);

export default router;