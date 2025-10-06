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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to get a recommendation.' };
  }

  // Fetch all of the user's clothing items
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

  // --- Fetch feedback history ---
  const { data: ratedOutfits, error: outfitsError } = await supabase
    .from('outfits')
    .select('id, rating')
    .eq('user_id', user.id)
    .in('rating', [1, -1]);

  const likedOutfits: (typeof clothingItems)[] = [];
  const dislikedOutfits: (typeof clothingItems)[] = [];

  if (outfitsError) {
    console.warn("Could not fetch user's outfit ratings.", outfitsError);
  } else if (ratedOutfits && ratedOutfits.length > 0) {
    const ratedOutfitIds = ratedOutfits.map(o => o.id);
    const { data: outfitItems, error: itemsError } = await supabase
      .from('outfit_items')
      .select('outfit_id, clothing_item_id')
      .in('outfit_id', ratedOutfitIds);

    if (itemsError) {
      console.warn("Could not fetch items for rated outfits.", itemsError);
    } else if (outfitItems) {
      const itemDetailsMap = new Map(clothingItems.map(item => [item.id, item]));
      const outfitsMap = new Map<number, typeof clothingItems>();

      for (const item of outfitItems) {
        if (!outfitsMap.has(item.outfit_id)) {
          outfitsMap.set(item.outfit_id, []);
        }
        const itemDetail = itemDetailsMap.get(item.clothing_item_id);
        if (itemDetail) {
          outfitsMap.get(item.outfit_id)!.push(itemDetail);
        }
      }

      for (const ratedOutfit of ratedOutfits) {
        const outfitDetails = outfitsMap.get(ratedOutfit.id);
        if (outfitDetails) {
          if (ratedOutfit.rating === 1) {
            likedOutfits.push(outfitDetails);
          } else if (ratedOutfit.rating === -1) {
            dislikedOutfits.push(outfitDetails);
          }
        }
      }
    }
  }

  // --- Construct the prompt with feedback ---
  let feedbackPrompt = '';
  if (likedOutfits.length > 0) {
    feedbackPrompt += `
      Here are some examples of outfits the user has previously LIKED. Learn from these to understand the user's style:
      ${JSON.stringify(likedOutfits, null, 2)}
    `;
  }
  if (dislikedOutfits.length > 0) {
    feedbackPrompt += `
      And here are some examples of outfits the user has previously DISLIKED. Avoid creating combinations like these:
      ${JSON.stringify(dislikedOutfits, null, 2)}
    `;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is not configured.');
    return { error: 'Gemini API key is not configured.' };
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  const prompt = `
    You are a fashion stylist. Your task is to create a stylish, complementary outfit for a user.
    Select one top (category 'shirt' or 't-shirt'), one bottom (category 'pants'), and one pair of shoes (category 'shoes').

    Here is the user's entire wardrobe, provided as a JSON array:
    ${JSON.stringify(clothingItems, null, 2)}

    ${feedbackPrompt}

    Please use the user's past feedback (if provided) to inform your decision. Try to create an outfit that aligns with their liked styles and avoids combinations similar to their disliked ones.
    Consider the style tags and colors to make a good match.

    Respond with only a single, valid JSON object in a markdown code block.
    The JSON object must have a single key "item_ids" which is an array containing the integer IDs of the three selected items.
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
      headers: { 'Content-Type': 'application/json' },
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

// --- NEW ACTIONS FOR FEEDBACK ---

export async function recordOutfit(itemIds: number[]): Promise<{ data: { id: number } | null, error: { message: string } | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'User not authenticated.' } };
  }

  // Step 1: Create the outfit record to get an ID
  const { data: outfitData, error: outfitError } = await supabase
    .from('outfits')
    .insert({ user_id: user.id, rating: 0 })
    .select('id')
    .single();

  if (outfitError) {
    console.error('Error creating outfit record:', outfitError);
    return { data: null, error: { message: 'Could not create outfit record.' } };
  }

  const outfitId = outfitData.id;

  // Step 2: Create the outfit_items records
  const outfitItemsToInsert = itemIds.map(itemId => ({
    outfit_id: outfitId,
    clothing_item_id: itemId,
  }));

  const { error: itemsError } = await supabase
    .from('outfit_items')
    .insert(outfitItemsToInsert);

  if (itemsError) {
    console.error('Error linking items to outfit:', itemsError);
    // Optional: Clean up the created outfit record if linking fails
    await supabase.from('outfits').delete().eq('id', outfitId);
    return { data: null, error: { message: 'Could not link items to the outfit.' } };
  }

  return { data: { id: outfitId }, error: null };
}

export async function storeOutfitFeedback(outfitId: number, rating: 1 | -1): Promise<{ error: { message: string } | null }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: { message: 'User not authenticated.' } };
    }

    const { error } = await supabase
        .from('outfits')
        .update({ rating })
        .eq('id', outfitId)
        .eq('user_id', user.id); // RLS should handle this, but explicit check is good

    if (error) {
        console.error('Error storing feedback:', error);
        return { error: { message: 'Could not store feedback.' } };
    }

            return { error: null };
    }
    
    // --- NEW ACTION FOR VIRTUAL TRY-ON ---
    
    export async function renderOutfit(outfitId: number): Promise<{ renderedUrl: string | null; error: string | null }> {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
    
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { renderedUrl: null, error: 'User not authenticated.' };
      }
    
      // 1. Get the user's avatar URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_body_model_url')
        .eq('id', user.id)
        .single();
    
      if (profileError || !profile?.full_body_model_url) {
        return { renderedUrl: null, error: 'User avatar not found. Please upload an avatar in your profile.' };
      }
    
      // 2. Get the image URLs for the items in the outfit
      const { data: items, error: itemsError } = await supabase
        .from('outfit_items')
        .select('clothing_items(image_url)')
        .eq('outfit_id', outfitId);
    
      if (itemsError || !items || items.length === 0) {
        return { renderedUrl: null, error: 'Could not fetch items for the outfit.' };
      }
    
      const itemImageUrls = items.map(item => item.clothing_items?.image_url).filter(Boolean) as string[];
    
      // 3. (SIMULATED) Call the Gemini API to generate the try-on image
      // In a real implementation, you would construct a complex prompt with the avatar
      // and item images and call the appropriate Gemini model.
      console.log('Simulating call to Gemini for outfit rendering with:', {
        avatarUrl: profile.full_body_model_url,
        itemImageUrls,
      });
    
      // For now, we return a placeholder image.
      const placeholderUrl = `https://placehold.co/600x800/e2e8f0/4a5568?text=Virtual+Try-On\n(Outfit+${outfitId})`;
    
      // 4. Save the rendered image URL to the database
      const { error: updateError } = await supabase
        .from('outfits')
        .update({ rendered_image_url: placeholderUrl })
        .eq('id', outfitId);
    
      if (updateError) {
        return { renderedUrl: null, error: 'Failed to save the rendered outfit image.' };
      }
    
      return { renderedUrl: placeholderUrl, error: null };
    }
    
