'use client';

import { useState } from 'react';
import { Customer } from '../data/mock-customers';
import Button from './Button';

export interface AddCustomerFormProps {
  onSuccess?: (customer: Customer) => void;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  healthScore: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise' | '';
}

interface FieldErrors {
  name?: string;
  email?: string;
  company?: string;
  healthScore?: string;
  subscriptionTier?: string;
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateFields(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.company.trim()) {
    errors.company = 'Company is required.';
  } else if (form.company.trim().length > 100) {
    errors.company = 'Company must be 100 characters or fewer.';
  }

  const hs = Number(form.healthScore);
  if (form.healthScore === '') {
    errors.healthScore = 'Health score is required.';
  } else if (!Number.isInteger(hs) || hs < 0 || hs > 100) {
    errors.healthScore = 'Health score must be a whole number between 0 and 100.';
  }

  return errors;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  company: '',
  healthScore: '',
  subscriptionTier: '',
};

export default function AddCustomerForm({ onSuccess }: AddCustomerFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSuccessMessage(null);
    setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors = validateFields(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          healthScore: Number(form.healthScore),
          subscriptionTier: form.subscriptionTier || undefined,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const err = (data as { error?: string }).error ?? 'An error occurred.';
        setApiError(err);
        return;
      }

      const created = data as Customer;
      setSuccessMessage(`Customer "${created.name}" was added successfully.`);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      onSuccess?.(created);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Customer</h2>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800"
        >
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="acf-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="acf-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            aria-required="true"
            aria-describedby={fieldErrors.name ? 'acf-name-error' : undefined}
            aria-invalid={!!fieldErrors.name}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.name ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          />
          {fieldErrors.name && (
            <p id="acf-name-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="acf-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="acf-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            aria-required="true"
            aria-describedby={fieldErrors.email ? 'acf-email-error' : undefined}
            aria-invalid={!!fieldErrors.email}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.email ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          />
          {fieldErrors.email && (
            <p id="acf-email-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Company */}
        <div>
          <label htmlFor="acf-company" className="block text-sm font-medium text-gray-700 mb-1">
            Company <span aria-hidden="true">*</span>
          </label>
          <input
            id="acf-company"
            name="company"
            type="text"
            value={form.company}
            onChange={handleChange}
            aria-required="true"
            aria-describedby={fieldErrors.company ? 'acf-company-error' : undefined}
            aria-invalid={!!fieldErrors.company}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.company ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          />
          {fieldErrors.company && (
            <p id="acf-company-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.company}
            </p>
          )}
        </div>

        {/* Health Score */}
        <div>
          <label htmlFor="acf-health-score" className="block text-sm font-medium text-gray-700 mb-1">
            Health Score (0–100) <span aria-hidden="true">*</span>
          </label>
          <input
            id="acf-health-score"
            name="healthScore"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.healthScore}
            onChange={handleChange}
            aria-required="true"
            aria-describedby={fieldErrors.healthScore ? 'acf-health-score-error' : undefined}
            aria-invalid={!!fieldErrors.healthScore}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.healthScore ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          />
          {fieldErrors.healthScore && (
            <p id="acf-health-score-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.healthScore}
            </p>
          )}
        </div>

        {/* Subscription Tier */}
        <div>
          <label htmlFor="acf-subscription-tier" className="block text-sm font-medium text-gray-700 mb-1">
            Subscription Tier
          </label>
          <select
            id="acf-subscription-tier"
            name="subscriptionTier"
            value={form.subscriptionTier}
            onChange={handleChange}
            aria-describedby={fieldErrors.subscriptionTier ? 'acf-subscription-tier-error' : undefined}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.subscriptionTier ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          >
            <option value="">Select a tier</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
          {fieldErrors.subscriptionTier && (
            <p id="acf-subscription-tier-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.subscriptionTier}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" loading={submitting} className="w-full sm:w-auto">
            Add Customer
          </Button>
        </div>
      </form>
    </div>
  );
}
