/**
 * Web Vitals Analytics Endpoint
 * POST /api/analytics/web-vitals
 * 
 * Receives and logs web vitals metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log web vitals to console (can be extended to send to analytics service)
    console.log('Web Vitals:', {
      name: body.name,
      value: body.value,
      rating: body.rating,
      delta: body.delta,
      id: body.id,
      navigationType: body.navigationType,
    });
    
    // In production, you might want to send this to an analytics service like:
    // - Google Analytics
    // - Vercel Analytics
    // - DataDog
    // - Custom analytics endpoint
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
