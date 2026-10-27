import { CooldownManager } from '../../src/services/ai/cooldownManager.js';

describe('CooldownManager', () => {
  let currentTime = 1000000;
  const mockClock = () => currentTime;
  let manager;

  beforeEach(() => {
    currentTime = 1000000;
    manager = new CooldownManager({ clock: mockClock, defaultDurationMs: 60000 });
  });

  test('reports false for provider that is not in cooldown', () => {
    expect(manager.isCoolingDown('groq')).toBe(false);
    expect(manager.getRemainingMs('groq')).toBe(0);
  });

  test('sets and verifies cooldown for a provider', () => {
    manager.setCooldown('groq', 60000);
    expect(manager.isCoolingDown('groq')).toBe(true);
    expect(manager.getRemainingMs('groq')).toBe(60000);
  });

  test('is case-insensitive for provider identifiers', () => {
    manager.setCooldown('Groq', 60000);
    expect(manager.isCoolingDown('groq')).toBe(true);
    expect(manager.isCoolingDown('GROQ')).toBe(true);
  });

  test('expires cooldown after elapsed time', () => {
    manager.setCooldown('groq', 60000);
    expect(manager.isCoolingDown('groq')).toBe(true);

    // Advance clock by 30 seconds
    currentTime += 30000;
    expect(manager.isCoolingDown('groq')).toBe(true);
    expect(manager.getRemainingMs('groq')).toBe(30000);

    // Advance clock past expiration
    currentTime += 30001;
    expect(manager.isCoolingDown('groq')).toBe(false);
    expect(manager.getRemainingMs('groq')).toBe(0);
  });

  test('tracks multiple providers independently', () => {
    manager.setCooldown('groq', 30000);
    manager.setCooldown('cerebras', 60000);

    expect(manager.isCoolingDown('groq')).toBe(true);
    expect(manager.isCoolingDown('cerebras')).toBe(true);
    expect(manager.isCoolingDown('gemini')).toBe(false);

    // Advance 40s: groq expires, cerebras still cooling down
    currentTime += 40000;
    expect(manager.isCoolingDown('groq')).toBe(false);
    expect(manager.isCoolingDown('cerebras')).toBe(true);
  });

  test('clear() resets all active cooldowns', () => {
    manager.setCooldown('groq', 60000);
    manager.setCooldown('gemini', 60000);
    expect(manager.isCoolingDown('groq')).toBe(true);
    expect(manager.isCoolingDown('gemini')).toBe(true);

    manager.clear();
    expect(manager.isCoolingDown('groq')).toBe(false);
    expect(manager.isCoolingDown('gemini')).toBe(false);
  });
});