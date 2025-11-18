/**
 * Templates API removed
 * This route intentionally returns 404 to indicate the templates feature
 * has been removed from the application. Keep the route present so that
 * callers receive a stable, explicit response instead of a 500.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Templates feature removed',
  }, { status: 404 });
}
