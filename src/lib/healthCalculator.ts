// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentData {
  /** Days elapsed since the customer's most recent payment */
  daysSinceLastPayment: number;
  /** Average number of days payments arrive after their due date */
  averagePaymentDelayDays: number;
  /** Total overdue balance in currency units */
  overdueAmount: number;
}

export interface EngagementData {
  /** Number of logins recorded in the past 30 days */
  loginFrequencyPerMonth: number;
  /** Count of distinct product features used in the past 30 days */
  featureUsageCount: number;
  /** Open or recently opened support tickets */
  supportTicketCount: number;
}

export interface ContractData {
  /** Calendar days remaining until the contract renewal date */
  daysUntilRenewal: number;
  /** Annual contract value in currency units */
  contractValue: number;
  /** Whether the customer upgraded their plan in the last 90 days */
  recentUpgrade: boolean;
}

export interface SupportData {
  /** Mean time in days to resolve a support ticket */
  averageResolutionTimeDays: number;
  /** Customer satisfaction score on a 1–5 scale */
  satisfactionScore: number;
  /** Number of tickets escalated beyond first-line support */
  escalationCount: number;
}

export interface HealthScoreInputs {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}

export interface FactorBreakdown {
  payment: number;
  engagement: number;
  contract: number;
  support: number;
}

