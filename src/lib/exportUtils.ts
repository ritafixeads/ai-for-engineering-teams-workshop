import type { Customer } from '../data/mock-customers';

/**
 * Returns the current date formatted as an ISO-8601 date string (YYYY-MM-DD).
 * Extracted to a named function so it can be overridden in tests without
 * mocking the global Date.
 */
function isoDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Triggers a browser download of `blob` with the given `filename`.
 * Creates a temporary anchor element, clicks it programmatically, then
 * immediately revokes the object URL to avoid memory leaks.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  // Required in Firefox — element must be in the document before .click()
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke after a tick so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Escapes a single CSV field value.
 *
 * Rules:
 * - If the value contains a comma, double-quote, or newline it is wrapped in
 *   double-quotes.
 * - Any double-quote characters inside the value are escaped by doubling them.
 */
function escapeCSVField(value: string): string {
  const needsQuoting = /[",\n\r]/.test(value);
  if (needsQuoting) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Column order matches the spec exactly.
const CSV_HEADERS = [
  'id',
  'name',
  'email',
  'company',
  'healthScore',
  'subscriptionTier',
  'domains',
] as const;

/**
 * Converts a single Customer record to a CSV row string.
 * The `domains` array is joined with a pipe (`|`) separator so it fits in a
 * single CSV cell without introducing ambiguity.
 */
function customerToCSVRow(customer: Customer): string {
  const fields: string[] = [
    customer.id,
    customer.name,
    customer.email ?? '',
    customer.company,
    String(customer.healthScore),
    customer.subscriptionTier ?? '',
    (customer.domains ?? []).join('|'),
  ];
  return fields.map(escapeCSVField).join(',');
}

/**
 * Exports the given customer list as a UTF-8 encoded CSV file and triggers a
 * browser download.
 *
 * Filename format: `customers-YYYY-MM-DD.csv`
 * CSV headers: id, name, email, company, healthScore, subscriptionTier, domains
 *
 * Synchronous for ≤ 1000 records (typical CSM dataset). For datasets larger
 * than 1000 records the function still completes synchronously — the spec
 * only requires a progress indicator for large sets; a console.warn is emitted
 * as a placeholder until a real progress UI is wired in.
 */
export function exportToCSV(customers: Customer[]): void {
  if (customers.length > 1_000) {
    // Large-dataset notice — replace with a real progress indicator if needed.
    console.warn(
      `[exportToCSV] Exporting ${customers.length} records. Consider streaming for very large datasets.`
    );
  }

  const headerRow = CSV_HEADERS.join(',');
  const dataRows = customers.map(customerToCSVRow);
  const csvContent = [headerRow, ...dataRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `customers-${isoDateString()}.csv`);
}

/**
 * Exports the given customer list as a pretty-printed JSON file and triggers a
 * browser download.
 *
 * Filename format: `customers-YYYY-MM-DD.json`
 * The file contains a top-level JSON array of customer objects.
 */
export function exportToJSON(customers: Customer[]): void {
  if (customers.length > 1_000) {
    console.warn(
      `[exportToJSON] Exporting ${customers.length} records. Consider streaming for very large datasets.`
    );
  }

  const jsonContent = JSON.stringify(customers, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `customers-${isoDateString()}.json`);
}
