// ─── Types ────────────────────────────────────────────────────────────────────

export interface Headline {
  title: string;
  source: string;
  publishedAt: string; // ISO 8601
  url: string;
}

export interface MarketIntelligenceResponse {
  company: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0–100
  newsCount: number;
  lastUpdated: string; // ISO 8601
  headlines: Headline[];
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class MarketIntelligenceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'MarketIntelligenceError';
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: MarketIntelligenceResponse;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, CacheEntry>();

function cacheKey(company: string): string {
  return company.toLowerCase().trim();
}

// ─── Mock Data Generation ─────────────────────────────────────────────────────

const SOURCES = ['Reuters', 'Bloomberg', 'Financial Times', 'TechCrunch', 'WSJ', 'Forbes'];

const POSITIVE_HEADLINES = [
  '{company} reports record quarterly revenue',
  '{company} expands into three new markets',
  '{company} secures $50M Series C funding',
  '{company} launches AI-powered product suite',
  'Analysts upgrade {company} to strong buy',
  '{company} partnership with Google drives growth',
];

const NEUTRAL_HEADLINES = [
  '{company} announces leadership transition',
  '{company} to hold annual investor day next month',
  '{company} releases Q3 earnings in line with expectations',
  '{company} updates terms of service for enterprise clients',
  '{company} hiring freeze amid market uncertainty',
];

const NEGATIVE_HEADLINES = [
  '{company} misses revenue targets for second quarter',
  '{company} faces regulatory scrutiny in EU market',
  '{company} layoffs affect 8% of workforce',
  'Analysts downgrade {company} amid slowing growth',
  '{company} loses key enterprise contract',
];

/**
 * Generates a stable pseudo-random number in [0, 1) seeded by a string.
 * Same input always produces the same output within a cache window.
 */
function seededRandom(seed: string, offset = 0): number {
  let hash = offset;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function pickSentiment(company: string): 'positive' | 'neutral' | 'negative' {
  const r = seededRandom(company, 7);
  if (r > 0.55) return 'positive';
  if (r > 0.25) return 'neutral';
  return 'negative';
}

function generateHeadlines(company: string, sentiment: 'positive' | 'neutral' | 'negative'): Headline[] {
  const pool =
    sentiment === 'positive' ? POSITIVE_HEADLINES :
    sentiment === 'negative' ? NEGATIVE_HEADLINES :
    NEUTRAL_HEADLINES;

  const now = Date.now();
  return Array.from({ length: 3 }, (_, i) => {
    const idx = Math.floor(seededRandom(company, i * 13) * pool.length);
    const sourceIdx = Math.floor(seededRandom(company, i * 17) * SOURCES.length);
    const daysAgo = Math.floor(seededRandom(company, i * 11) * 5);
    return {
      title: pool[idx].replace('{company}', company),
      source: SOURCES[sourceIdx],
      publishedAt: new Date(now - daysAgo * 86_400_000).toISOString(),
      url: '#',
    };
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class MarketIntelligenceService {
  /**
   * Returns market intelligence data for the given company.
   * Results are cached for 10 minutes keyed by normalised company name.
   */
  static async getMarketData(company: string): Promise<MarketIntelligenceResponse> {
    const key = cacheKey(company);
    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = MarketIntelligenceService.generateData(company);
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }

  /** Pure data generation — deterministic for a given company name. */
  static generateData(company: string): MarketIntelligenceResponse {
    const sentiment = pickSentiment(company);
    const sentimentScore =
      sentiment === 'positive' ? Math.round(65 + seededRandom(company, 3) * 35) :
      sentiment === 'negative' ? Math.round(seededRandom(company, 3) * 35) :
      Math.round(35 + seededRandom(company, 3) * 30);

    const headlines = generateHeadlines(company, sentiment);
    const newsCount = Math.floor(5 + seededRandom(company, 19) * 20);

    return {
      company,
      sentiment,
      sentimentScore,
      newsCount,
      lastUpdated: new Date().toISOString(),
      headlines,
    };
  }
}
