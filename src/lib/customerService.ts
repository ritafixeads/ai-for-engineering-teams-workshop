import { Customer, mockCustomers } from '../data/mock-customers';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CustomerCreateInput {
  name: string;
  email: string;
  company: string;
  healthScore: number;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  domains?: string[];
}

export interface CustomerUpdateInput {
  name?: string;
  email?: string;
  company?: string;
  healthScore?: number;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  domains?: string[];
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const SUBSCRIPTION_TIERS = new Set(['basic', 'premium', 'enterprise']);

const store = new Map<string, Customer>(
  mockCustomers.map((c) => [c.id, { ...c }])
);

function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

export class CustomerService {
  static validateCreate(input: CustomerCreateInput): ValidationResult {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100) {
      return { valid: false, error: 'name is required and must be 1–100 characters' };
    }

    const email = typeof input.email === 'string' ? input.email.trim() : '';
    if (!email || !EMAIL_RE.test(email)) {
      return { valid: false, error: 'email must be a valid email address' };
    }

    const company = typeof input.company === 'string' ? input.company.trim() : '';
    if (!company || company.length > 100) {
      return { valid: false, error: 'company is required and must be 1–100 characters' };
    }

    const hs = input.healthScore;
    if (typeof hs !== 'number' || !Number.isInteger(hs) || hs < 0 || hs > 100) {
      return { valid: false, error: 'healthScore must be an integer between 0 and 100' };
    }

    if (
      input.subscriptionTier !== undefined &&
      !SUBSCRIPTION_TIERS.has(input.subscriptionTier)
    ) {
      return { valid: false, error: 'subscriptionTier must be basic, premium, or enterprise' };
    }

    return { valid: true };
  }

  static create(input: CustomerCreateInput): Customer {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: sanitizeString(input.name),
      email: sanitizeString(input.email),
      company: sanitizeString(input.company),
      healthScore: input.healthScore,
      subscriptionTier: input.subscriptionTier,
      domains: input.domains?.map((d) => sanitizeString(d)),
      createdAt: now,
      updatedAt: now,
    };
    store.set(customer.id, customer);
    return { ...customer };
  }

  static getAll(search?: string): Customer[] {
    const all = Array.from(store.values()).map((c) => ({ ...c }));
    if (!search || !search.trim()) return all;
    const lower = search.trim().toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.company.toLowerCase().includes(lower)
    );
  }

  static getById(id: string): Customer | undefined {
    const c = store.get(id);
    return c ? { ...c } : undefined;
  }

  static update(id: string, input: CustomerUpdateInput): Customer | undefined {
    const existing = store.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      ...(input.name !== undefined ? { name: sanitizeString(input.name) } : {}),
      ...(input.email !== undefined ? { email: sanitizeString(input.email) } : {}),
      ...(input.company !== undefined ? { company: sanitizeString(input.company) } : {}),
      ...(input.healthScore !== undefined ? { healthScore: input.healthScore } : {}),
      ...(input.subscriptionTier !== undefined ? { subscriptionTier: input.subscriptionTier } : {}),
      ...(input.domains !== undefined ? { domains: input.domains.map((d) => sanitizeString(d)) } : {}),
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return { ...updated };
  }
}
