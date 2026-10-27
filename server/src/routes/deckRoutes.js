import { Router } from 'express';
import {
  listDecks,
  createDeck,
  getDeckById,
  updateDeck,
  deleteDeck,
} from '../controllers/deckController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All deck management endpoints require authentication
router.use(authenticate);

router.get('/', listDecks);
router.post('/', createDeck);
router.get('/:deckId', getDeckById);
router.patch('/:deckId', updateDeck);
router.delete('/:deckId', deleteDeck);

export default router;