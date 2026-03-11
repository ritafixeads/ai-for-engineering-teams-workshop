import { NextRequest, NextResponse } from 'next/server';
import { MarketIntelligenceService, MarketIntelligenceError } from '../../../../lib/marketIntelligenceService';

const COMPANY_RE = /^[a-zA-Z0-9 \-]{1,100}$/;

function randomDelay(): Promise<void> {
  const ms = 300 + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string }> }
) {
  const { company } = await params;
  const decoded = decodeURIComponent(company ?? '').trim();

  if (!decoded || !COMPANY_RE.test(decoded)) {
    return NextResponse.json(
      { error: 'Invalid company name. Use alphanumeric characters, spaces, and hyphens only (max 100 chars).' },
      { status: 400 }
    );
  }

  try {
    await randomDelay();
    const data = await MarketIntelligenceService.getMarketData(decoded);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof MarketIntelligenceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to retrieve market intelligence.' }, { status: 500 });
  }
}
