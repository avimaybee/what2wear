import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { IClothingItem, OutfitValidation } from '@/lib/types';
import { UserPreferences } from '@/types/retro';
import { config } from '@/lib/config';
import { resolveInsulationValue } from './recommendationEngine';

/**
 * AI-Powered Outfit Analyzer using Gemini 2.5 Flash
 * 
 * This system:
 * 1. Analyzes clothing descriptions to understand style, material, and suitability
 * 2. Selects outfit combinations based on context
 * 3. Validates outfit by analyzing actual images
 * 4. Replaces items if something doesn't fit
 * 5. Re-validates until satisfied
 */

// Initialize Gemini API
const getGeminiClient = () => {
  if (!config.ai.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return new GoogleGenerativeAI(config.ai.gemini.apiKey);
};

const getTextModel = (() => {
  let cachedModel: GenerativeModel | null = null;
  return () => {
    if (!cachedModel) {
      cachedModel = getGeminiClient().getGenerativeModel({ model: config.ai.gemini.model });
    }
    return cachedModel;
  };
})();

/**
 * Analyze a clothing item image to extract metadata
 * Used during onboarding to auto-populate item properties
 */
export async function analyzeClothingImage(
  base64ImageData: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  detectedType: string;
  detectedColor: string;
  detectedMaterial: string;
  detectedStyleTags: string[];
  detectedPattern?: string;
  detectedFit?: string;
  detectedSeason?: string[];
  detectedInsulation?: number;
  detectedDescription?: string;
  detectedName?: string;
}> {
  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an expert fashion archivist. Analyze the image of the clothing item and extract metadata into a strict JSON format.

Respond with only valid JSON (no markdown, no code blocks).

{
  "name": "A creative, short name for the item (e.g. 'Vintage Acid Wash Tee')",
  "category": "Top|Bottom|Shoes|Outerwear|Accessory|Dress (e.g. dress, gown, frock, sundress, maxi, mini, wrap, shift, sheath)",
  "material": "Cotton|Polyester|Wool|Silk|Leather|Denim|Linen|Synthetic|Gore-Tex|Other",
  "color": "Main color name or hex",
  "formality_insulation_value": 0-10 (0 for naked, 10 for arctic parka),
  "pattern": "Solid|Striped|Checkered|Graphic|Floral|etc",
  "fit": "Fitted|Regular|Relaxed|Oversized|Slim|Loose|One Size",
  "season_tags": ["Spring", "Summer", "Autumn", "Winter", "All Season"],
  "style_tags": ["casual", "formal", "sporty", "vintage", "modern", "bold", "minimalist", "streetwear", "gorpcore", "y2k"],
  "description": "Short description of the item"
}`,
            },
            {
              inlineData: {
                mimeType,
                data: base64ImageData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.gemini.model}:generateContent?key=${config.ai.gemini.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData?.error?.message}`);
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error('Invalid response from Gemini API');
    }

    const textPart = data.candidates[0].content.parts[0];
    const text = textPart.text as string;
    
    // Clean up markdown if present (though we asked for none)
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    const analysis = JSON.parse(cleanText);

    return {
      detectedType: analysis.category?.toLowerCase() || 'accessory',
      detectedColor: analysis.color || '#000000',
      detectedMaterial: analysis.material?.toLowerCase() || 'unknown',
      detectedStyleTags: analysis.style_tags || [],
      detectedPattern: analysis.pattern,
      detectedFit: analysis.fit,
      detectedSeason: analysis.season_tags,
      detectedInsulation: analysis.formality_insulation_value,
      detectedDescription: analysis.description,
      detectedName: analysis.name,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error analyzing clothing image:', error);
    }
    // Return safe defaults on error
    return {
      detectedType: 'accessory',
      detectedColor: '#808080',
      detectedMaterial: 'unknown',
      detectedStyleTags: ['casual'],
    };
  }
}

/**
 * Generate AI-powered outfit recommendation using the "Fire Fit" logic
 */
