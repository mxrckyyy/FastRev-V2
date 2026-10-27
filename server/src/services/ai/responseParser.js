import { ProviderError, ERROR_CODES } from './errors.js';

export const MAX_QUESTION_LENGTH = 2000;
export const MAX_ANSWER_LENGTH = 5000;
export const MIN_CARDS = 1;
export const MAX_CARDS = 100;

/**
 * Strips markdown code fences from AI response string.
 * e.g., ```json\n{...}\n``` or ```\n{...}\n```
 * @param {string} text
 * @returns {string}
 */
export function stripCodeFences(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  const fenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = trimmed.match(fenceRegex);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
}

/**
 * Parses and validates raw AI text into normalized flashcards.
 * @param {string} rawText
 * @param {object} [options]
 * @param {string} [options.provider]
 * @returns {{ cards: Array<{ question: string, answer: string }> }}
 */
export function parseFlashcards(rawText, options = {}) {
  const provider = options.provider;

  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new ProviderError(
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      'AI response was empty',
      { provider, retryable: false }
    );
  }

  const cleanedText = stripCodeFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    throw new ProviderError(
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      'Failed to parse AI response as JSON',
      { provider, retryable: false, details: err.message }
    );
  }

  let cardList;
  if (Array.isArray(parsed)) {
    cardList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.cards)) {
      cardList = parsed.cards;
    } else if (Array.isArray(parsed.flashcards)) {
      cardList = parsed.flashcards;
    } else {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        'AI response JSON missing "cards" array',
        { provider, retryable: false }
      );
    }
  } else {
    throw new ProviderError(
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      'AI response is not a valid JSON object or array',
      { provider, retryable: false }
    );
  }

  if (cardList.length < MIN_CARDS) {
    throw new ProviderError(
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      'AI response contains an empty list of cards',
      { provider, retryable: false }
    );
  }

  if (cardList.length > MAX_CARDS) {
    throw new ProviderError(
      ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      `AI response generated too many cards (maximum is ${MAX_CARDS})`,
      { provider, retryable: false }
    );
  }

  const validatedCards = cardList.map((card, index) => {
    if (!card || typeof card !== 'object') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} is not an object`,
        { provider, retryable: false }
      );
    }

    const { question, answer } = card;

    if (typeof question !== 'string') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} is missing a string question`,
        { provider, retryable: false }
      );
    }

    if (typeof answer !== 'string') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} is missing a string answer`,
        { provider, retryable: false }
      );
    }

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (!trimmedQuestion) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} has an empty question`,
        { provider, retryable: false }
      );
    }

    if (!trimmedAnswer) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} has an empty answer`,
        { provider, retryable: false }
      );
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters`,
        { provider, retryable: false }
      );
    }

    if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        `Card at index ${index} answer exceeds maximum length of ${MAX_ANSWER_LENGTH} characters`,
        { provider, retryable: false }
      );
    }

    return {
      question: trimmedQuestion,
      answer: trimmedAnswer,
    };
  });

  return { cards: validatedCards };
}

export default {
  parseFlashcards,
  stripCodeFences,
  MAX_QUESTION_LENGTH,
  MAX_ANSWER_LENGTH,
  MIN_CARDS,
  MAX_CARDS,
};