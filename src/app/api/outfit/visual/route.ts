import { NextRequest, NextResponse } from 'next/server';
import { generateVisualMetadata, generateOutfitImage } from '@/lib/genkit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Genkit requires Node runtime, not edge
export const runtime = 'nodejs';

// Input contract for visual generation
// - outfitId: optional existing outfit to attach visual to
// - items: list of clothing items (id, name, category, color, seasonTags, imageUrl)
// - gender: optional silhouette gender ("female" | "male" | "neutral")
// - styleNote: optional extra guidance for vibe/occasion
// - seed: optional string for reproducibility

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      outfitId,
      items,
      gender = 'neutral',
      styleNote,
      seed,
    } = body as {
      outfitId?: string;
      items: Array<{
        id: string;
        name?: string;
        category: string;
        color?: string;
        season_tags?: string[];
        image_url?: string;
      }>;
      gender?: 'female' | 'male' | 'neutral';
      styleNote?: string;
      seed?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required with at least one clothing item' },
        { status: 400 },
      );
    }

    // Generate visual metadata using Genkit + gemini-2.5-flash-lite
    const metadata = await generateVisualMetadata({
      items,
      gender: gender as 'female' | 'male' | 'neutral',
      styleNote,
      seed,
    });

    const { visual_prompt: visualPrompt, alt_text: altText, seed_hint: seedHint } = metadata;

    if (!visualPrompt) {
      return NextResponse.json(
        { error: 'Failed to construct visual prompt' },
        { status: 500 },
      );
    }

    // Persist visual metadata in Supabase for provenance and history.
    // We store prompt + seed_hint + items snapshot in outfits.visual_metadata,
    // but only if an outfitId is provided.

    let savedVisualId: string | null = null;

    if (outfitId) {
      const { data, error } = await supabase
        .from('outfits')
        .update({
          visual_metadata: {
            visual_prompt: visualPrompt,
            alt_text: altText,
            seed_hint: seedHint,
            items_snapshot: items,
            generated_at: new Date().toISOString(),
          },
        })
        .eq('id', outfitId)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save visual metadata', error);
      } else {
        savedVisualId = data?.id ?? null;
      }
    }

    return NextResponse.json({
      outfitId: savedVisualId ?? outfitId ?? null,
      visual_prompt: visualPrompt,
      alt_text: altText,
      seed_hint: seedHint,
      provenance: {
        model: 'gemini-1.5-flash',
        generated_at: new Date().toISOString(),
        gender,
      },
    });
  } catch (error) {
    console.error('Error in /api/outfit/visual', error);
    return NextResponse.json(
      { error: 'Failed to generate visual prompt' },
      { status: 500 },
    );
  }
}
