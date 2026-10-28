import mongoose from 'mongoose';
import { Deck } from '../models/Deck.js';
import { Card } from '../models/Card.js';

export const MAX_TITLE_LENGTH = 120;

/**
 * List all decks belonging to the authenticated user.
 * GET /api/decks
 */
export async function listDecks(req, res, next) {
  try {
    const userId = req.user.userId;

    const decks = await Deck.find({ userId }).sort({ createdAt: -1 }).lean();

    if (decks.length === 0) {
      return res.status(200).json({ decks: [] });
    }

    // Aggregate card counts in a single query instead of N+1
    const cardCounts = await Card.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$deckId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    cardCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const serialized = decks.map((deck) => ({
      id: deck._id.toString(),
      title: deck.title,
      cardCount: countMap.get(deck._id.toString()) || 0,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    }));

    return res.status(200).json({ decks: serialized });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new deck for the authenticated user.
 * POST /api/decks
 */
export async function createDeck(req, res, next) {
  try {
    const userId = req.user.userId;
    const { title } = req.body || {};

    if (title === undefined || title === null) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title is required' },
      });
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title must be a string' },
      });
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title cannot be empty' },
      });
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Title must be at most ${MAX_TITLE_LENGTH} characters`,
        },
      });
    }

    // userId always comes from the verified JWT, never from the request body
    const deck = await Deck.create({
      userId,
      title: trimmedTitle,
    });

    return res.status(201).json({
      deck: {
        id: deck._id.toString(),
        title: deck.title,
        cardCount: 0,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve one deck and all its flashcards for the authenticated user.
 * GET /api/decks/:id
 */
export async function getDeckById(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid deck ID format' },
      });
    }

    const deck = await Deck.findOne({ _id: id, userId }).lean();

    if (!deck) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Deck not found' },
      });
    }

    // Retrieve cards strictly scoped to both deckId and authenticated userId
    const cards = await Card.find({ deckId: deck._id, userId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      deck: {
        id: deck._id.toString(),
        title: deck.title,
        cardCount: cards.length,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      cards: cards.map((c) => ({
        id: c._id.toString(),
        question: c.question,
        answer: c.answer,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a deck and all associated cards belonging to the authenticated user.
 * DELETE /api/decks/:id
 *
 * Deletion order: cards first, then deck.
 * - If card deletion fails, the deck is not modified (consistent state).
 * - If deck deletion fails after cards are deleted, cards are orphaned.
 *   This is a known limitation of the non-transactional approach.
 *   The client receives a 500 error and may retry.
 *
 * MongoDB transactions are explicitly out of scope for this project.
 */
export async function deleteDeck(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid deck ID format' },
      });
    }

    // Verify ownership before any mutation
    const deck = await Deck.findOne({ _id: id, userId });

    if (!deck) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Deck not found' },
      });
    }

    // Step 1: Delete associated cards (scoped to deckId + userId).
    // If this fails, the deck remains intact — fully consistent state.
    try {
      await Card.deleteMany({ deckId: deck._id, userId });
    } catch (cardDeleteErr) {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to delete associated cards. Deck was not modified.',
        },
      });
    }

    // Step 2: Delete the deck itself.
    // If this fails, cards are already gone — the deck is now empty.
    // This is a documented limitation of the non-transactional approach.
    try {
      await Deck.findByIdAndDelete(deck._id);
    } catch (deckDeleteErr) {
      return res.status(500).json({
        error: {
          code: 'DELETE_PARTIAL',
          message:
            'Cards were removed but deck deletion failed. The deck is now empty. Please retry.',
        },
      });
    }

    return res.status(200).json({
      message: 'Deck and associated cards deleted successfully',
      deckId: id,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listDecks,
  createDeck,
  getDeckById,
  deleteDeck,
};
