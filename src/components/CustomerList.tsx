'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Customer } from '../data/mock-customers';
import CustomerCard from './CustomerCard';

export interface CustomerListProps {
  onSelect?: (customer: Customer) => void;
  refreshTrigger?: number;
}

const MemoizedCustomerCard = memo(CustomerCard);

function SkeletonCard() {
  return (
    <div className="rounded-lg shadow p-4 bg-white w-full min-h-[120px] animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
    </div>
  );
}

/**
 * CustomerList is wrapped with React.memo so that it only re-renders when its
 * own props change, preventing unnecessary re-renders from unrelated parent
 * state updates (e.g. the Customer Management toggle state).
 */
const CustomerList = memo(function CustomerList({ onSelect, refreshTrigger }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setFetchError(data.error ?? 'Failed to load customers.');
        return;
      }
      const data = (await res.json()) as Customer[];
      setCustomers(data);
    } catch {
      setFetchError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, refreshTrigger]);

  const filtered =
    search.trim()
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            c.company.toLowerCase().includes(search.trim().toLowerCase())
        )
      : customers;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="customer-list-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-list-search"
          type="search"
          placeholder="Search by name or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search customers by name or company"
        />
      </div>

      {fetchError && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div
          aria-busy="true"
          aria-label="Loading customers"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {search.trim()
            ? `No customers match "${search}".`
            : 'No customers found.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <MemoizedCustomerCard
              key={customer.id}
              customer={customer}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default CustomerList;
