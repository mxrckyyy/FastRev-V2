// Shared test fixtures and mock data for E2E tests
// Based on actual backend API contracts

export const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
};

export const MOCK_USER = {
  id: '507f1f77bcf86cd799439011',
  email: TEST_USER.email,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImUyZS10ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDYwMDAwMDB9.test';

export const MOCK_DECKS = [
  {
    id: '507f1f77bcf86cd799439012',
    title: 'Biology 101',
    cardCount: 3,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: '507f1f77bcf86cd799439013',
    title: 'Chemistry Basics',
    cardCount: 5,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
];

export const MOCK_CARDS = [
  {
    id: '507f1f77bcf86cd799439014',
    question: 'What is the powerhouse of the cell?',
    answer: 'The mitochondria.',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: '507f1f77bcf86cd799439015',
    question: 'What is DNA?',
    answer: 'Deoxyribonucleic acid.',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
];

export const MOCK_GENERATE_RESPONSE = {
  deck: {
    id: '507f1f77bcf86cd799439016',
    title: 'Study Deck - 2026-01-15',
    cardCount: 2,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  cards: [
    { id: '507f1f77bcf86cd799439017', question: 'What is photosynthesis?', answer: 'The process by which plants convert sunlight into energy.' },
    { id: '507f1f77bcf86cd799439018', question: 'What is respiration?', answer: 'The process of breathing and gas exchange.' },
  ],
  generation: {
    id: '507f1f77bcf86cd799439019',
    provider: 'groq',
    latencyMs: 245,
  },
};

// Helper: set up API mocking for authenticated state
export async function mockAuthenticated(page) {
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: MOCK_USER }),
    });
  });
}

// Helper: set up API mocking for unauthenticated state (no token)
export async function mockUnauthenticated(page) {
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
    });
  });
}

// Helper: mock decks list
export async function mockDecksList(page, decks = MOCK_DECKS) {
  await page.route('**/api/decks', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ decks }),
      });
    } else {
      route.continue();
    }
  });
}

// Helper: mock empty decks
export async function mockEmptyDecks(page) {
  await mockDecksList(page, []);
}

// Helper: mock deck detail
export async function mockDeckDetail(page, deckId, cards = MOCK_CARDS) {
  await page.route(`**/api/decks/${deckId}`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deck: {
            id: deckId,
            title: 'Test Deck',
            cardCount: cards.length,
            createdAt: '2026-01-15T10:00:00.000Z',
            updatedAt: '2026-01-15T10:00:00.000Z',
          },
          cards,
        }),
      });
    } else {
      route.continue();
    }
  });
}

// Helper: mock deck not found
export async function mockDeckNotFound(page, deckId) {
  await page.route(`**/api/decks/${deckId}`, (route) => {
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Deck not found' } }),
    });
  });
}

// Helper: set auth token in localStorage
export async function setAuthToken(page) {
  await page.addInitScript(() => {
    localStorage.setItem('fastrev_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImUyZS10ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDYwMDAwMDB9.test');
    localStorage.setItem('fastrev_user', JSON.stringify({ id: '507f1f77bcf86cd799439011', email: 'e2e-test@example.com', createdAt: '2026-01-01T00:00:00.000Z' }));
  });
}
