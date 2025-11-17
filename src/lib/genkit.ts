import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

// Model references per PRD requirements - using gemini-2.0-flash-exp as requested
export const TEXT_MODEL = 'googleai/gemini-2.0-flash-exp';
export const IMAGE_MODEL = 'googleai/gemini-2.0-flash-exp'; // Will use imagen when available

// Define reusable flows for outfit recommendations and visual generation
export const generateOutfitRecommendations = ai.defineFlow(
  {
    name: 'generateOutfitRecommendations',
    inputSchema: z.object({
      items: z.array(z.any()),
      weather: z.any().optional(),
      occasion: z.string().optional(),
      preferences: z.any().optional(),
      gender: z.string().optional(),
    }),
    outputSchema: z.object({
      outfits: z.array(z.any()),
    }),
  },
  async (input: unknown) => {
    const { items, weather, occasion, preferences, gender } = input as {
      items: any[];
      weather?: any;
      occasion?: string;
      preferences?: any;
      gender?: string;
    };

    // Build prompt for outfit recommendations
    const itemDescriptions = items
      .map((item: any) => {
        return `${item.category} (${item.color || 'colorful'}, ${item.season_tags?.join('/') || 'any season'})`;
      })
      .join('\n- ');

    const weatherLine = weather
      ? `Weather: ${weather.temp}°C, ${weather.description}`
      : 'Weather: not specified';

    const occasionLine = occasion
      ? `Occasion: ${occasion}`
      : 'Occasion: casual everyday';

    const genderLine = gender
      ? `Style for: ${gender}`
      : 'Style for: neutral';

    const prefsLine = preferences?.preferred_styles?.length
      ? `Preferred styles: ${preferences.preferred_styles.join(', ')}`
      : '';

    const prompt = `You are a personal stylist. Generate 1-3 outfit recommendations.

Available wardrobe items:
- ${itemDescriptions}

Context:
${weatherLine}
${occasionLine}
${genderLine}
${prefsLine}

Requirements:
- Each outfit should use 3-6 items from the wardrobe
- Provide a brief, friendly 3-4 line explanation for why each outfit works
- Consider color coordination, layering, and weather appropriateness
- Rank outfits by how well they match the context

Return JSON in this exact format:
{
  "outfits": [
    {
      "items": [list of item IDs],
      "reasoning": "Brief friendly explanation (3-4 lines)",
      "rank": 1
    }
  ]
}`;

    const result = await ai.generate({
      model: TEXT_MODEL,
      prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      },
    });

    try {
      const text = result.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { outfits: [] };
      return parsed;
    } catch (err) {
      console.error('Failed to parse outfit recommendations', err);
      return { outfits: [] };
    }
  }
);

export const generateVisualMetadata = ai.defineFlow(
  {
    name: 'generateVisualMetadata',
    inputSchema: z.object({
      items: z.array(z.any()),
      gender: z.string().optional(),
      styleNote: z.string().optional(),
      seed: z.string().optional(),
    }),
    outputSchema: z.object({
      visual_prompt: z.string(),
      alt_text: z.string(),
      seed_hint: z.string(),
    }),
  },
  async (input) => {
    const { items, gender = 'neutral', styleNote, seed } = input;

    const itemDescriptions = items
      .map((item: any) => {
        const parts = [item.category];
        if (item.color) parts.push(item.color);
        if (item.season_tags?.length) parts.push(item.season_tags.join(', '));
        return parts.join(' • ');
      })
      .join('\n- ');

    const genderLabel =
      gender === 'female'
        ? 'a feminine silhouette'
        : gender === 'male'
        ? 'a masculine silhouette'
        : 'a neutral, androgynous silhouette';

    const styleLine = styleNote
      ? `Style guidance: ${styleNote}.`
      : 'Style guidance: casual but put-together everyday outfit.';

    const seedLine = seed ? `Use this seed for consistency: ${seed}.` : '';

    const prompt = `You are a visual designer for an outfit planning app.

Generate an AI-ready description for a single outfit image to be rendered by an image model.

Requirements:
- Show ${genderLabel} so the focus is on the clothes.
- Prioritize accurate colors, silhouettes, and layering.
- Background should be simple, clean, and studio-like.
- Make sure every listed item is clearly visible.
- Do NOT add any extra items beyond the list.

Wardrobe items:
- ${itemDescriptions}

${styleLine}
${seedLine}

Output a concise JSON object with this shape:
{
  "visual_prompt": string,   // rich natural language prompt for an image model
  "alt_text": string,        // human-friendly alt text for accessibility
  "seed_hint": string        // a short, opaque string to reuse as a seed
}`;

    const result = await ai.generate({
      model: TEXT_MODEL,
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    try {
      const text = result.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        visual_prompt: parsed.visual_prompt || text.trim(),
        alt_text:
          parsed.alt_text ||
          `Outfit preview showing: ${items.map((i: any) => i.category).join(', ')} on ${genderLabel}.`,
        seed_hint: parsed.seed_hint || seed || Math.random().toString(36).slice(2, 9),
      };
    } catch (err) {
      console.error('Failed to parse visual metadata', err);
      return {
        visual_prompt: result.text.trim(),
        alt_text: `Outfit preview showing clothing items on ${genderLabel}.`,
        seed_hint: seed || Math.random().toString(36).slice(2, 9),
      };
    }
  }
);

// Image generation flow (placeholder for now - will integrate imagen/gemini-image when available)
export const generateOutfitImage = ai.defineFlow(
  {
    name: 'generateOutfitImage',
    inputSchema: z.object({
      visual_prompt: z.string(),
      seed_hint: z.string().optional(),
      gender: z.string().optional(),
    }),
    outputSchema: z.object({
      image_url: z.string(),
      image_data: z.string(),
    }),
  },
  async (input) => {
    const { visual_prompt, seed_hint, gender: _gender } = input;

    // TODO: When gemini-2.5-flash-image is available via Genkit:
    // 1. Call image generation model with visual_prompt
    // 2. Get image bytes/base64
    // 3. Return for upload to Supabase Storage
    
    // For now, return placeholder that signals "not yet generated"
    // The route will handle this gracefully
    
    console.log('[generateOutfitImage] Placeholder - image generation not yet wired');
    console.log('Prompt:', visual_prompt.slice(0, 100));
    console.log('Seed:', seed_hint);
    
    return {
      image_url: '',
      image_data: '',
    };
  }
);
