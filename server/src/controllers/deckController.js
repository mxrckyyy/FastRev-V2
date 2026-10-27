import mongoose from 'mongoose';
import { Deck } from '../models/Deck.js';
import { Card } from '../models/Card.js';

export const MAX_TITLE_LENGTH = 120;

/**
 * List all decks belonging to the authenticated user.
 * GET /api/decks
 */
export async function getDecks(req, res, next) {
  try {
    const userId = req.user.userId;

    // Fetch user's decks sorted newest first
    const decks = await Deck.find({ userId }).sort({ createdAt: -1 }).lean();

    if (decks.length === 0) {
      return res.status(200).json({ decks: [] });
    }

    // Group card counts by deckId in a single aggregation query
    const cardCounts = await Card.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$deckId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    cardCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const serializedDecks = decks.map((deck) => ({
      id: deck._id.toString(),
      title: deck.title,
      cardCount: countMap.get(deck._id.toString()) || 0,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    }));

    return res.status(200).json({ decks: serializedDecks });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve one deck and all its flashcards for the authenticated user.
 * GET /api/decks/:deckId
 */
export async function getDeckById(req, res, next) {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(deckId)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid deck ID format' },
      });
    }

    const deck = await Deck.findOne({ _id: deckId, userId }).lean();

    if (!deck) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Deck not found' },
      });
    }

    // Retrieve cards strictly scoped to deckId and the authenticated userId
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
 * Update deck metadata (title).
 * PATCH /api/decks/:deckId
 */
export async function updateDeck(req, res, next) {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(deckId)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid deck ID format' },
      });
    }

    const { title } = req.body || {};

    if (title === undefined || title === null) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title is required for update' },
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

    // Only update title; protected fields like userId, _id are ignored
    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: deckId, userId },
      { $set: { title: trimmedTitle } },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedDeck) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Deck not found' },
      });
    }

    const cardCount = await Card.countDocuments({ deckId: updatedDeck._id, userId });

    return res.status(200).json({
      deck: {
        id: updatedDeck._id.toString(),
        title: updatedDeck.title,
        cardCount,
        createdAt: updatedDeck.createdAt,
        updatedAt: updatedDeck.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a deck and all associated cards belonging to the authenticated user.
 * DELETE /api/decks/:deckId
 */
export async function deleteDeck(req, res, next) {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(deckId)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: 'Invalid deck ID format' },
      });
    }

    // Verify ownership before deleting
    const deck = await Deck.findOne({ _id: deckId, userId });

    if (!deck) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Deck not found' },
      });
    }

    // Delete associated cards and the deck
    await Card.deleteMany({ deckId: deck._id, userId });
    await Deck.findByIdAndDelete(deck._id);

    return res.status(200).json({
      message: 'Deck and associated cards deleted successfully',
      deckId,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
};