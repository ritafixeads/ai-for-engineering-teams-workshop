import { describe, it, expect } from 'vitest';
import { evaluateAlerts, CustomerWithMetrics } from './alerts';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2024-06-01T12:00:00Z');

function baseCustomer(overrides: Partial<CustomerWithMetrics> = {}): CustomerWithMetrics {
  return {
    id: 'c1',
    name: 'Test User',
    company: 'Test Co',
    healthScore: 80,
    healthScoreDelta7d: 0,
    loginFrequencyPerMonth: 20,
    loginFrequency30dAvg: 20,
    daysSinceLastPayment: 5,
    supportTicketsLast7Days: 0,
    escalationCount: 0,
    daysUntilRenewal: 200,
    daysSinceLastFeatureUse: 5,
    accountGrowthRate: 0,
    arr: 10_000,
    ...overrides,
  };
}

// ── PaymentRisk ───────────────────────────────────────────────────────────────

describe('PaymentRisk alert', () => {
  it('fires when daysSinceLastPayment > 30', () => {
    const alerts = evaluateAlerts([baseCustomer({ daysSinceLastPayment: 31 })], NOW);
    expect(alerts.some((a) => a.type === 'PaymentRisk')).toBe(true);
  });

  it('does not fire when daysSinceLastPayment is exactly 30', () => {
    const alerts = evaluateAlerts([baseCustomer({ daysSinceLastPayment: 30 })], NOW);
    expect(alerts.some((a) => a.type === 'PaymentRisk')).toBe(false);
  });

  it('fires when health score dropped > 20 points in 7 days', () => {
    const alerts = evaluateAlerts([baseCustomer({ healthScoreDelta7d: -21 })], NOW);
    expect(alerts.some((a) => a.type === 'PaymentRisk')).toBe(true);
  });

  it('does not fire when health delta is exactly -20', () => {
    const alerts = evaluateAlerts([baseCustomer({ healthScoreDelta7d: -20 })], NOW);
    expect(alerts.some((a) => a.type === 'PaymentRisk')).toBe(false);
  });

  it('is high priority', () => {
    const alerts = evaluateAlerts([baseCustomer({ daysSinceLastPayment: 31 })], NOW);
    const alert = alerts.find((a) => a.type === 'PaymentRisk');
    expect(alert?.priority).toBe('high');
  });
});

// ── EngagementCliff ───────────────────────────────────────────────────────────

describe('EngagementCliff alert', () => {
  it('fires when login frequency dropped > 50% vs 30-day average', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ loginFrequencyPerMonth: 9, loginFrequency30dAvg: 20 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'EngagementCliff')).toBe(true);
  });

  it('does not fire when drop is exactly 50%', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ loginFrequencyPerMonth: 10, loginFrequency30dAvg: 20 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'EngagementCliff')).toBe(false);
  });

  it('does not fire when 30-day average is 0 (avoids division by zero)', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ loginFrequencyPerMonth: 0, loginFrequency30dAvg: 0 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'EngagementCliff')).toBe(false);
  });

  it('is high priority', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ loginFrequencyPerMonth: 1, loginFrequency30dAvg: 20 })],
      NOW,
    );
    const alert = alerts.find((a) => a.type === 'EngagementCliff');
    expect(alert?.priority).toBe('high');
  });
});

// ── ContractExpirationRisk ────────────────────────────────────────────────────

describe('ContractExpirationRisk alert', () => {
  it('fires when daysUntilRenewal < 90 AND healthScore < 50', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysUntilRenewal: 89, healthScore: 49 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'ContractExpirationRisk')).toBe(true);
  });

  it('does not fire when healthScore >= 50', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysUntilRenewal: 89, healthScore: 50 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'ContractExpirationRisk')).toBe(false);
  });

  it('does not fire when daysUntilRenewal >= 90', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysUntilRenewal: 90, healthScore: 30 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'ContractExpirationRisk')).toBe(false);
  });

  it('is high priority', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysUntilRenewal: 30, healthScore: 20 })],
      NOW,
    );
    const alert = alerts.find((a) => a.type === 'ContractExpirationRisk');
    expect(alert?.priority).toBe('high');
  });
});

// ── SupportTicketSpike ────────────────────────────────────────────────────────

