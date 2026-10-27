import { Deck } from '../models/Deck.js';
import { Card } from '../models/Card.js';
import { Generation } from '../models/Generation.js';
import aiService from '../services/ai/aiService.js';
import { ProviderError, ERROR_CODES } from '../services/ai/errors.js';

export const MAX_MATERIAL_LENGTH = 20000;
export const MAX_TITLE_LENGTH = 120;
export const MIN_CARD_COUNT = 1;
export const MAX_CARD_COUNT = 50;

/**
 * Sanitizes error messages to prevent leakage of secrets, keys, or raw payloads.
 * @param {string} msg
 * @returns {string}
 */
export function sanitizeError(msg) {
  if (typeof msg !== 'string') return 'Unknown error';
  return msg
    .replace(/(?:Bearer\s+|key=)[a-zA-Z0-9_\-.]+/gi, '[REDACTED]')
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[REDACTED_URI]')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Generates flashcards from study material and persists the deck, cards, and generation ledger.
 * POST /api/generate
 */
export async function generateCards(req, res, next) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { material, title, cardCount } = req.body || {};

  // 1. Validate study material
  if (!material || typeof material !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Study material is required and must be a string',
      },
    });
  }

  const trimmedMaterial = material.trim();
  if (!trimmedMaterial) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Study material cannot be empty or whitespace-only',
      },
    });
  }

  if (trimmedMaterial.length > MAX_MATERIAL_LENGTH) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Study material exceeds maximum length of ${MAX_MATERIAL_LENGTH} characters`,
      },
    });
  }

  // 2. Validate optional title
  let finalTitle;
  if (title !== undefined && title !== null) {
    if (typeof title !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Deck title must be a string' },
      });
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Deck title cannot be empty' },
      });
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Deck title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`,
        },
      });
    }
    finalTitle = trimmedTitle;
  } else {
    const today = new Date().toISOString().split('T')[0];
    finalTitle = `Study Deck - ${today}`;
  }

  // 3. Validate optional desired card count
  if (cardCount !== undefined && cardCount !== null) {
    if (!Number.isInteger(cardCount) || cardCount < MIN_CARD_COUNT || cardCount > MAX_CARD_COUNT) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Desired card count must be an integer between ${MIN_CARD_COUNT} and ${MAX_CARD_COUNT}`,
        },
      });
    }
  }

  // 4. Create Generation ledger record in 'reserved' state
  let generation;
  const startTime = Date.now();

  try {
    generation = await Generation.create({
      userId,
      status: 'reserved',
      cardCount: 0,
    });
  } catch (ledgerErr) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to initialize generation attempt' },
    });
  }

  let aiResult;
  let createdDeck = null;

  try {
    // 5. Invoke AI generation service
    const promptOptions = {};
    if (cardCount) {
      promptOptions.systemPrompt =
        'You are an expert study assistant. Generate clear, high-quality question-and-answer flashcards from the provided study material. ' +
        `Generate approximately ${cardCount} cards. ` +
        'Output strictly a JSON object with a "cards" array. Each item must have a "question" (concise, direct question) and "answer" (factual, comprehensive answer). ' +
        'Never include markdown code blocks or commentary outside the JSON.';
    }

    aiResult = await aiService.generateFlashcards(trimmedMaterial, promptOptions);

    // 6. Persist Deck
    createdDeck = await Deck.create({
      userId,
      title: finalTitle,
    });

    // 7. Persist Cards with compensating cleanup on partial failure
    const cardDocs = aiResult.cards.map((c) => ({
      deckId: createdDeck._id,
      userId,
      question: c.question,
      answer: c.answer,
    }));

    let savedCards;
    try {
      savedCards = await Card.insertMany(cardDocs);
    } catch (cardInsertErr) {
      // Compensating cleanup: delete partially created cards and deck
      await Card.deleteMany({ deckId: createdDeck._id, userId }).catch(() => {});
      await Deck.findByIdAndDelete(createdDeck._id).catch(() => {});
      createdDeck = null;
      throw cardInsertErr;
    }

    // 8. Update generation ledger to 'completed'
    generation.status = 'completed';
    generation.provider = aiResult.provider;
    generation.cardCount = savedCards.length;
    generation.latencyMs = Date.now() - startTime;
    await generation.save();

    // 9. Return safe response
    return res.status(201).json({
      deck: {
        id: createdDeck._id.toString(),
        title: createdDeck.title,
        cardCount: savedCards.length,
        createdAt: createdDeck.createdAt,
      },
      cards: savedCards.map((c) => ({
        id: c._id.toString(),
        question: c.question,
        answer: c.answer,
      })),
      generation: {
        id: generation._id.toString(),
        provider: generation.provider,
        latencyMs: generation.latencyMs,
      },
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    // Mark generation ledger as failed
    if (generation) {
      generation.status = 'failed';
      if (aiResult?.provider) {
        generation.provider = aiResult.provider;
      }
      generation.latencyMs = latencyMs;
      generation.error = sanitizeError(err?.message || 'Generation failed');
      await generation.save().catch(() => {});
    }

    // Provider failure
    if (err instanceof ProviderError || err?.code === ERROR_CODES.ALL_PROVIDERS_FAILED) {
      return res.status(503).json({
        error: {
          code: 'PROVIDER_FAILED',
          message: 'All AI providers failed to generate flashcards. Please try again shortly.',
        },
      });
    }

    // Unexpected server / database failure
    return res.status(500).json({
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate and save flashcards',
      },
    });
  }
}

export default {
  generateCards,
  sanitizeError,
};