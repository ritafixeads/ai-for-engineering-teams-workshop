'use client';

import { useState, useId } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChecklistCategory =
  | 'Keyboard Navigation'
  | 'Color & Contrast'
  | 'Screen Readers'
  | 'Focus Management'
  | 'Reduced Motion';

type ItemStatus = 'pass' | 'fail' | 'untested';

interface ChecklistItem {
  id: string;
  criterion: string;
  /** Short WCAG success criterion reference, e.g. "2.1.1" */
  wcag: string;
  description: string;
  status: ItemStatus;
}

interface ChecklistGroup {
  category: ChecklistCategory;
  items: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// Default checklist data derived from the WCAG 2.1 AA acceptance criteria
// ---------------------------------------------------------------------------

const DEFAULT_CHECKLIST: ChecklistGroup[] = [
  {
    category: 'Keyboard Navigation',
    items: [
      {
        id: 'kb-1',
        criterion: 'Interactive elements keyboard accessible',
        wcag: '2.1.1',
        description:
          'Every button, link, and interactive card is reachable via Tab and activatable via Enter or Space.',
        status: 'pass',
      },
      {
        id: 'kb-2',
        criterion: 'Tab order follows visual reading order',
        wcag: '2.4.3',
        description:
          'Tab order follows the visual reading order (left-to-right, top-to-bottom) on all pages.',
        status: 'pass',
      },
      {
        id: 'kb-3',
        criterion: 'No keyboard trap',
        wcag: '2.1.2',
        description:
          'Focus can leave every interactive region; modals/drawers trap focus internally but release it on close.',
        status: 'untested',
      },
      {
        id: 'kb-4',
        criterion: 'Form inputs have associated labels',
        wcag: '3.3.2',
        description:
          'All form inputs in AddCustomerForm and MarketIntelligenceWidget have associated <label> elements.',
        status: 'fail',
      },
      {
        id: 'kb-5',
        criterion: 'Error messages linked via aria-describedby',
        wcag: '3.3.1',
        description:
          'Form validation error messages are linked to their input via aria-describedby.',
        status: 'fail',
      },
    ],
  },
  {
    category: 'Color & Contrast',
    items: [
      {
        id: 'cc-1',
        criterion: 'Body text contrast ≥ 4.5:1',
        wcag: '1.4.3',
        description:
          'Body text contrast ratio is at least 4.5:1 against the background (verified via axe-core or WebAIM).',
        status: 'pass',
      },
      {
        id: 'cc-2',
        criterion: 'Large text contrast ≥ 3:1',
        wcag: '1.4.3',
        description:
          'Large text (≥ 18 pt or 14 pt bold) has a contrast ratio of at least 3:1.',
        status: 'pass',
      },
      {
        id: 'cc-3',
        criterion: 'UI components & focus indicators contrast ≥ 3:1',
        wcag: '1.4.11',
        description:
          'UI component boundaries and focus indicators have at least a 3:1 contrast ratio against adjacent background.',
        status: 'untested',
      },
      {
        id: 'cc-4',
        criterion: 'Color is not the sole conveyor of meaning',
        wcag: '1.4.1',
        description:
          'All health, sentiment, and alert badges convey meaning via text label, not color alone.',
        status: 'pass',
      },
    ],
  },
  {
    category: 'Screen Readers',
    items: [
      {
        id: 'sr-1',
        criterion: 'Dynamic content announced via live regions',
        wcag: '4.1.2',
        description:
          'Loading skeletons and toast notifications are announced by screen readers via role="status" or role="alert".',
        status: 'fail',
      },
      {
        id: 'sr-2',
        criterion: 'Icon-only buttons have aria-label',
        wcag: '1.1.1',
        description:
          'All icon-only buttons have a descriptive aria-label attribute.',
        status: 'pass',
      },
      {
        id: 'sr-3',
        criterion: 'Single h1 and logical heading hierarchy',
        wcag: '1.3.1',
        description:
          'The page has exactly one <h1> and a logical heading hierarchy (h2, h3, …).',
        status: 'pass',
      },
      {
        id: 'sr-4',
        criterion: 'Skip-to-content link present',
        wcag: '2.4.1',
        description:
          'Skip-to-content link is the first focusable element on every page and moves focus to <main>.',
        status: 'fail',
      },
    ],
  },
  {
    category: 'Focus Management',
    items: [
      {
        id: 'fm-1',
        criterion: 'Visible focus rings on all interactive elements',
        wcag: '2.4.7',
        description:
          'Focus rings are visible on all interactive elements; no outline: none without a custom replacement.',
        status: 'pass',
      },
      {
        id: 'fm-2',
        criterion: 'Focus ring contrast ≥ 3:1',
        wcag: '2.4.7',
        description:
          'Focus rings have a minimum 2 px solid outline with a 3:1 contrast ratio against adjacent background.',
        status: 'untested',
      },
      {
        id: 'fm-3',
        criterion: 'focus-visible used instead of focus',
        wcag: '2.4.7',
        description:
          'Tailwind focus-visible:ring-* classes are used (not focus:) so rings only appear on keyboard navigation.',
        status: 'untested',
      },
    ],
  },
  {
    category: 'Reduced Motion',
    items: [
      {
        id: 'rm-1',
        criterion: 'animate-spin suppressed with prefers-reduced-motion',
        wcag: '2.3.3',
        description:
          'Loading spinner (animate-spin) is suppressed when the OS prefers-reduced-motion: reduce setting is active.',
        status: 'fail',
      },
      {
        id: 'rm-2',
        criterion: 'animate-pulse suppressed with prefers-reduced-motion',
        wcag: '2.3.3',
        description:
          'Skeleton pulse animations (animate-pulse) are suppressed when prefers-reduced-motion: reduce is set.',
        status: 'fail',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pass: {
    label: 'Pass',
    badgeClass: 'bg-green-100 text-green-700',
    dotClass: 'bg-green-500',
  },
  fail: {
    label: 'Fail',
    badgeClass: 'bg-red-100 text-red-700',
    dotClass: 'bg-red-500',
  },
  untested: {
    label: 'Untested',
    badgeClass: 'bg-gray-100 text-gray-600',
    dotClass: 'bg-gray-400',
  },
};

/** Returns a Tailwind color class for the circular progress arc background. */
function progressColorClass(pct: number): string {
  if (pct >= 70) return 'text-green-600';
  if (pct >= 40) return 'text-yellow-500';
  return 'text-red-600';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: ItemStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const { label, badgeClass, dotClass } = STATUS_CONFIG[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs font-medium',
        'px-2 py-0.5 rounded-full whitespace-nowrap shrink-0',
        badgeClass,
      ].join(' ')}
    >
      {/* Decorative dot — hidden from assistive technology; the text label
          carries the meaning so color is never the sole indicator. */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  checked: boolean;
  onToggle: (id: string) => void;
  checkboxId: string;
}

function ChecklistItemRow({ item, checked, onToggle, checkboxId }: ChecklistItemRowProps) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={() => onToggle(item.id)}
          className={[
            'h-4 w-4 rounded border-gray-300 text-blue-600',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'cursor-pointer',
          ].join(' ')}
          aria-describedby={`${checkboxId}-desc`}
        />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <label
          htmlFor={checkboxId}
          className={[
            'text-sm font-medium cursor-pointer leading-snug',
            checked ? 'line-through text-gray-400' : 'text-gray-800',
          ].join(' ')}
        >
          {item.criterion}
          {/* WCAG reference inline */}
          <span className="ml-1.5 text-xs font-mono text-gray-400 not-italic">
            (WCAG {item.wcag})
          </span>
        </label>
        <p
          id={`${checkboxId}-desc`}
          className="text-xs text-gray-500 mt-0.5 leading-relaxed"
        >
          {item.description}
        </p>
      </div>

      {/* Status badge — always text + color, never color alone */}
      <StatusBadge status={item.status} />
    </li>
  );
}

interface CategoryGroupProps {
  group: ChecklistGroup;
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  legendId: string;
}

function CategoryGroup({ group, checkedIds, onToggle, legendId }: CategoryGroupProps) {
  const passCount = group.items.filter((i) => i.status === 'pass').length;
  const total = group.items.length;

  return (
    <fieldset
      className="border border-gray-200 rounded-lg overflow-hidden"
      aria-labelledby={legendId}
    >
      {/* legend renders as a visible group header */}
      <legend
        id={legendId}
        className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-800">
            {group.category}
          </span>
          <span
            className="text-xs text-gray-500"
            aria-label={`${passCount} of ${total} items passing in ${group.category}`}
          >
            {passCount}/{total} passing
          </span>
        </div>
      </legend>

      <ul className="px-4" role="list" aria-label={`${group.category} checklist items`}>
        {group.items.map((item) => {
          const checkboxId = `chk-${item.id}`;
          return (
            <ChecklistItemRow
              key={item.id}
              item={item}
              checked={checkedIds.has(item.id)}
              onToggle={onToggle}
              checkboxId={checkboxId}
            />
          );
        })}
      </ul>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Progress summary
// ---------------------------------------------------------------------------

interface ProgressSummaryProps {
  totalPassing: number;
  totalItems: number;
  /** Number of items manually checked off by the user */
  reviewedCount: number;
}

function ProgressSummary({ totalPassing, totalItems, reviewedCount }: ProgressSummaryProps) {
  const passPct = totalItems > 0 ? Math.round((totalPassing / totalItems) * 100) : 0;
  const colorClass = progressColorClass(passPct);

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4"
      role="region"
      aria-label="Overall compliance progress"
    >
      <div className="flex items-center gap-4">
        {/* Circular progress indicator (SVG, decorative — text below carries the value) */}
        <div
          className={`relative w-16 h-16 shrink-0 ${colorClass}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" focusable="false">
            {/* Track */}
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-10"
            />
            {/* Progress arc */}
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${passPct} ${100 - passPct}`}
              strokeLinecap="round"
              pathLength={100}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums"
          >
            {passPct}%
          </span>
        </div>

        {/* Textual breakdown */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {totalPassing} of {totalItems} criteria passing
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            WCAG 2.1 Level AA — Customer Intelligence Dashboard
          </p>
          {reviewedCount > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              {reviewedCount} item{reviewedCount !== 1 ? 's' : ''} marked as reviewed
            </p>
          )}
        </div>

        {/* Legend */}
        <dl className="hidden sm:flex flex-col gap-1 text-xs text-gray-500 shrink-0">
          {(['pass', 'fail', 'untested'] as ItemStatus[]).map((s) => {
            const { label, dotClass } = STATUS_CONFIG[s];
            const count = [
              ...DEFAULT_CHECKLIST.flatMap((g) => g.items),
            ].filter((i) => i.status === s).length;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`}
                  aria-hidden="true"
                />
                <dt className="sr-only">{label}</dt>
                <dd>
                  {count} {label}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AccessibilitySpecProps {
  /** Override the default checklist groups, e.g. for testing or custom audits. */
  checklist?: ChecklistGroup[];
  className?: string;
}

export type { ChecklistGroup, ChecklistItem, ChecklistCategory, ItemStatus };

/**
 * AccessibilitySpec — an interactive WCAG 2.1 AA compliance audit checklist panel.
 *
 * Displays all acceptance criteria grouped by category with live-region
 * announcements for status changes, semantic fieldset/legend structure for
 * screen readers, and keyboard-accessible checkboxes to mark items reviewed.
 *
 * This component is itself a model of good accessibility practices:
 * - Uses fieldset/legend for logical grouping
 * - Every checkbox has an associated <label> via htmlFor/id
 * - Descriptions linked via aria-describedby
 * - Status badges always convey meaning via text, not color alone
 * - Dynamic updates announced via role="status"
 * - focus-visible ring classes used throughout
 * - Reduced motion is respected by avoiding CSS animations
 */
export default function AccessibilitySpec({
  checklist = DEFAULT_CHECKLIST,
  className = '',
}: AccessibilitySpecProps) {
  // Track which items the user has manually marked as "reviewed"
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Live region announcement text for screen readers
  const [announcement, setAnnouncement] = useState('');

  // Use React's useId to generate stable, unique IDs for legend elements
  const baseId = useId();

  const allItems = checklist.flatMap((g) => g.items);
  const totalPassing = allItems.filter((i) => i.status === 'pass').length;
  const totalItems = allItems.length;

  const handleToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const wasChecked = next.has(id);
      if (wasChecked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Update live region so screen readers announce the state change
      const item = allItems.find((i) => i.id === id);
      if (item) {
        setAnnouncement(
          wasChecked
            ? `${item.criterion} marked as not reviewed`
            : `${item.criterion} marked as reviewed`
        );
      }
      return next;
    });
  };

  return (
    <div className={['w-full max-w-3xl mx-auto', className].filter(Boolean).join(' ')}>
      {/*
        Polite live region: announces checkbox state changes to screen readers
        without interrupting ongoing speech. The region is visually hidden.
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Page section heading */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Accessibility Audit
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        WCAG 2.1 Level AA compliance checklist for the Customer Intelligence
        Dashboard. Use the checkboxes to mark items as reviewed.
      </p>

      {/* Overall progress summary */}
      <ProgressSummary
        totalPassing={totalPassing}
        totalItems={totalItems}
        reviewedCount={checkedIds.size}
      />

      {/* Category groups */}
      <div className="mt-5 space-y-4">
        {checklist.map((group, index) => {
          const legendId = `${baseId}-legend-${index}`;
          return (
            <CategoryGroup
              key={group.category}
              group={group}
              checkedIds={checkedIds}
              onToggle={handleToggle}
              legendId={legendId}
            />
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-5 text-xs text-gray-400">
        Automated checks: run axe-core browser extension for zero critical/serious
        violations. Manual checks: keyboard walkthrough and VoiceOver/NVDA
        screen-reader spot-check.
      </p>
    </div>
  );
}
