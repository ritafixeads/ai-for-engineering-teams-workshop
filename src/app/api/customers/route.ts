import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '../../../lib/customerService';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const customers = CustomerService.getAll(search);
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve customers.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const createInput = {
      name: input.name as string,
      email: input.email as string,
      company: input.company as string,
      healthScore: input.healthScore as number,
      subscriptionTier: input.subscriptionTier as 'basic' | 'premium' | 'enterprise' | undefined,
      domains: Array.isArray(input.domains) ? (input.domains as string[]) : undefined,
    };

    const validation = CustomerService.validateCreate(createInput);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const customer = CustomerService.create(createInput);
    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create customer.' }, { status: 500 });
  }
}