export interface HealthScoreResult {
  /** Final weighted health score clamped to [0, 100] */
  score: number;
  riskLevel: 'Healthy' | 'Warning' | 'Critical';
  breakdown: FactorBreakdown;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class HealthScoreValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HealthScoreValidationError';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clamps a value to [0, 100] */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Linearly maps `value` from [inMin, inMax] to [0, 100].
 * Values outside the input range are clamped.
 */
function normalize(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 50;
  return clamp(((value - inMin) / (inMax - inMin)) * 100);
}

function assertNonNegative(value: number, field: string): void {
  if (value < 0) {
    throw new HealthScoreValidationError(
      `${field} must be non-negative, received ${value}`
    );
  }
}

// ─── Factor Scoring ───────────────────────────────────────────────────────────

/**
 * Scores payment health on 0–100.
 *
 * Weighting rationale:
 * - Days since last payment: penalises inactivity heavily (normalised over 90 days)
 * - Average delay: chronic lateness signals cash-flow risk (normalised over 30 days)
 * - Overdue amount: absolute financial exposure (normalised over $10,000)
 * Each sub-factor contributes equally (1/3) before the final score is inverted
 * so that higher values mean better health.
 */
export function scorePayment(data: PaymentData): number {
  assertNonNegative(data.daysSinceLastPayment, 'daysSinceLastPayment');
  assertNonNegative(data.averagePaymentDelayDays, 'averagePaymentDelayDays');
  assertNonNegative(data.overdueAmount, 'overdueAmount');

  const recencyRisk = normalize(data.daysSinceLastPayment, 0, 90);
  const delayRisk = normalize(data.averagePaymentDelayDays, 0, 30);
  const overdueRisk = normalize(data.overdueAmount, 0, 10_000);

  const riskScore = (recencyRisk + delayRisk + overdueRisk) / 3;
  return clamp(100 - riskScore);
}

/**
 * Scores engagement health on 0–100.
 *
 * Weighting rationale:
 * - Logins (weight 0.4): core signal of active usage; normalised over 20/month
 * - Feature usage (weight 0.4): breadth of adoption reduces churn risk; normalised over 15
 * - Support tickets (weight 0.2, inverted): excessive tickets indicate friction;
 *   normalised over 10 tickets
 */
export function scoreEngagement(data: EngagementData): number {
  assertNonNegative(data.loginFrequencyPerMonth, 'loginFrequencyPerMonth');
  assertNonNegative(data.featureUsageCount, 'featureUsageCount');
  assertNonNegative(data.supportTicketCount, 'supportTicketCount');

  const loginScore = normalize(data.loginFrequencyPerMonth, 0, 20);
  const featureScore = normalize(data.featureUsageCount, 0, 15);
  const ticketPenalty = normalize(data.supportTicketCount, 0, 10);

  return clamp(loginScore * 0.4 + featureScore * 0.4 + (100 - ticketPenalty) * 0.2);
}

/**
 * Scores contract health on 0–100.
 *
 * Weighting rationale:
 * - Renewal proximity (weight 0.5): <30 days without an upgrade signals churn risk;
 *   score improves as renewal is farther away (normalised over 365 days)
 * - Contract value (weight 0.3): higher-value contracts receive more attention and
 *   tend to have lower churn; normalised over $50,000
 * - Recent upgrade (weight 0.2): an upgrade in the last 90 days is a strong
 *   commitment signal worth a flat 20-point bonus
 */
export function scoreContract(data: ContractData): number {
  assertNonNegative(data.daysUntilRenewal, 'daysUntilRenewal');
  assertNonNegative(data.contractValue, 'contractValue');

  const renewalScore = normalize(data.daysUntilRenewal, 0, 365);
  const valueScore = normalize(data.contractValue, 0, 50_000);
  const upgradeBonus = data.recentUpgrade ? 100 : 0;

  return clamp(renewalScore * 0.5 + valueScore * 0.3 + upgradeBonus * 0.2);
}

/**
 * Scores support health on 0–100.
 *
 * Weighting rationale:
 * - Satisfaction score (weight 0.5): direct customer sentiment; normalised from 1–5 to 0–100
 * - Resolution time (weight 0.3, inverted): slow resolution erodes trust;
 *   normalised over 7 days
 * - Escalation count (weight 0.2, inverted): escalations indicate unresolved frustration;
 *   normalised over 5 escalations
 */
export function scoreSupport(data: SupportData): number {
  if (data.satisfactionScore < 1 || data.satisfactionScore > 5) {
    throw new HealthScoreValidationError(
      `satisfactionScore must be between 1 and 5, received ${data.satisfactionScore}`
    );
  }
  assertNonNegative(data.averageResolutionTimeDays, 'averageResolutionTimeDays');
  assertNonNegative(data.escalationCount, 'escalationCount');

  const satisfactionScore = normalize(data.satisfactionScore, 1, 5);
  const resolutionPenalty = normalize(data.averageResolutionTimeDays, 0, 7);
  const escalationPenalty = normalize(data.escalationCount, 0, 5);

  return clamp(
    satisfactionScore * 0.5 +
    (100 - resolutionPenalty) * 0.3 +
    (100 - escalationPenalty) * 0.2
  );
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

/**
 * Calculates a weighted customer health score on a 0–100 scale.
 *
 * Weights reflect business priority:
 *   Payment (40%) > Engagement (30%) > Contract (20%) > Support (10%)
 *
 * Risk levels:
 *   Healthy  71–100
 *   Warning  31–70
 *   Critical  0–30
 */
export function calculateHealthScore(inputs: HealthScoreInputs): HealthScoreResult {
  const payment = scorePayment(inputs.payment);
  const engagement = scoreEngagement(inputs.engagement);
  const contract = scoreContract(inputs.contract);
  const support = scoreSupport(inputs.support);

  const score = clamp(
    Math.round(
      payment * 0.4 +
      engagement * 0.3 +
      contract * 0.2 +
      support * 0.1
    )
  );

  const riskLevel =
    score >= 71 ? 'Healthy' :
    score >= 31 ? 'Warning' :
    'Critical';

  return { score, riskLevel, breakdown: { payment, engagement, contract, support } };
}

// ─── Defaults for new / partial customers ─────────────────────────────────────

/**
 * Returns neutral input data (score ≈ 50) for customers with no history.
 * Use when a factor's data is unavailable rather than throwing.
 */
export const DEFAULT_PAYMENT_DATA: PaymentData = {
  daysSinceLastPayment: 30,
  averagePaymentDelayDays: 5,
  overdueAmount: 0,
};

export const DEFAULT_ENGAGEMENT_DATA: EngagementData = {
  loginFrequencyPerMonth: 8,
  featureUsageCount: 5,
  supportTicketCount: 2,
};

export const DEFAULT_CONTRACT_DATA: ContractData = {
  daysUntilRenewal: 180,
  contractValue: 10_000,
  recentUpgrade: false,
};

export const DEFAULT_SUPPORT_DATA: SupportData = {
  averageResolutionTimeDays: 2,
  satisfactionScore: 3,
  escalationCount: 0,
};
