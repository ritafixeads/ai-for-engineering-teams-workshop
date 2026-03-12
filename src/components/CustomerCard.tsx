'use client';

import { memo } from 'react';
import { Customer } from '../data/mock-customers';

export interface CustomerCardProps {
  customer: Customer;
  /** Whether this card is currently selected; controls ring + background styles. */
  isSelected?: boolean;
  /** Called with the customer when the card is clicked or activated via keyboard. */
  onSelect?: (customer: Customer) => void;
}

interface HealthBadge {
  label: string;
  badgeClass: string;
  dotClass: string;
}

function getHealthBadge(score: number): HealthBadge {
  if (score <= 30) {
    return {
      label: 'Poor',
      badgeClass: 'bg-red-100 text-red-700',
      dotClass: 'bg-red-500',
    };
  } else if (score <= 70) {
    return {
      label: 'Moderate',
      badgeClass: 'bg-yellow-100 text-yellow-700',
      dotClass: 'bg-yellow-500',
    };
  } else {
    return {
      label: 'Good',
      badgeClass: 'bg-green-100 text-green-700',
      dotClass: 'bg-green-500',
    };
  }
}

/**
 * Clamps a health score to the valid 0–100 range defensively,
 * guarding against data outside the expected bounds.
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * CustomerCard is wrapped with React.memo so that it only re-renders when its
 * own props change, preventing cascade re-renders from unrelated parent state.
 */
const CustomerCard = memo(function CustomerCard({ customer, isSelected = false, onSelect }: CustomerCardProps) {
  const score = clampScore(customer.healthScore);
  const { label, badgeClass, dotClass } = getHealthBadge(score);
  const domains = customer.domains ?? [];
  const isInteractive = typeof onSelect === 'function';

  const handleClick = () => {
    onSelect?.(customer);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect?.(customer);
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? isSelected : undefined}
      aria-label={
        isInteractive
          ? `Select ${customer.name} at ${customer.company}`
          : undefined
      }
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={[
        'rounded-lg shadow p-4 w-full max-w-[400px] min-h-[120px]',
        'flex flex-col gap-3',
        'transition-shadow transition-colors duration-150',
        isSelected
          ? 'bg-blue-50 ring-2 ring-blue-500'
          : 'bg-white',
        isInteractive && !isSelected
          ? 'cursor-pointer hover:shadow-md hover:ring-1 hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400'
          : '',
        isInteractive && isSelected
          ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header: name, company, health badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate leading-snug">
            {customer.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">{customer.company}</p>
          {customer.email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {customer.email}
            </p>
          )}
        </div>

        {/* Health score badge */}
        <span
          className={[
            'shrink-0 inline-flex items-center gap-1.5 text-xs font-medium',
            'px-2.5 py-1 rounded-full whitespace-nowrap',
            badgeClass,
          ].join(' ')}
          aria-label={`Health score: ${score} out of 100 — ${label}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
            aria-hidden="true"
          />
          <span aria-hidden="true" className="tabular-nums">
            {score}
          </span>
          <span>{label}</span>
        </span>
      </div>

      {/* Domains */}
      {domains.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          {domains.length > 1 && (
            <p className="text-xs text-gray-400 mb-1">
              {domains.length} domains
            </p>
          )}
          <ul className="space-y-0.5" aria-label="Customer domains">
            {domains.map((domain) => (
              <li
                key={domain}
                className="text-xs font-mono text-gray-600 truncate"
                title={domain}
              >
                {domain}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default CustomerCard;
