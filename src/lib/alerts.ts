import { Customer } from '../data/mock-customers';

// ── Types ────────────────────────────────────────────────────────────────────

export type AlertPriority = 'high' | 'medium';

export type AlertType =
  | 'PaymentRisk'
  | 'EngagementCliff'
  | 'ContractExpirationRisk'
  | 'SupportTicketSpike'
  | 'FeatureAdoptionStall';

export interface Alert {
  id: string;           // unique per (customerId, alertType)
  customerId: string;
  customerName: string;
  company: string;
  type: AlertType;
  priority: AlertPriority;
  description: string;  // human-readable trigger summary
  triggeredAt: string;  // ISO 8601
  cooldownUntil: string; // ISO 8601; no re-fire before this time
}

export interface CustomerWithMetrics extends Customer {
  healthScoreDelta7d: number;   // positive = improving
  loginFrequencyPerMonth: number;
  loginFrequency30dAvg: number;
  daysSinceLastPayment: number;
  supportTicketsLast7Days: number;
  escalationCount: number;
  daysUntilRenewal: number;
  daysSinceLastFeatureUse: number;
  accountGrowthRate: number;    // positive = growing ARR
  arr: number;                  // annual recurring revenue
}

// ── Rule implementations ─────────────────────────────────────────────────────

function makeId(customerId: string, type: AlertType): string {
  return `${customerId}:${type}`;
}

function makeAlert(
  customer: CustomerWithMetrics,
  type: AlertType,
  priority: AlertPriority,
  description: string,
  now: Date,
  cooldownHours = 24,
): Alert {
  const cooldown = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000);
  return {
    id: makeId(customer.id, type),
    customerId: customer.id,
    customerName: customer.name,
    company: customer.company,
    type,
    priority,
    description,
    triggeredAt: now.toISOString(),
    cooldownUntil: cooldown.toISOString(),
  };
}

function evaluatePaymentRisk(c: CustomerWithMetrics, now: Date): Alert | null {
  if (c.daysSinceLastPayment > 30) {
    return makeAlert(c, 'PaymentRisk', 'high',
      `No payment recorded in ${c.daysSinceLastPayment} days.`, now);
  }
  if (c.healthScoreDelta7d < -20) {
    return makeAlert(c, 'PaymentRisk', 'high',
      `Health score dropped ${Math.abs(c.healthScoreDelta7d)} points in the last 7 days.`, now);
  }
  return null;
}

function evaluateEngagementCliff(c: CustomerWithMetrics, now: Date): Alert | null {
  if (c.loginFrequency30dAvg > 0 &&
      c.loginFrequencyPerMonth < c.loginFrequency30dAvg * 0.5) {
    const dropPct = Math.round(
      ((c.loginFrequency30dAvg - c.loginFrequencyPerMonth) / c.loginFrequency30dAvg) * 100,
    );
    return makeAlert(c, 'EngagementCliff', 'high',
      `Login frequency dropped ${dropPct}% vs 30-day average (${c.loginFrequency30dAvg} → ${c.loginFrequencyPerMonth}/month).`, now);
  }
  return null;
}

function evaluateContractExpirationRisk(c: CustomerWithMetrics, now: Date): Alert | null {
  if (c.daysUntilRenewal < 90 && c.healthScore < 50) {
    return makeAlert(c, 'ContractExpirationRisk', 'high',
      `Renewal in ${c.daysUntilRenewal} days with health score ${c.healthScore}/100.`, now);
  }
  return null;
}

function evaluateSupportTicketSpike(c: CustomerWithMetrics, now: Date): Alert | null {
  if (c.supportTicketsLast7Days > 3 || c.escalationCount > 0) {
    const reason = c.escalationCount > 0
      ? `${c.escalationCount} escalation(s) and ${c.supportTicketsLast7Days} tickets in the last 7 days.`
      : `${c.supportTicketsLast7Days} support tickets opened in the last 7 days.`;
    return makeAlert(c, 'SupportTicketSpike', 'medium', reason, now);
  }
  return null;
}

function evaluateFeatureAdoptionStall(c: CustomerWithMetrics, now: Date): Alert | null {
  if (c.daysSinceLastFeatureUse > 30 && c.accountGrowthRate > 0) {
    return makeAlert(c, 'FeatureAdoptionStall', 'medium',
      `No feature activity for ${c.daysSinceLastFeatureUse} days despite ${Math.round(c.accountGrowthRate * 100)}% ARR growth.`, now);
  }
  return null;
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Evaluates all alert rules against every customer and returns a
 * deduplicated, priority-sorted list of active alerts.
 *
 * @param customers - customers with their risk metrics
 * @param now       - current timestamp (injected for testability; defaults to new Date())
 */
export function evaluateAlerts(
  customers: CustomerWithMetrics[],
  now: Date = new Date(),
): Alert[] {
  const seen = new Set<string>();
  const alerts: Alert[] = [];

  for (const customer of customers) {
    const candidates = [
      evaluatePaymentRisk(customer, now),
      evaluateEngagementCliff(customer, now),
      evaluateContractExpirationRisk(customer, now),
      evaluateSupportTicketSpike(customer, now),
      evaluateFeatureAdoptionStall(customer, now),
    ];

    for (const alert of candidates) {
      if (alert && !seen.has(alert.id)) {
        seen.add(alert.id);
        alerts.push(alert);
      }
    }
  }

  // Sort: High before Medium; within same priority, higher ARR first
  const priorityOrder: Record<AlertPriority, number> = { high: 0, medium: 1 };
  const arrByCustomer = new Map(customers.map((c) => [c.id, c.arr]));

  alerts.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return (arrByCustomer.get(b.customerId) ?? 0) - (arrByCustomer.get(a.customerId) ?? 0);
  });

  return alerts;
}
