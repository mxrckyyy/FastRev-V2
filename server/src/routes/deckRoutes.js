import { Router } from 'express';
import { listDecks, createDeck, getDeckById, deleteDeck } from '../controllers/deckController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All deck management endpoints require authentication
router.use(authenticate);

router.get('/', listDecks);
router.post('/', createDeck);
router.get('/:id', getDeckById);
router.delete('/:id', deleteDeck);

export default router;
