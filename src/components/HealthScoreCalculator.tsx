'use client';

import { useState, useEffect } from 'react';
import {
  calculateHealthScore,
  HealthScoreInputs,
  HealthScoreResult,
  HealthScoreValidationError,
  DEFAULT_PAYMENT_DATA,
  DEFAULT_ENGAGEMENT_DATA,
  DEFAULT_CONTRACT_DATA,
  DEFAULT_SUPPORT_DATA,
} from '../lib/healthCalculator';

interface HealthScoreCalculatorProps {
  /** Health score inputs for the selected customer. Omit any factor to use neutral defaults. */
  inputs?: Partial<HealthScoreInputs>;
  /** Customer name shown in the widget header */
  customerName?: string;
}

const riskBadgeStyles: Record<HealthScoreResult['riskLevel'], string> = {
  Healthy: 'bg-green-100 text-green-700',
  Warning: 'bg-yellow-100 text-yellow-700',
  Critical: 'bg-red-100 text-red-700',
};

const scoreTextStyles: Record<HealthScoreResult['riskLevel'], string> = {
  Healthy: 'text-green-600',
  Warning: 'text-yellow-500',
  Critical: 'text-red-600',
};

const barStyles = (score: number) =>
  score >= 71 ? 'bg-green-500' : score >= 31 ? 'bg-yellow-400' : 'bg-red-500';

const FACTOR_LABELS: Record<keyof HealthScoreResult['breakdown'], string> = {
  payment: 'Payment History',
  engagement: 'Engagement',
  contract: 'Contract Status',
  support: 'Support Satisfaction',
};

const FACTOR_WEIGHTS: Record<keyof HealthScoreResult['breakdown'], string> = {
  payment: '40%',
  engagement: '30%',
  contract: '20%',
  support: '10%',
};

function FactorBar({ label, weight, score }: { label: string; weight: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="text-gray-400">weight {weight}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barStyles(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 w-8 text-right tabular-nums">
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

export default function HealthScoreCalculator({
  inputs,
  customerName,
}: HealthScoreCalculatorProps) {
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const resolved: HealthScoreInputs = {
        payment: inputs?.payment ?? DEFAULT_PAYMENT_DATA,
        engagement: inputs?.engagement ?? DEFAULT_ENGAGEMENT_DATA,
        contract: inputs?.contract ?? DEFAULT_CONTRACT_DATA,
        support: inputs?.support ?? DEFAULT_SUPPORT_DATA,
      };
      setResult(calculateHealthScore(resolved));
    } catch (e) {
      setError(
        e instanceof HealthScoreValidationError
          ? e.message
          : 'Failed to calculate health score'
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-12 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-3 bg-gray-200 rounded w-1/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
        <p className="text-sm text-red-700 font-medium">Health score unavailable</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {customerName && (
            <p className="text-xs text-gray-500 mb-0.5">{customerName}</p>
          )}
          <h3 className="font-semibold text-gray-900">Health Score</h3>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskBadgeStyles[result.riskLevel]}`}
          aria-label={`Risk level: ${result.riskLevel}`}
        >
          {result.riskLevel}
        </span>
      </div>

      {/* Score */}
      <div className={`text-5xl font-bold mb-4 ${scoreTextStyles[result.riskLevel]}`}>
        {result.score}
        <span className="text-lg text-gray-400 font-normal">/100</span>
      </div>

      {/* Breakdown toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
        aria-expanded={expanded}
        aria-controls="health-breakdown"
      >
        {expanded ? 'Hide breakdown' : 'Show breakdown'}
      </button>

      {/* Factor breakdown */}
      {expanded && (
        <div id="health-breakdown" className="mt-3 space-y-3 border-t pt-3">
          {(Object.keys(result.breakdown) as Array<keyof typeof result.breakdown>).map((key) => (
            <FactorBar
              key={key}
              label={FACTOR_LABELS[key]}
              weight={FACTOR_WEIGHTS[key]}
              score={result.breakdown[key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
