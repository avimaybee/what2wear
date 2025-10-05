'use server'

// Define the expected JSON structure from the AI
export type CategorizationResponse = {
  category: string;
  color: string;
  season_tags: string[];
  style_tags: string[];
}

export async function categorizeImage(imageUrl: string): Promise<CategorizationResponse | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is not configured.');
    return { error: 'Gemini API key is not configured.' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  const prompt = `
    Analyze the clothing item in the provided image.
    Respond with only a single, valid JSON object in a markdown code block.
    The JSON object should have the following structure:
    {
      "category": "one of: 'shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'",
      "color": "a simple, one or two-word color description (e.g., 'dark blue', 'light grey')",
      "season_tags": "an array of strings, choose one or more from: 'spring', 'summer', 'autumn', 'winter'",
      "style_tags": "an array of strings, choose one or more from: 'casual', 'formal', 'streetwear', 'sporty', 'business'"
    }
    Do not include any other text or explanation outside of the JSON object.
  `;

  try {
    // Fetch the image and convert it to a base64 string
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        return { error: 'Failed to fetch image from URL.' };
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg', // Assuming jpeg, can be made more dynamic
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      return { error: `Gemini API request failed: ${response.statusText}` };
    }

    const responseBody = await response.json();
    
    // Extract the JSON string from the markdown code block
    const jsonString = responseBody.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, '');
    
    const parsedJson = JSON.parse(jsonString) as CategorizationResponse;
    
    return parsedJson;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { error: 'Failed to analyze image.' };
  }
}

// --- NEW FUNCTION ---

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

type OutfitRecommendation = {
  item_ids: number[];
}

export async function getOutfitRecommendation(): Promise<OutfitRecommendation | { error: string }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to get a recommendation.' };
  }

  const { data: clothingItems, error: dbError } = await supabase
    .from('clothing_items')
    .select('id, category, color, style_tags')
    .eq('user_id', user.id);

  if (dbError) {
    console.error('Error fetching clothing items:', dbError);
    return { error: 'Failed to fetch clothing items.' };
  }

  if (!clothingItems || clothingItems.length < 3) {
    return { error: 'Not enough clothing items to make an outfit. Please add at least one top, one bottom, and one pair of shoes.' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is not configured.');
    return { error: 'Gemini API key is not configured.' };
  }

  // Using the specified model, but with a text-only prompt
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  const prompt = `
    Given the following list of available clothing items as a JSON array:
    ${JSON.stringify(clothingItems, null, 2)}

    Please act as a fashion stylist. Your task is to select one top (category 'shirt' or 't-shirt'), one bottom (category 'pants'), and one pair of shoes (category 'shoes') to create a stylish, complementary outfit.

    Consider the style tags and colors to make a good match.

    Respond with only a single, valid JSON object in a markdown code block.
    The JSON object should have a single key "item_ids" which is an array containing the integer IDs of the three selected items.
    Example response:
    {
      "item_ids": [15, 2, 8]
    }
    Do not include any other text or explanation.
  `;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      return { error: `Gemini API request failed: ${response.statusText}` };
    }

    const responseBody = await response.json();
    const jsonString = responseBody.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, '');
    const parsedJson = JSON.parse(jsonString) as OutfitRecommendation;

    return parsedJson;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { error: 'Failed to get outfit recommendation.' };
  }
}
