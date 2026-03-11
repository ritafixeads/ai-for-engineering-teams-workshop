'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketIntelligenceResponse } from '../lib/marketIntelligenceService';

interface MarketIntelligenceWidgetProps {
  companyName?: string;
}

const sentimentStyles: Record<string, string> = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-yellow-100 text-yellow-700',
  negative: 'bg-red-100 text-red-700',
};

const sentimentBarColor: Record<string, string> = {
  positive: 'bg-green-500',
  neutral: 'bg-yellow-400',
  negative: 'bg-red-500',
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function MarketIntelligenceWidget({ companyName }: MarketIntelligenceWidgetProps) {
  const [input, setInput] = useState(companyName ?? '');
  const [query, setQuery] = useState(companyName ?? '');
  const [data, setData] = useState<MarketIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (company: string) => {
    if (!company.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/market-intelligence/${encodeURIComponent(company.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (companyName) {
      setInput(companyName);
      setQuery(companyName);
    }
  }, [companyName]);

  useEffect(() => {
    if (query) fetchData(query);
  }, [query, fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Market Intelligence</h3>

      {!companyName && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter company name"
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </form>
      )}

      {loading && <LoadingSkeleton />}

      {error && (
        <div className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchData(query)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {data && !loading && (
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">{data.company}</p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${sentimentStyles[data.sentiment]}`}>
              {data.sentiment}
            </span>
          </div>

          {/* Sentiment score bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${sentimentBarColor[data.sentiment]}`}
                style={{ width: `${data.sentimentScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{data.sentimentScore}</span>
          </div>

          {/* Meta */}
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span>{data.newsCount} articles found</span>
            <span>Updated {formatRelativeDate(data.lastUpdated)}</span>
          </div>

          {/* Headlines */}
          <ul className="space-y-2">
            {data.headlines.map((h, i) => (
              <li key={i} className="text-xs border-l-2 border-gray-200 pl-2">
                <p className="text-gray-800 font-medium leading-snug">{h.title}</p>
                <p className="text-gray-400 mt-0.5">
                  {h.source} · {formatRelativeDate(h.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
