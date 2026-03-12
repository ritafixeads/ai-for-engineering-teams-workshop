'use client';

import { Suspense, useState, lazy, memo } from 'react';
import { WidgetErrorBoundary } from '../components/WidgetErrorBoundary';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerList from '../components/CustomerList';
import { mockCustomers } from '../data/mock-customers';
import type { Customer } from '../data/mock-customers';
import type { CustomerWithMetrics } from '../lib/alerts';
import { exportToCSV, exportToJSON } from '../lib/exportUtils';

// ---------------------------------------------------------------------------
// Lazy-loaded heavy widgets
// Bundled separately so the initial page load is not blocked by their weight.
// ---------------------------------------------------------------------------
const HealthScoreCalculator = lazy(
  () => import('../components/HealthScoreCalculator')
);
const MarketIntelligenceWidget = lazy(
  () => import('../components/MarketIntelligenceWidget')
);
const PredictiveAlertsWidget = lazy(
  () => import('../components/PredictiveAlertsWidget')
);
const AccessibilitySpec = lazy(
  () => import('../components/AccessibilitySpec')
);

// ---------------------------------------------------------------------------
// Skeleton fallback — used by Suspense while lazy chunks load.
// Fixed height prevents layout shift (CLS target < 0.1).
// ---------------------------------------------------------------------------
function WidgetSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${label}`}
      aria-busy="true"
      className="rounded-lg bg-white border border-gray-100 shadow p-4 animate-pulse min-h-[160px] flex flex-col gap-3"
    >
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="flex-1 bg-gray-100 rounded" />
      <span className="sr-only">Loading {label}…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Augment mock customers with demo metrics for PredictiveAlertsWidget
// ---------------------------------------------------------------------------
const mockCustomersWithMetrics: CustomerWithMetrics[] = mockCustomers.map((c, i) => ({
  ...c,
  healthScoreDelta7d: [-25, 5, -5, 3, -22, 2, 8, -10][i % 8],
  loginFrequencyPerMonth: [18, 4, 20, 22, 18, 15, 20, 8][i % 8],
  loginFrequency30dAvg: [20, 20, 20, 20, 20, 20, 20, 20][i % 8],
  daysSinceLastPayment: [35, 5, 10, 5, 5, 5, 5, 5][i % 8],
  supportTicketsLast7Days: [1, 5, 1, 0, 1, 1, 0, 2][i % 8],
  escalationCount: [0, 1, 0, 0, 0, 0, 0, 0][i % 8],
  daysUntilRenewal: [200, 200, 60, 200, 200, 200, 200, 200][i % 8],
  daysSinceLastFeatureUse: [5, 5, 5, 5, 5, 5, 45, 5][i % 8],
  accountGrowthRate: [0, 0, 0, 0.2, 0, 0, 0.1, 0][i % 8],
  arr: [50_000, 10_000, 8_000, 120_000, 30_000, 25_000, 75_000, 5_000][i % 8],
}));

// ---------------------------------------------------------------------------
// CustomerCardDemo — memoized to avoid re-renders on unrelated state changes
// ---------------------------------------------------------------------------
const CustomerCardDemo = memo(function CustomerCardDemo() {
  try {
    // Try to import CustomerCard — this will work after Exercise 3
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CustomerCard = require('../components/CustomerCard')?.default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const customers = require('../data/mock-customers')?.mockCustomers;

    if (CustomerCard && customers?.length) {
      return (
        <div className="space-y-4">
          <p className="text-green-600 text-sm font-medium">CustomerCard implemented!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers.map((customer: { id: string }) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        </div>
      );
    }
  } catch {
    // Component not yet implemented — show placeholder
  }

  return (
    <div className="text-gray-500 text-sm">
      After Exercise 3, your CustomerCard components will appear here showing customer information with health scores.
    </div>
  );
});

// ---------------------------------------------------------------------------
// ExportToolbar — CSV and JSON export buttons
// ---------------------------------------------------------------------------
interface ExportToolbarProps {
  customers: Customer[];
}

function ExportToolbar({ customers }: ExportToolbarProps) {
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  function handleExportCSV() {
    exportToCSV(customers);
    setExportStatus('CSV export started');
    setTimeout(() => setExportStatus(null), 3000);
  }

  function handleExportJSON() {
    exportToJSON(customers);
    setExportStatus('JSON export started');
    setTimeout(() => setExportStatus(null), 3000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleExportCSV}
        aria-label="Export customers as CSV"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export CSV
      </button>
      <button
        onClick={handleExportJSON}
        aria-label="Export customers as JSON"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export JSON
      </button>
      {/* Live region announces export completion to screen readers */}
      {exportStatus && (
        <span role="status" aria-live="polite" className="text-xs text-green-700 font-medium">
          {exportStatus}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomerManagementSection
// ---------------------------------------------------------------------------
function CustomerManagementSection() {
  const [showManage, setShowManage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Local copy of mock customers for export (in a real app this would come from state/API)
  const [exportCustomers] = useState<Customer[]>(mockCustomers);

  function handleCustomerAdded() {
    setRefreshTrigger((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      {!showManage ? (
        <button
          onClick={() => setShowManage(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
        >
          Manage Customers
        </button>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold text-gray-800">Customer Management</h3>
            <div className="flex items-center gap-3">
              <ExportToolbar customers={exportCustomers} />
              <button
                onClick={() => setShowManage(false)}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Hide
              </button>
            </div>
          </div>
          <AddCustomerForm onSuccess={handleCustomerAdded} />
          <CustomerList refreshTrigger={refreshTrigger} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    /*
     * id="main-content" is the anchor target for the skip-to-content link
     * defined in layout.tsx.  Using <main> satisfies WCAG 2.4.1 and provides
     * a landmark for screen reader navigation.
     */
    <main id="main-content" className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Customer Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          AI for Engineering Teams Workshop - Your Progress
        </p>
      </header>

      {/* Progress Indicator */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workshop Progress</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Setup Complete - Next.js app is running</p>
          <p>Exercise 3: CustomerCard component (implement to see here)</p>
          <p>Exercise 4: CustomerSelector integration</p>
          <p>Exercise 5: Domain Health widget</p>
          <p>Exercise 9: Production-ready features</p>
        </div>
      </div>

      {/* Component Showcase Area */}
      <div className="space-y-8">
        {/* CustomerCard Section */}
        <section className="bg-white rounded-lg shadow p-6" aria-label="CustomerCard Component">
          <h2 className="text-lg font-semibold mb-4">CustomerCard Component</h2>
          <WidgetErrorBoundary widgetName="CustomerCard Demo">
            <Suspense fallback={<WidgetSkeleton label="CustomerCard Demo" />}>
              <CustomerCardDemo />
            </Suspense>
          </WidgetErrorBoundary>
        </section>

        {/* Dashboard Widgets Section */}
        <section className="bg-white rounded-lg shadow p-6" aria-label="Dashboard Widgets">
          <h2 className="text-lg font-semibold mb-4">Dashboard Widgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <WidgetErrorBoundary widgetName="Health Score Calculator">
              <Suspense fallback={<WidgetSkeleton label="Health Score Calculator" />}>
                <HealthScoreCalculator customerName="John Smith" />
              </Suspense>
            </WidgetErrorBoundary>

            <WidgetErrorBoundary widgetName="Market Intelligence">
              <Suspense fallback={<WidgetSkeleton label="Market Intelligence" />}>
                <MarketIntelligenceWidget />
              </Suspense>
            </WidgetErrorBoundary>

            <WidgetErrorBoundary widgetName="Predictive Alerts">
              <Suspense fallback={<WidgetSkeleton label="Predictive Alerts" />}>
                <PredictiveAlertsWidget customers={mockCustomersWithMetrics} />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
        </section>

        {/* Customer Management Section */}
        <section className="bg-white rounded-lg shadow p-6" aria-label="Customer Management">
          <h2 className="text-lg font-semibold mb-4">Customer Management</h2>
          <WidgetErrorBoundary widgetName="Customer Management">
            <CustomerManagementSection />
          </WidgetErrorBoundary>
        </section>

        {/* Accessibility Section */}
        <section className="bg-white rounded-lg shadow p-6" aria-label="Accessibility Spec">
          <h2 className="text-lg font-semibold mb-4">Accessibility Component</h2>
          <WidgetErrorBoundary widgetName="Accessibility Spec">
            <Suspense fallback={<WidgetSkeleton label="Accessibility Spec" />}>
              <AccessibilitySpec />
            </Suspense>
          </WidgetErrorBoundary>
        </section>

        {/* Getting Started */}
        <section className="bg-blue-50 rounded-lg p-6" aria-label="Getting Started">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start Building?</h2>
          <p className="text-blue-800 mb-4">
            Follow along with the workshop exercises to see this dashboard come to life with AI-generated components.
          </p>
          <div className="text-sm text-blue-700">
            <p className="mb-1"><strong>Next:</strong> Exercise 1 - Create your first specification</p>
            <p className="mb-1"><strong>Then:</strong> Exercise 3 - Generate your first component</p>
            <p className="text-xs text-blue-600">Tip: Refresh this page after completing exercises to see your progress!</p>
          </div>
        </section>
      </div>
    </main>
  );
}
