import { Customer } from '../data/mock-customers';

interface CustomerCardProps {
  customer: Customer;
}

function getHealthBadge(score: number): { label: string; className: string } {
  if (score <= 30) {
    return { label: 'Poor', className: 'bg-red-100 text-red-700' };
  } else if (score <= 70) {
    return { label: 'Moderate', className: 'bg-yellow-100 text-yellow-700' };
  } else {
    return { label: 'Good', className: 'bg-green-100 text-green-700' };
  }
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const { label, className } = getHealthBadge(customer.healthScore);
  const domains = customer.domains ?? [];

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full max-w-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
          <p className="text-sm text-gray-500">{customer.company}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${className}`}
          aria-label={`Health score: ${customer.healthScore} (${label})`}
        >
          <span aria-hidden="true">{customer.healthScore}</span>
          <span>{label}</span>
        </span>
      </div>

      {domains.length > 0 && (
        <div>
          {domains.length > 1 && (
            <p className="text-xs text-gray-400 mb-1">{domains.length} domains</p>
          )}
          <ul className="space-y-0.5">
            {domains.map((domain) => (
              <li key={domain} className="text-xs font-mono text-gray-600 truncate">
                {domain}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
