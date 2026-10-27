import {
  parseFlashcards,
  stripCodeFences,
  MAX_QUESTION_LENGTH,
  MAX_ANSWER_LENGTH,
  MAX_CARDS,
} from '../../src/services/ai/responseParser.js';
import { ERROR_CODES } from '../../src/services/ai/errors.js';

describe('Response Parser (parseFlashcards)', () => {
  test('parses a valid JSON object with "cards" array', () => {
    const json = JSON.stringify({
      cards: [
        { question: 'What is photosynthesis?', answer: 'The process by which plants convert sunlight to energy.' },
        { question: 'What is chlorophyll?', answer: 'The green pigment in plants.' },
      ],
    });

    const result = parseFlashcards(json);
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].question).toBe('What is photosynthesis?');
    expect(result.cards[0].answer).toBe('The process by which plants convert sunlight to energy.');
  });

  test('parses a direct JSON array of cards', () => {
    const json = JSON.stringify([
      { question: 'Define mitosis.', answer: 'Cell division resulting in two identical daughter cells.' },
    ]);

    const result = parseFlashcards(json);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].question).toBe('Define mitosis.');
  });

  test('parses an object with "flashcards" key', () => {
    const json = JSON.stringify({
      flashcards: [
        { question: 'What is DNA?', answer: 'Deoxyribonucleic acid.' },
      ],
    });

    const result = parseFlashcards(json);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].question).toBe('What is DNA?');
  });

  test('strips markdown code fences (```json ... ```)', () => {
    const raw = "```json\n{\n  \"cards\": [\n    {\"question\": \"Q1\", \"answer\": \"A1\"}\n  ]\n}\n```";
    const result = parseFlashcards(raw);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].question).toBe('Q1');
    expect(result.cards[0].answer).toBe('A1');
  });

  test('strips generic code fences (``` ... ```)', () => {
    const raw = "```\n{\n  \"cards\": [\n    {\"question\": \"Q2\", \"answer\": \"A2\"}\n  ]\n}\n```";
    const result = parseFlashcards(raw);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].question).toBe('Q2');
  });

  test('trims surrounding whitespace from questions and answers', () => {
    const json = JSON.stringify({
      cards: [{ question: '  Trim Question?  ', answer: '  Trim Answer.  ' }],
    });
    const result = parseFlashcards(json);
    expect(result.cards[0].question).toBe('Trim Question?');
    expect(result.cards[0].answer).toBe('Trim Answer.');
  });

  test('rejects empty string or whitespace-only response', () => {
    expect(() => parseFlashcards('')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
    expect(() => parseFlashcards('   ')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects malformed JSON', () => {
    expect(() => parseFlashcards('{ cards: not-valid-json }')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects JSON missing cards or flashcards array', () => {
    expect(() => parseFlashcards('{"data": []}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects empty cards array', () => {
    expect(() => parseFlashcards('{"cards": []}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects non-object card elements', () => {
    expect(() => parseFlashcards('{"cards": ["not-an-object"]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects card with missing or non-string question', () => {
    expect(() => parseFlashcards('{"cards": [{"answer": "Ans"}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
    expect(() => parseFlashcards('{"cards": [{"question": 123, "answer": "Ans"}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects card with missing or non-string answer', () => {
    expect(() => parseFlashcards('{"cards": [{"question": "Q"}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
    expect(() => parseFlashcards('{"cards": [{"question": "Q", "answer": null}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects card with whitespace-only question or answer', () => {
    expect(() => parseFlashcards('{"cards": [{"question": "   ", "answer": "Valid"}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
    expect(() => parseFlashcards('{"cards": [{"question": "Valid", "answer": "   "}]}')).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects card exceeding maximum question length', () => {
    const tooLongQ = 'Q'.repeat(MAX_QUESTION_LENGTH + 1);
    expect(() => parseFlashcards(JSON.stringify({
      cards: [{ question: tooLongQ, answer: 'Valid' }],
    }))).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects card exceeding maximum answer length', () => {
    const tooLongA = 'A'.repeat(MAX_ANSWER_LENGTH + 1);
    expect(() => parseFlashcards(JSON.stringify({
      cards: [{ question: 'Valid', answer: tooLongA }],
    }))).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });

  test('rejects response generating more than MAX_CARDS (100)', () => {
    const manyCards = Array.from({ length: MAX_CARDS + 1 }, (_, i) => ({
      question: `Q${i}`,
      answer: `A${i}`,
    }));
    expect(() => parseFlashcards(JSON.stringify({ cards: manyCards }))).toThrow(expect.objectContaining({
      code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
    }));
  });
});