describe('SupportTicketSpike alert', () => {
  it('fires when supportTicketsLast7Days > 3', () => {
    const alerts = evaluateAlerts([baseCustomer({ supportTicketsLast7Days: 4 })], NOW);
    expect(alerts.some((a) => a.type === 'SupportTicketSpike')).toBe(true);
  });

  it('does not fire when tickets are exactly 3 and no escalations', () => {
    const alerts = evaluateAlerts([baseCustomer({ supportTicketsLast7Days: 3 })], NOW);
    expect(alerts.some((a) => a.type === 'SupportTicketSpike')).toBe(false);
  });

  it('fires when escalationCount > 0, even with few tickets', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ supportTicketsLast7Days: 1, escalationCount: 1 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'SupportTicketSpike')).toBe(true);
  });

  it('is medium priority', () => {
    const alerts = evaluateAlerts([baseCustomer({ supportTicketsLast7Days: 5 })], NOW);
    const alert = alerts.find((a) => a.type === 'SupportTicketSpike');
    expect(alert?.priority).toBe('medium');
  });
});

// ── FeatureAdoptionStall ──────────────────────────────────────────────────────

describe('FeatureAdoptionStall alert', () => {
  it('fires when daysSinceLastFeatureUse > 30 AND accountGrowthRate > 0', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysSinceLastFeatureUse: 31, accountGrowthRate: 0.1 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'FeatureAdoptionStall')).toBe(true);
  });

  it('does not fire for non-growing accounts (accountGrowthRate = 0)', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysSinceLastFeatureUse: 60, accountGrowthRate: 0 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'FeatureAdoptionStall')).toBe(false);
  });

  it('does not fire when daysSinceLastFeatureUse <= 30', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysSinceLastFeatureUse: 30, accountGrowthRate: 0.5 })],
      NOW,
    );
    expect(alerts.some((a) => a.type === 'FeatureAdoptionStall')).toBe(false);
  });

  it('is medium priority', () => {
    const alerts = evaluateAlerts(
      [baseCustomer({ daysSinceLastFeatureUse: 45, accountGrowthRate: 0.2 })],
      NOW,
    );
    const alert = alerts.find((a) => a.type === 'FeatureAdoptionStall');
    expect(alert?.priority).toBe('medium');
  });
});

// ── Deduplication & sorting ───────────────────────────────────────────────────

describe('deduplication', () => {
  it('produces only one alert per (customerId, alertType) even if two rules match', () => {
    // Both payment conditions fire for the same customer
    const customer = baseCustomer({ daysSinceLastPayment: 45, healthScoreDelta7d: -25 });
    const alerts = evaluateAlerts([customer], NOW);
    const paymentAlerts = alerts.filter((a) => a.type === 'PaymentRisk');
    expect(paymentAlerts.length).toBe(1);
  });

  it('allows the same alert type for different customers', () => {
    const c1 = baseCustomer({ id: 'c1', daysSinceLastPayment: 40 });
    const c2 = { ...baseCustomer({ id: 'c2', daysSinceLastPayment: 40 }), name: 'Other', company: 'Other Co' };
    const alerts = evaluateAlerts([c1, c2], NOW);
    const paymentAlerts = alerts.filter((a) => a.type === 'PaymentRisk');
    expect(paymentAlerts.length).toBe(2);
  });
});

describe('sorting', () => {
  it('places high-priority alerts before medium-priority alerts', () => {
    const customer = baseCustomer({
      daysSinceLastPayment: 40,      // high: PaymentRisk
      supportTicketsLast7Days: 5,    // medium: SupportTicketSpike
    });
    const alerts = evaluateAlerts([customer], NOW);
    const firstHigh = alerts.findIndex((a) => a.priority === 'high');
    const firstMedium = alerts.findIndex((a) => a.priority === 'medium');
    expect(firstHigh).toBeLessThan(firstMedium);
  });

  it('sorts within the same priority by ARR descending', () => {
    const highArr = baseCustomer({ id: 'c-high', daysSinceLastPayment: 40, arr: 50_000 });
    const lowArr = { ...baseCustomer({ id: 'c-low', daysSinceLastPayment: 40, arr: 5_000 }), name: 'Low', company: 'Low Co' };
    const alerts = evaluateAlerts([lowArr, highArr], NOW);
    const paymentAlerts = alerts.filter((a) => a.type === 'PaymentRisk');
    expect(paymentAlerts[0].customerId).toBe('c-high');
  });

  it('is a pure function: same inputs produce the same output', () => {
    const customers = [baseCustomer({ daysSinceLastPayment: 40 })];
    const r1 = evaluateAlerts(customers, NOW);
    const r2 = evaluateAlerts(customers, NOW);
    expect(r1).toEqual(r2);
  });
});
