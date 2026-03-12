import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '../../../../lib/customerService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customer = CustomerService.getById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve customer.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

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
    const updateInput = {
      ...(input.name !== undefined ? { name: input.name as string } : {}),
      ...(input.email !== undefined ? { email: input.email as string } : {}),
      ...(input.company !== undefined ? { company: input.company as string } : {}),
      ...(input.healthScore !== undefined ? { healthScore: input.healthScore as number } : {}),
      ...(input.subscriptionTier !== undefined
        ? { subscriptionTier: input.subscriptionTier as 'basic' | 'premium' | 'enterprise' }
        : {}),
      ...(Array.isArray(input.domains) ? { domains: input.domains as string[] } : {}),
    };

    const updated = CustomerService.update(id, updateInput);
    if (!updated) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update customer.' }, { status: 500 });
  }
}