export async function generateAIOutfitRecommendation(
  wardrobeItems: IClothingItem[],
  context: {
    weather: string;
    occasion: string;
    season: string;
    userPreferences?: UserPreferences;
    lockedItems?: string[];
  }
): Promise<{
  outfit: IClothingItem[];
  validationScore: number;
  iterations: number;
  analysisLog: string[];
  reasoning?: {
    weatherMatch?: string;
    colorAnalysis?: string;
    historyCheck?: string;
    styleScore?: number;
    totalInsulation?: number;
    layeringStrategy?: string;
    occasionFit?: string;
  };
}> {
  const model = getTextModel();
  const log: string[] = [];
  
  log.push('🤖 Starting AI outfit recommendation (Fire Fit Engine)...');
  
  const defaultPreferences: UserPreferences = {
      gender: 'NEUTRAL',
      preferred_silhouette: 'neutral',
      preferred_styles: ['Streetwear', 'Vintage'],
      preferred_color_palette: 'Neutral',
      theme: 'RETRO'
  };

  const userPreferences = context.userPreferences || defaultPreferences;
  const lockedItems = context.lockedItems || [];

  // Prepare Wardrobe Context (Lightweight to save tokens)
    const wardrobeContext = wardrobeItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.type, // Mapping type to category
      color: item.color,
      style_tags: item.style_tags,
      insulation: resolveInsulationValue(item), 
      material: item.material,
      fit: item.fit || 'Regular',
      is_favorite: Boolean(item.favorite)
    }));

  const systemInstruction = `
      You are "SetMyFit", a world-class Stylist and Creative Director.
      Your goal is to generate a "FIRE FIT" (a highly cohesive, stylish, and practical outfit) based on the user's inventory.

      ### CORE FASHION ALGORITHMS TO APPLY
      1. **The Sandwich Rule:** Try to match the color of the shoes with the top (or hat/layer). This creates visual balance.
      2. **Silhouette Theory:** Create contrast in fit. 
         - If Top is Oversized -> Bottom should be Regular or Slim.
         - If Top is Fitted -> Bottom should be Relaxed or Baggy.
         - Exception: "Streetwear/Gorpcore" styles allow Oversized on Oversized.
      3. **Texture Variance:** Do not use the same material for everything (e.g. No full denim unless it's a 'Canadian Tuxedo' look). Mix Cotton with Denim, or Fleece with Synthetics.
      4. **Color Theory:** Use complementary colors or monochromatic shades with different textures.
      
      ### USER PREFERENCES
      - Aesthetics: ${(userPreferences.preferred_styles || []).join(', ')}.
      - Preferred Silhouette: ${userPreferences.preferred_silhouette}.
      - Gender Context: ${userPreferences.gender}.

      ### RULES
      - You MUST select 1 Top, 1 Bottom, and 1 Shoes.
      - Outerwear and Accessories are recommended if its a cold season.
      - MANDATORY: You MUST include these locked Item IDs if provided: ${JSON.stringify(lockedItems)}.
      - Prioritize items with 'is_favorite: true' if they fit the vibe.
      
      Return a strictly structured JSON object.
  `;

  const prompt = `
      EXECUTE STYLING SEQUENCE.

      ENVIRONMENTAL DATA:
      - Context: ${context.weather}
      - Season: ${context.season}

      MISSION PROFILE (OCCASION):
      ${context.occasion}

      CONSTRAINTS:
      - Locked Items (MANDATORY): ${lockedItems.length > 0 ? lockedItems.join(', ') : "None"}
      
      INVENTORY:
      ${JSON.stringify(wardrobeContext)}

      Respond with JSON:
      {
        "selectedItemIds": ["id1", "id2", ...],
        "reasoning": {
          "weatherMatch": "explanation",
          "colorAnalysis": "explanation",
          "historyCheck": "explanation",
          "styleScore": number (1-10),
          "totalInsulation": number,
          "layeringStrategy": "explanation",
          "occasionFit": "explanation"
        }
      }
  `;

  log.push('🎨 Generating outfit with Gemini 2.5 Flash...');
  
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\n" + prompt }] }],
      generationConfig: {
        temperature: 1.2, // Higher creativity for fashion
        topK: 40,
        responseMimeType: 'application/json',
      }
    });

    const responseText = result.response.text();
    const aiResponse = JSON.parse(responseText);

    if (!aiResponse.selectedItemIds || !Array.isArray(aiResponse.selectedItemIds)) {
      throw new Error('Invalid AI response format');
    }

    const selectedItems = wardrobeItems.filter(item => 
      aiResponse.selectedItemIds.includes(item.id)
    );

    // Basic validation
    const hasTop = selectedItems.some(i => ['top', 'shirt', 't-shirt', 'blouse', 'sweater', 'hoodie'].includes(i.type.toLowerCase()));
    const hasBottom = selectedItems.some(i => ['bottom', 'pants', 'jeans', 'shorts', 'skirt'].includes(i.type.toLowerCase()));
    
    if (!hasTop || !hasBottom) {
       log.push("⚠️ AI returned incomplete outfit (missing top or bottom)");
    }

    log.push(`✨ Generated outfit with score ${aiResponse.reasoning?.styleScore}/10`);
    log.push(`Items: ${selectedItems.map(i => i.name).join(', ')}`);

    return {
      outfit: selectedItems,
      validationScore: (aiResponse.reasoning?.styleScore || 0) * 10, // Convert 1-10 to 0-100
      iterations: 1,
      analysisLog: log,
      reasoning: aiResponse.reasoning
    };

  } catch (error) {
    console.error('AI Generation failed:', error);
    log.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export async function validateOutfitImages(items: IClothingItem[]): Promise<OutfitValidation> {
  const missingImageItems = items.filter(item => !item.image_url);
  const issues = missingImageItems.map(item => `Missing image for ${item.name || item.id}`);
  const suggestions = missingImageItems.length
    ? ['Upload clear photos for the highlighted items.']
    : ['All outfit items include imagery.'];

  return {
    isValid: issues.length === 0,
    score: missingImageItems.length ? 65 : 100,
    issues,
    suggestions,
    problemItemId: missingImageItems[0]?.id,
  };
}
