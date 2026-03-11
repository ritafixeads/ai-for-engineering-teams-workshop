'use client';

import { useState } from 'react';
import {
  calculateHealthScore,
  HealthScoreInputs,
  HealthScoreResult,
  DEFAULT_PAYMENT_DATA,
  DEFAULT_ENGAGEMENT_DATA,
  DEFAULT_CONTRACT_DATA,
  DEFAULT_SUPPORT_DATA,
} from '../lib/healthCalculator';

interface CustomerHealthDisplayProps {
  /** Pass health score inputs directly, or omit to use neutral defaults */
  inputs?: Partial<HealthScoreInputs>;
  /** Optional customer name shown in the widget header */
  customerName?: string;
}

const riskStyles: Record<HealthScoreResult['riskLevel'], string> = {
  Healthy: 'bg-green-100 text-green-700',
  Warning: 'bg-yellow-100 text-yellow-700',
  Critical: 'bg-red-100 text-red-700',
};

const ringStyles: Record<HealthScoreResult['riskLevel'], string> = {
  Healthy: 'text-green-600',
  Warning: 'text-yellow-500',
  Critical: 'text-red-600',
};

const factorLabels: Record<string, string> = {
  payment: 'Payment',
  engagement: 'Engagement',
  contract: 'Contract',
  support: 'Support',
};

const factorWeights: Record<string, string> = {
  payment: '40%',
  engagement: '30%',
  contract: '20%',
  support: '10%',
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 71 ? 'bg-green-500' :
    score >= 31 ? 'bg-yellow-400' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

export default function CustomerHealthDisplay({
  inputs,
  customerName,
}: CustomerHealthDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate on first render
  if (result === null && error === null) {
    try {
      const resolved: HealthScoreInputs = {
        payment: inputs?.payment ?? DEFAULT_PAYMENT_DATA,
        engagement: inputs?.engagement ?? DEFAULT_ENGAGEMENT_DATA,
        contract: inputs?.contract ?? DEFAULT_CONTRACT_DATA,
        support: inputs?.support ?? DEFAULT_SUPPORT_DATA,
      };
      setResult(calculateHealthScore(resolved));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to calculate health score');
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
        <p className="text-sm text-red-700 font-medium">Health score unavailable</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          {customerName && (
            <p className="text-xs text-gray-500 mb-0.5">{customerName}</p>
          )}
          <h3 className="font-semibold text-gray-900">Health Score</h3>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${riskStyles[result.riskLevel]}`}
        >
          {result.riskLevel}
        </span>
      </div>

      <div className={`text-5xl font-bold mb-4 ${ringStyles[result.riskLevel]}`}>
        {result.score}
        <span className="text-lg text-gray-400 font-normal">/100</span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
        aria-expanded={expanded}
      >
        {expanded ? 'Hide breakdown' : 'Show breakdown'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t pt-3">
          {Object.entries(result.breakdown).map(([key, score]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{factorLabels[key]}</span>
                <span className="text-gray-400">weight {factorWeights[key]}</span>
              </div>
              <ScoreBar score={score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
