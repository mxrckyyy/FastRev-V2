import defaultFallbackEngine from './fallbackEngine.js';

/**
 * High-level AI service orchestrating provider fallback, cooldowns, and response validation.
 */
export async function generateFlashcards(material, options = {}) {
  return defaultFallbackEngine.generateFlashcards(material, options);
}

export { defaultFallbackEngine as fallbackEngine };
export default {
  generateFlashcards,
  fallbackEngine: defaultFallbackEngine,
};