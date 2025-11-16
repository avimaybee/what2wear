import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { IClothingItem } from '@/lib/types';
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

const extractJsonSegment = <T>(source: string, pattern: RegExp): T | null => {
  const match = source.match(pattern);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse Gemini response JSON segment', error, { source });
    }
    return null;
  }
};

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
}> {
  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this clothing item image and extract metadata. Respond with only valid JSON (no markdown, no code blocks).

{
  "detectedType": "top|bottom|outerwear|shoes|accessory",
  "detectedColor": "#RRGGBB (hex color of main item color)",
  "detectedMaterial": "cotton|polyester|wool|denim|leather|silk|linen|etc",
  "detectedStyleTags": ["casual", "formal", "sporty", "vintage", "modern", "bold", "minimalist", "etc"]
}

Analyze the image and provide accurate JSON with no additional text.`,
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
        maxOutputTokens: 500,
      },
    };

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.ai.gemini.apiKey,
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

    const parts: unknown[] = data.candidates[0].content.parts;
    const textPart = parts.find((part) => {
      if (part && typeof part === 'object' && part !== null) {
        return 'text' in part;
      }
      return false;
    });

    if (!textPart || typeof textPart !== 'object' || !('text' in textPart)) {
      throw new Error('No text response from Gemini');
    }

    const text = textPart.text as string;
    const analysisResult = extractJsonSegment<{
      detectedType: string;
      detectedColor: string;
      detectedMaterial: string;
      detectedStyleTags: string[];
    }>(text, /\{[\s\S]*\}/);

    if (!analysisResult) {
      throw new Error('Failed to parse analysis result');
    }

    return analysisResult;
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
 * Analyze clothing item description to understand its characteristics
 */
export async function analyzeClothingDescription(item: IClothingItem): Promise<{
  style: string;
  formality: string;
  season_suitability: string;
  color_harmony: string[];
  occasion_fit: string[];
}> {
  const model = getTextModel();

  const prompt = `Analyze this clothing item and provide a detailed assessment:

Name: ${item.name}
Type: ${item.type}
Material: ${item.material}
Color: ${item.color || 'unspecified'}
Style Tags: ${item.style_tags?.join(', ') || 'none'}
Dress Code: ${item.dress_code.join(', ')}
Insulation: ${resolveInsulationValue(item)}/10

Provide a JSON response with:
{
  "style": "describe the overall style (e.g., casual, formal, sporty, vintage)",
  "formality": "rate formality level (casual/business-casual/formal/athletic)",
  "season_suitability": "which seasons this works for",
  "color_harmony": ["list of colors that would pair well with this item"],
  "occasion_fit": ["list of occasions this is suitable for"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const parsed = response ? extractJsonSegment<{
    style: string;
    formality: string;
    season_suitability: string;
    color_harmony: string[];
    occasion_fit: string[];
  }>(response, /\{[\s\S]*\}/) : null;

  if (parsed) {
    return parsed;
  }

  // Fallback if parsing fails
  return {
    style: 'casual',
    formality: item.dress_code[0] || 'casual',
    season_suitability: 'all seasons',
    color_harmony: ['neutral'],
    occasion_fit: ['everyday'],
  };
}

/**
 * Generate outfit combination suggestions based on context and item analysis
 */
export async function generateOutfitCombinations(
  items: IClothingItem[],
  context: {
    weather: string;
    occasion: string;
    season: string;
  }
): Promise<IClothingItem[][]> {
  const model = getTextModel();

  // Create detailed descriptions of all available items
  const itemDescriptions = items.map((item, idx) => ({
    id: idx,
    originalId: item.id,
    name: item.name,
    type: item.type,
    material: item.material,
    color: item.color,
    insulation: resolveInsulationValue(item),
    dressCode: item.dress_code,
    styleTags: item.style_tags,
  }));

  const prompt = `You are a professional fashion stylist. Create 3 complete outfit combinations from these clothing items:

Available Items:
${JSON.stringify(itemDescriptions, null, 2)}

Context:
- Weather: ${context.weather}
- Occasion: ${context.occasion}
- Season: ${context.season}

Requirements:
- Each outfit must include: Top, Bottom, Footwear, and optionally Outerwear
- Items must work well together in terms of style, color, and formality
- Outfit should be appropriate for the weather and occasion
- Consider color harmony and style coherence

Respond with a JSON array of 3 outfit combinations. Each combination should be an array of item IDs (using the 'id' field from above).

Example format:
[
  [0, 2, 4, 7],  // Outfit 1
  [1, 3, 5, 8],  // Outfit 2
  [0, 3, 4, 6]   // Outfit 3
]

Only respond with the JSON array, no additional text.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const combinations = response ? extractJsonSegment<number[][]>(response, /\[[\s\S]*\]/) : null;

  if (!combinations) {
    throw new Error('Failed to parse outfit combinations from AI response');
  }

  // Map back to actual clothing items
  return combinations.map(combo =>
    combo.map(idx => items[idx]).filter(Boolean)
  );
}

/**
 * Validate outfit by analyzing images of selected items
 */
export async function validateOutfitImages(
  items: IClothingItem[]
): Promise<{
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  problemItemId?: number;
}> {
  const model = getTextModel();

  // Fetch images and convert to base64
  const imageParts = await Promise.all(
    items.map(async (item) => {
      try {
        const response = await fetch(item.image_url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        
        return {
          inlineData: {
            data: base64,
            mimeType: 'image/jpeg',
          },
        };
      } catch (error) {
        console.error(`Failed to fetch image for ${item.name}:`, error);
        return null;
      }
    })
  );

  const validImages = imageParts.filter((img): img is { inlineData: { data: string; mimeType: string } } => img !== null);
  
  if (validImages.length === 0) {
    throw new Error('No valid images to analyze');
  }

  const itemList = items.map(item => `- ${item.name} (${item.type}, ${item.color})`).join('\n');

  const prompt = `You are an expert fashion stylist. Analyze these clothing items as a complete outfit:

Items in this outfit:
${itemList}

Evaluate the outfit based on:
1. Color coordination - Do the colors work well together?
2. Style coherence - Do the pieces match in style?
3. Formality level - Is the formality consistent across items?
4. Proportion and fit - Do the pieces look balanced together?
5. Overall aesthetic - Does this create a cohesive, attractive look?

Provide your analysis in JSON format:
{
  "isValid": true/false (whether the outfit works as a whole),
  "score": 0-100 (overall outfit quality score),
  "issues": ["list of specific problems if any"],
  "suggestions": ["how to improve the outfit"],
  "problemItemId": null or the index (0-based) of the most problematic item if any
}

Be critical but fair. An outfit is valid (isValid: true) if score >= 70.`;

  const result = await model.generateContent([prompt, ...validImages]);
  const response = result.response.text();

  const validation = response ? extractJsonSegment<{
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
    problemItemId?: number;
  }>(response, /\{[\s\S]*\}/) : null;

  if (!validation) {
    throw new Error('Failed to parse validation result from AI response');
  }

  return validation;
}

/**
 * Find a suitable replacement for a problematic item
 */
export async function findReplacementItem(
  problemItem: IClothingItem,
  outfitItems: IClothingItem[],
  availableItems: IClothingItem[],
  issues: string[]
): Promise<IClothingItem | null> {
  const model = getTextModel();

  // Get items of the same type that aren't already in the outfit
  const candidates = availableItems.filter(
    item => 
      item.type === problemItem.type && 
      item.id !== problemItem.id &&
      !outfitItems.some(oi => oi.id === item.id)
  );

  if (candidates.length === 0) {
    return null;
  }

  const outfitDescription = outfitItems
    .filter(item => item.id !== problemItem.id)
    .map(item => `- ${item.name} (${item.type}, ${item.color})`)
    .join('\n');

  const candidateDescriptions = candidates.map((item, idx) => ({
    id: idx,
    originalId: item.id,
    name: item.name,
    type: item.type,
    color: item.color,
    material: item.material,
    dressCode: item.dress_code,
  }));

  const prompt = `You are a fashion stylist. The outfit has these items:
${outfitDescription}

The problematic item is:
- ${problemItem.name} (${problemItem.type}, ${problemItem.color})

Issues identified:
${issues.join('\n')}

Available replacement options:
${JSON.stringify(candidateDescriptions, null, 2)}

Which replacement would best fix the outfit? Consider:
- Color harmony with existing items
- Style coherence
- Addressing the specific issues mentioned

Respond with just the ID (index) of the best replacement, or -1 if none are suitable.
Format: {"replacementId": 0}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const payload = response ? extractJsonSegment<{ replacementId: number }>(response, /\{[\s\S]*\}/) : null;

  if (!payload) {
    return null;
  }

  const { replacementId } = payload;

  if (replacementId >= 0 && replacementId < candidates.length) {
    return candidates[replacementId];
  }
  
  return null;
}

/**
 * Complete AI-powered outfit recommendation flow
 */
export async function generateAIOutfitRecommendation(
  wardrobeItems: IClothingItem[],
  context: {
    weather: string;
    occasion: string;
    season: string;
  },
  maxIterations: number = 3
): Promise<{
  outfit: IClothingItem[];
  validationScore: number;
  iterations: number;
  analysisLog: string[];
}> {
  const log: string[] = [];
  
  log.push('🤖 Starting AI outfit recommendation...');
  log.push(`Available items: ${wardrobeItems.length}`);
  
  // Step 1: Analyze all clothing descriptions
  log.push('📝 Analyzing clothing descriptions...');
  const analyses = await Promise.all(
    wardrobeItems.map(item => analyzeClothingDescription(item))
  );
  log.push(`✓ Analyzed ${analyses.length} items`);
  
  // Step 2: Generate outfit combinations
  log.push('🎨 Generating outfit combinations...');
  const combinations = await generateOutfitCombinations(wardrobeItems, context);
  log.push(`✓ Generated ${combinations.length} outfit ideas`);
  
  // Step 3: Validate each combination and pick the best
  let bestOutfit = combinations[0];
  let bestScore = 0;
  let iteration = 0;
  
  for (const combo of combinations) {
    if (combo.length < 3) continue; // Need at least 3 items
    
    log.push(`🔍 Validating combination ${iteration + 1}...`);
    
    let currentOutfit = combo;
    let attempts = 0;
    
    while (attempts < maxIterations) {
      attempts++;
      
      // Validate the outfit with image analysis
      const validation = await validateOutfitImages(currentOutfit);
      
      log.push(`  Attempt ${attempts}: Score ${validation.score}/100`);
      
      if (validation.score > bestScore) {
        bestScore = validation.score;
        bestOutfit = currentOutfit;
      }
      
      // If outfit is valid or we can't improve, stop
      if (validation.isValid || validation.score >= 85) {
        log.push(`  ✓ Outfit validated successfully!`);
        break;
      }
      
      // Try to fix the outfit
      if (validation.problemItemId !== null && validation.problemItemId !== undefined) {
        const problemItem = currentOutfit[validation.problemItemId];
        log.push(`  ⚠️ Issue with ${problemItem.name}. Finding replacement...`);
        
        const replacement = await findReplacementItem(
          problemItem,
          currentOutfit,
          wardrobeItems,
          validation.issues
        );
        
        if (replacement) {
          log.push(`  → Replacing with ${replacement.name}`);
          currentOutfit = currentOutfit.map((item, idx) =>
            idx === validation.problemItemId ? replacement : item
          );
        } else {
          log.push(`  → No suitable replacement found`);
          break;
        }
      } else {
        break;
      }
    }
    
    iteration++;
  }
  
  log.push(`\n✨ Final outfit score: ${bestScore}/100`);
  log.push(`Items: ${bestOutfit.map(i => i.name).join(', ')}`);
  
  return {
    outfit: bestOutfit,
    validationScore: bestScore,
    iterations: iteration,
    analysisLog: log,
  };
}
