'use client';

import { useMemo, useState } from 'react';
import { evaluateAlerts, Alert, CustomerWithMetrics } from '../lib/alerts';

export interface PredictiveAlertsWidgetProps {
  customers: CustomerWithMetrics[];
  loading?: boolean;
}

const PRIORITY_BADGE: Record<Alert['priority'], string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
};

const PRIORITY_LABEL: Record<Alert['priority'], string> = {
  high: 'High',
  medium: 'Medium',
};

const ALERT_TYPE_LABEL: Record<Alert['type'], string> = {
  PaymentRisk: 'Payment Risk',
  EngagementCliff: 'Engagement Cliff',
  ContractExpirationRisk: 'Contract Expiration Risk',
  SupportTicketSpike: 'Support Ticket Spike',
  FeatureAdoptionStall: 'Feature Adoption Stall',
};

type AlertUIState = 'active' | 'resolved';

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse motion-reduce:animate-none">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  uiState,
  onDismiss,
  onResolve,
}: {
  alert: Alert;
  uiState: AlertUIState;
  onDismiss: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const resolved = uiState === 'resolved';

  return (
    <li
      className={[
        'flex flex-col gap-2 rounded-lg border p-3 text-sm transition-opacity',
        resolved
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className={[
              'font-medium text-gray-900',
              resolved ? 'line-through text-gray-400' : '',
            ].join(' ')}
          >
            {alert.customerName}
          </span>
          <span className="text-gray-500 ml-1 text-xs">· {alert.company}</span>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[alert.priority]}`}
          aria-label={`Priority: ${PRIORITY_LABEL[alert.priority]}`}
        >
          <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${alert.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          {PRIORITY_LABEL[alert.priority]}
        </span>
      </div>

      {/* Alert type + description */}
      <div>
        <p className="text-xs font-semibold text-gray-700">{ALERT_TYPE_LABEL[alert.type]}</p>
        <p className={`text-xs mt-0.5 ${resolved ? 'text-gray-400' : 'text-gray-600'}`}>
          {alert.description}
        </p>
      </div>

      {/* Actions */}
      {!resolved && (
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => onResolve(alert.id)}
            aria-label={`Mark resolved: ${alert.customerName} — ${ALERT_TYPE_LABEL[alert.type]}`}
            className="text-xs text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1"
          >
            Mark Resolved
          </button>
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            aria-label={`Dismiss alert: ${alert.customerName} — ${ALERT_TYPE_LABEL[alert.type]}`}
            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </li>
  );
}

export default function PredictiveAlertsWidget({
  customers,
  loading = false,
}: PredictiveAlertsWidgetProps) {
  // dismissed = removed from view; resolved = muted/strikethrough
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const allAlerts = useMemo(() => evaluateAlerts(customers), [customers]);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((a) => !dismissed.has(a.id)),
    [allAlerts, dismissed],
  );

  const highAlerts = visibleAlerts.filter((a) => a.priority === 'high');
  const mediumAlerts = visibleAlerts.filter((a) => a.priority === 'medium');

  const handleDismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  const handleResolve = (id: string) =>
    setResolved((prev) => new Set([...prev, id]));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <h3 className="font-semibold text-gray-900 mb-4">Predictive Alerts</h3>

      {/* Live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {`${visibleAlerts.length} active alert${visibleAlerts.length !== 1 ? 's' : ''}`}
      </div>

      {visibleAlerts.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No active alerts — all customers are healthy 🎉
        </p>
      ) : (
        <div className="space-y-6">
          {highAlerts.length > 0 && (
            <section aria-labelledby="high-priority-heading">
              <h4
                id="high-priority-heading"
                className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2"
              >
                High Priority
              </h4>
              <ul role="list" className="space-y-2">
                {highAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    uiState={resolved.has(alert.id) ? 'resolved' : 'active'}
                    onDismiss={handleDismiss}
                    onResolve={handleResolve}
                  />
                ))}
              </ul>
            </section>
          )}

          {mediumAlerts.length > 0 && (
            <section aria-labelledby="medium-priority-heading">
              <h4
                id="medium-priority-heading"
                className="text-xs font-semibold uppercase tracking-wide text-yellow-600 mb-2"
              >
                Medium Priority
              </h4>
              <ul role="list" className="space-y-2">
                {mediumAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    uiState={resolved.has(alert.id) ? 'resolved' : 'active'}
                    onDismiss={handleDismiss}
                    onResolve={handleResolve}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
