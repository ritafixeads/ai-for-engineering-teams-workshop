'use client';

import { useMemo, useState } from 'react';
import { Customer } from '../data/mock-customers';
import CustomerCard from './CustomerCard';

export interface CustomerSelectorProps {
  customers: Customer[];
  loading?: boolean;
  onCustomerSelect?: (customer: Customer) => void;
  initialSelectedId?: string;
}

const SKELETON_COUNT = 6;

function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg shadow p-4 w-full min-h-[120px] bg-white animate-pulse motion-reduce:animate-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full shrink-0" />
      </div>
      <div className="mt-3 border-t border-gray-100 pt-2 space-y-1">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function CustomerSelector({
  customers,
  loading = false,
  onCustomerSelect,
  initialSelectedId,
}: CustomerSelectorProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const lower = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.company.toLowerCase().includes(lower),
    );
  }, [customers, query]);

  const handleSelect = (customer: Customer) => {
    setSelectedId(customer.id);
    onCustomerSelect?.(customer);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <label htmlFor="customer-search" className="sr-only">
          Search customers by name or company
        </label>
        <input
          id="customer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or company…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Search by name or company"
          aria-controls="customer-grid"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {!loading && `${filtered.length} customer${filtered.length !== 1 ? 's' : ''} shown`}
      </div>

      {/* Grid */}
      <div
        id="customer-grid"
        className="max-h-[600px] overflow-y-auto"
      >
        {loading ? (
          <ul
            aria-label="Loading customers"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <li key={i}>
                <CardSkeleton />
              </li>
            ))}
          </ul>
        ) : customers.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No customers found</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No customers match your search
          </p>
        ) : (
          <ul
            role="list"
            aria-label="Customer list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((customer) => (
              <li key={customer.id}>
                <CustomerCard
                  customer={customer}
                  isSelected={customer.id === selectedId}
                  onSelect={handleSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
