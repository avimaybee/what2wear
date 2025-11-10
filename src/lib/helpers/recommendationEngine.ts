import {
  IClothingItem,
  RecommendationContext,
  RecommendationConstraints,
  OutfitRecommendation,
  DressCode,
  WeatherAlert,
  CalendarEvent,
} from '@/lib/types';
import { config } from '@/lib/config';
import chroma from 'chroma-js';

// ============================================================================
// NEW SCORING LOGIC
// ============================================================================


/**
 * Task 1.4: Filter items by last_worn_date to ensure variety
 */
export function filterByLastWorn(
  items: IClothingItem[],
  minDaysSinceWorn: number = config.app.recommendations.minDaysSinceWorn
): IClothingItem[] {
  const now = new Date();
  const minMilliseconds = minDaysSinceWorn * 24 * 60 * 60 * 1000;

  return items.filter(item => {
    // Always include favorite items
    if (item.favorite) {
      return true;
    }
    
    if (!item.last_worn_date) {
      // Never worn items are always eligible
      return true;
    }

    const lastWorn = new Date(item.last_worn_date);
    const timeSinceWorn = now.getTime() - lastWorn.getTime();
    
    return timeSinceWorn >= minMilliseconds;
  });
}

/**
 * Task 2.4: Determine dress code constraint from calendar events
 */
export function getDressCodeFromEvents(events: CalendarEvent[]): DressCode | undefined {
  if (!events || events.length === 0) {
    return undefined;
  }

  // Prioritize most formal event type
  const hasWorkEvent = events.some(e => e.event_type === 'Work/Business');
  const hasGymEvent = events.some(e => e.event_type === 'Gym/Active');
  
  if (hasWorkEvent) {
    return 'Business Casual';
  }
  
  if (hasGymEvent) {
    return 'Athletic';
  }
  
  return 'Casual';
}

/**
 * Task 2.4: Filter items by dress code
 */
export function filterByDressCode(
  items: IClothingItem[],
  dressCode: DressCode
): IClothingItem[] {
  return items.filter(item => 
    item.dress_code && item.dress_code.includes(dressCode)
  );
}

/**
 * Task 2.4: Adjust insulation requirement based on activity level
 */
export function adjustInsulationForActivity(
  baseInsulation: number,
  activityLevel?: 'Low' | 'Medium' | 'High'
): number {
  if (!activityLevel) {
    return baseInsulation;
  }

  // Higher activity = less insulation needed
  const adjustments = {
    'Low': 0,
    'Medium': -1,
    'High': -2,
  };

  return Math.max(0, baseInsulation + adjustments[activityLevel]);
}

/**
 * Adjusts insulation requirement based on user's temperature sensitivity.
 */
export function adjustInsulationForSensitivity(
  baseInsulation: number,
  sensitivity?: number // -2 (runs cold) to +2 (runs hot)
): number {
  if (sensitivity === undefined || sensitivity === null) {
    return baseInsulation;
  }
  // sensitivity > 0 means user runs hot, so they need LESS insulation.
  // sensitivity < 0 means user runs cold, so they need MORE insulation.
  // We'll adjust by 1 insulation point per sensitivity point.
  const adjustment = sensitivity * -1;
  return Math.max(0, baseInsulation + adjustment);
}

/**
 * Task 3.3: Check if item is suitable for weather alerts
 */
export function isItemSuitableForAlerts(
  item: IClothingItem,
  alerts: WeatherAlert[]
): boolean {
  // If there are UV alerts and item is headwear or accessory, it's suitable
  const hasUVAlert = alerts.some(a => a.type === 'UV' && a.severity === 'high');
  if (hasUVAlert && (item.type === 'Headwear' || item.type === 'Accessory')) {
    return true;
  }

  // If there are AQI/Pollen alerts and item is outerwear with hood, it's suitable
  const hasAirAlert = alerts.some(a => 
    (a.type === 'AQI' || a.type === 'Pollen') && a.severity === 'high'
  );
  if (hasAirAlert && item.type === 'Outerwear') {
    return true;
  }

  return false;
}

/**
 * Calculate required insulation based on temperature
 */
export function calculateRequiredInsulation(temperature: number): number {
  // Simplified insulation scale (0-10)
  // Below 0°C: 9-10 (very warm)
  // 0-10°C: 7-8 (warm)
  // 10-20°C: 5-6 (moderate)
  // 20-25°C: 3-4 (light)
  // Above 25°C: 0-2 (minimal)
  
  if (temperature < 0) return 9;
  if (temperature <= 10) return 7;
  if (temperature <= 20) return 5;
  if (temperature <= 25) return 3;
  return 1;
}

import chroma from 'chroma-js';

// ============================================================================
// NEW SCORING LOGIC
// ============================================================================

const NEUTRAL_COLORS = ['black', 'white', 'gray', 'grey', 'silver', 'ivory', 'beige', 'navy', 'khaki'];

/**
 * Scores the color harmony of an outfit.
 * @param items - The items in the outfit.
 * @returns A score from 0 to 100.
 */
function scoreColorHarmony(items: IClothingItem[]): number {
  const colors = items.map(item => {
    if (item.material && item.material.toLowerCase() === 'denim') {
      return 'navy'; // Treat denim as a neutral navy color
    }
    return item.color ? item.color.toLowerCase() : 'white';
  });

  const mainColors = colors.filter(color => !NEUTRAL_COLORS.includes(color));
  const uniqueMainColors = [...new Set(mainColors)];

  if (uniqueMainColors.length <= 1) {
    // Monochromatic or one accent color - very harmonious
    return 100;
  }

  if (uniqueMainColors.length === 2) {
    const [color1, color2] = uniqueMainColors;
    try {
      const distance = chroma.distance(color1, color2);
      // CIEDE2000 distance: <10 is imperceptible, >50 is opposite.
      // We want colors that are not too similar but not clashing.
      // Ideal distance might be in the 30-70 range.
      if (distance > 30 && distance < 80) {
        return 80; // Good separation
      }
      if (distance >= 80) {
        return 90; // High contrast, likely complementary
      }
      return 40; // Too similar
    } catch (e) {
      return 20; // Invalid color string
    }
  }

  // More than 2 main colors - likely chaotic
  return 0;
}

/**
 * Scores the style compatibility of an outfit.
 * @param items - The items in the outfit.
 * @returns A raw score based on number of shared style tags.
 */
function scoreStyleMatch(items: IClothingItem[]): number {
  const setsOfTags = items.map(item => new Set(item.style_tags || []));
  if (setsOfTags.length < 2) return 2.5; // Return a baseline score (equates to 50 after normalization)

  let sharedTags = 0;
  for (let i = 0; i < setsOfTags.length; i++) {
    for (let j = i + 1; j < setsOfTags.length; j++) {
      const intersection = new Set([...setsOfTags[i]].filter(x => setsOfTags[j].has(x)));
      sharedTags += intersection.size;
    }
  }
  // Return the raw score. Let the caller normalize it.
  return sharedTags;
}

/**
 * Scores an outfit based on how recently its items were worn.
 * @param items - The items in the outfit.
 * @returns A score from 0 to 100.
 */
function scoreLastWorn(items: IClothingItem[]): number {
    const now = new Date().getTime();
    const daysSinceWorn = items.map(item => {
        if (!item.last_worn_date) return 365; // Treat never-worn items as worn a year ago
        const lastWorn = new Date(item.last_worn_date).getTime();
        return (now - lastWorn) / (1000 * 3600 * 24);
    });

    const averageDays = daysSinceWorn.reduce((sum, days) => sum + days, 0) / daysSinceWorn.length;

    // Normalize score: 100 if avg is > 30 days, linear otherwise
    return Math.min(100, (averageDays / 30) * 100);
}

/**
 * Penalizes outfits with clashing patterns.
 * @param items - The items in the outfit.
 * @returns A large negative number if patterns clash, otherwise 0.
 */
function scorePatternCohesion(items: IClothingItem[]): number {
  const patternedItems = items.filter(item => 
    item.pattern && item.pattern.toLowerCase() !== 'solid'
  ).length;

  // Allow one patterned item, penalize heavily for more.
  return patternedItems > 1 ? -1000 : 0;
}

const MATERIAL_TEXTURE_MAP: Record<string, number> = {
  leather: 9, wool: 8, denim: 7, fleece: 6, linen: 5, 
  cotton: 4, silk: 3, synthetic: 2, 'gore-tex': 2, polyester: 2, nylon: 2,
  default: 4,
};

/**
 * Scores the harmony of materials/textures in an outfit.
 * @param items - The items in the outfit.
 * @returns A score from 0 to 100 based on texture variety.
 */
function scoreMaterialHarmony(items: IClothingItem[]): number {
  if (items.length < 2) return 50;

  const textureWeights = items.map(item => 
    MATERIAL_TEXTURE_MAP[item.material?.toLowerCase()] || MATERIAL_TEXTURE_MAP.default
  );

  // Calculate standard deviation of texture weights
  const mean = textureWeights.reduce((a, b) => a + b, 0) / textureWeights.length;
  const variance = textureWeights.map(w => (w - mean) ** 2).reduce((a, b) => a + b, 0) / textureWeights.length;
  const stdDev = Math.sqrt(variance);

  // Normalize score. A std dev of 2-3 is good variety.
  return Math.min(100, (stdDev / 2.5) * 100);
}

/**
 * Scores the balance of fits in an outfit (e.g., baggy top with slim bottoms).
 * @param items - The items in the outfit.
 * @returns A score from 0 to 100.
 */
function scoreFitBalance(items: IClothingItem[], preference?: 'Slim' | 'Regular' | 'Oversized'): number {
  const top = items.find(i => i.type === 'Top');
  const bottom = items.find(i => i.type === 'Bottom');

  let balanceScore = 50; // Start with a neutral score

  if (top?.fit && bottom?.fit) {
    const topFit = top.fit.toLowerCase();
    const bottomFit = bottom.fit.toLowerCase();

    if (topFit === 'oversized' && bottomFit === 'slim') balanceScore = 100;
    else if (topFit === 'slim' && (bottomFit === 'relaxed' || bottomFit === 'oversized')) balanceScore = 100;
    else if (topFit === 'regular' && bottomFit === 'regular') balanceScore = 80;
    else if (topFit === 'oversized' && bottomFit === 'oversized') balanceScore = 10;
    else balanceScore = 60;
  }

  // Adjust score based on preference
  if (preference) {
    let preferenceBonus = 0;
    const pref = preference.toLowerCase();
    for (const item of items) {
      if (item.fit && item.fit.toLowerCase() === pref) {
        preferenceBonus += 20; // Add 20 points for each matching item
      }
    }
    // Average the balance score and the preference bonus
    return (balanceScore + Math.min(100, preferenceBonus)) / 2;
  }

  return balanceScore;
}

/**
 * Scores an outfit based on user's preferred styles.
 */
function scoreStylePreference(items: IClothingItem[], preferredStyles?: string[]): number {
  if (!preferredStyles || preferredStyles.length === 0) return 50; // Neutral score

  let matchCount = 0;
  for (const item of items) {
    if (item.style_tags?.some(tag => preferredStyles.includes(tag))) {
      matchCount++;
    }
  }

  // Score based on the proportion of items that match a preferred style
  return (matchCount / items.length) * 100;
}

/**
 * Scores an outfit based on user's preferred colors.
 */
function scoreColorPreference(items: IClothingItem[], preferredColors?: string[]): number {
  if (!preferredColors || preferredColors.length === 0) return 50; // Neutral score

  let matchCount = 0;
  for (const item of items) {
    if (item.color && preferredColors.includes(item.color.toLowerCase())) {
      matchCount++;
    }
  }

  return (matchCount / items.length) * 100;
}

/**
 * Scores an outfit based on material preferences, penalizing disliked materials.
 */
function scoreMaterialPreference(items: IClothingItem[], preferred?: string[], disliked?: string[]): number {
  if (!preferred && !disliked) return 50; // Neutral score

  // Heavy penalty for any disliked material
  if (disliked && disliked.length > 0) {
    for (const item of items) {
      if (item.material && disliked.includes(item.material.toLowerCase())) {
        return -1000; // Disqualify outfit
      }
    }
  }

  // Bonus for preferred materials
  if (preferred && preferred.length > 0) {
    let matchCount = 0;
    for (const item of items) {
      if (item.material && preferred.includes(item.material.toLowerCase())) {
        matchCount++;
      }
    }
    return (matchCount / items.length) * 100;
  }

  return 50; // No disliked materials, but no preferred ones either
}


/**
 * Calculates a total score for a given outfit combination.
 * Weights are adjusted to incorporate new, more nuanced metrics.
 */
function scoreOutfit(items: IClothingItem[], context: RecommendationContext): number {
  // Penalties first
  const materialPrefScore = scoreMaterialPreference(items, context.user_preferences?.preferred_materials, context.user_preferences?.disliked_materials);
  if (materialPrefScore < 0) return materialPrefScore;

  const patternPenalty = scorePatternCohesion(items);
  if (patternPenalty < 0) return patternPenalty;

  const colorScore = scoreColorHarmony(items);
  const rawStyleScore = scoreStyleMatch(items);
  const materialHarmonyScore = scoreMaterialHarmony(items);
  const fitScore = scoreFitBalance(items, context.user_preferences?.fit_preference);
  const lastWornScore = scoreLastWorn(items);
  const stylePrefScore = scoreStylePreference(items, context.user_preferences?.styles);
  const colorPrefScore = scoreColorPreference(items, context.user_preferences?.colors);

  const normalizedStyleScore = Math.min(100, (rawStyleScore / 10) * 100);

  // Rebalance weights
  const totalScore = 
      (colorScore * 0.20) + 
      (normalizedStyleScore * 0.15) + 
      (materialHarmonyScore * 0.10) +
      (fitScore * 0.10) +
      (lastWornScore * 0.10) +
      (stylePrefScore * 0.15) +
      (colorPrefScore * 0.10) +
      (materialPrefScore * 0.10);
      
  return totalScore;
}


/**
 * Task 1.4, 2.4, 3.3: Core recommendation logic
 * Gets outfit recommendations based on context and constraints
 */
export function getRecommendation(
  wardrobe: IClothingItem[],
  context: RecommendationContext,
  constraints?: RecommendationConstraints
): OutfitRecommendation {
  let availableItems = [...wardrobe];
  const reasoning: string[] = [];

  // Task 1.4: Filter by last_worn_date for variety
  const minDaysSinceWorn = constraints?.min_days_since_worn || 
                          config.app.recommendations.minDaysSinceWorn;
  availableItems = filterByLastWorn(availableItems, minDaysSinceWorn);
  reasoning.push(`Filtered to items not worn in the last ${minDaysSinceWorn} days`);

  // Task 2.4: Apply dress code constraint
  let dressCode = constraints?.dress_code;
  if (!dressCode && context.calendar_events) {
    dressCode = getDressCodeFromEvents(context.calendar_events);
  }
  
  if (dressCode) {
    const beforeCount = availableItems.length;
    availableItems = filterByDressCode(availableItems, dressCode);
    reasoning.push(`Applied ${dressCode} dress code (${beforeCount} → ${availableItems.length} items)`);
  }

  // Calculate insulation needs based on weather
  const baseInsulation = calculateRequiredInsulation(context.weather.feels_like);
  
  // Task 2.4: Adjust for activity level
  const activityLevel = constraints?.activity_level || 
                       context.health_activity?.planned_activity_level;
  let requiredInsulation = adjustInsulationForActivity(baseInsulation, activityLevel);
  
  if (activityLevel) {
    reasoning.push(`Adjusted insulation for ${activityLevel} activity level`);
  }

  // Adjust for user's temperature sensitivity
  const tempSensitivity = context.user_preferences?.temperature_sensitivity;
  if (tempSensitivity !== undefined && tempSensitivity !== null) {
    requiredInsulation = adjustInsulationForSensitivity(requiredInsulation, tempSensitivity);
    const sensitivityDesc = tempSensitivity > 0 ? 'runs hot' : 'runs cold';
    reasoning.push(`Adjusted for user preference that ${sensitivityDesc} (sensitivity: ${tempSensitivity})`);
  }

  // Filter items by insulation (with some tolerance)
  const insulationTolerance = 2;
  const insulationFilteredItems = availableItems.filter(item => 
    Math.abs(item.insulation_value - requiredInsulation) <= insulationTolerance
  );
  reasoning.push(`Filtered by insulation value (target: ${requiredInsulation}±${insulationTolerance})`);

  // Task 3.3: Consider weather alerts
  const alerts = constraints?.weather_alerts || [];
  if (alerts.length > 0) {
    // Prioritize items suitable for weather alerts
    const alertSuitableItems = insulationFilteredItems.filter(item => 
      isItemSuitableForAlerts(item, alerts)
    );
    
    if (alertSuitableItems.length > 0) {
      reasoning.push(`Prioritized items suitable for weather alerts (${alerts.map(a => a.type).join(', ')})`);
    }
  }

  // --- NEW: Outfit Generation and Scoring ---

  const itemsByType = {
    Tops: insulationFilteredItems.filter(i => i.type === 'Top'),
    Bottoms: insulationFilteredItems.filter(i => i.type === 'Bottom'),
    Footwear: insulationFilteredItems.filter(i => i.type === 'Footwear'),
    Outerwear: insulationFilteredItems.filter(i => i.type === 'Outerwear'),
  };

  // Ensure we have at least one of each core item type
  if (itemsByType.Tops.length === 0 || itemsByType.Bottoms.length === 0 || itemsByType.Footwear.length === 0) {
    // Fallback to old logic if not enough items for new logic
    return getLegacyRecommendation(wardrobe, context, constraints);
  }

  const combinations: { outfit: IClothingItem[], score: number }[] = [];
  for (const top of itemsByType.Tops) {
    for (const bottom of itemsByType.Bottoms) {
      for (const footwear of itemsByType.Footwear) {
        const baseOutfit = [top, bottom, footwear];
        combinations.push({
          outfit: baseOutfit,
          score: scoreOutfit(baseOutfit, context),
        });
      }
    }
  }
  
  if (combinations.length === 0) {
    return getLegacyRecommendation(wardrobe, context, constraints);
  }

  combinations.sort((a, b) => b.score - a.score);

  let bestOutfitItems = combinations[0].outfit;
  const bestScore = combinations[0].score;
  reasoning.push(`Found ${combinations.length} potential outfits. Best score: ${bestScore.toFixed(0)}/100.`);

  const baseOutfitInsulation = bestOutfitItems.reduce((sum, item) => sum + item.insulation_value, 0);
  const insulationDeficit = requiredInsulation - baseOutfitInsulation;

  // Add outerwear if needed and available
  if (insulationDeficit > 1 && itemsByType.Outerwear.length > 0) {
    let bestOuterwear: IClothingItem | null = null;
    let bestOutfitWithOuterwearScore = -1;

    for (const outerwear of itemsByType.Outerwear) {
      // Only consider outerwear that helps meet the insulation deficit
      if (outerwear.insulation_value >= insulationDeficit - insulationTolerance) {
        const outfitWithOuterwear = [...bestOutfitItems, outerwear];
        const score = scoreOutfit(outfitWithOuterwear, context);
        if (score > bestOutfitWithOuterwearScore) {
          bestOutfitWithOuterwearScore = score;
          bestOuterwear = outerwear;
        }
      }
    }

    if (bestOuterwear) {
      bestOutfitItems.push(bestOuterwear);
      reasoning.push(`Added outerwear for warmth and style compatibility.`);
    }
  }


  return {
    items: bestOutfitItems,
    confidence_score: bestScore / 100,
    reasoning: reasoning.join('. '),
    alerts,
    context,
  };
}

/**
 * Fallback to the old recommendation logic if the new one fails.
 */
function getLegacyRecommendation(
  wardrobe: IClothingItem[],
  context: RecommendationContext,
  constraints?: RecommendationConstraints
): OutfitRecommendation {
    // This is the original simple selection logic
    let availableItems = [...wardrobe];
    // Apply filters again for this self-contained fallback
    const minDaysSinceWorn = constraints?.min_days_since_worn || config.app.recommendations.minDaysSinceWorn;
    availableItems = filterByLastWorn(availableItems, minDaysSinceWorn);
    const requiredInsulation = calculateRequiredInsulation(context.weather.feels_like);
    const insulationTolerance = 2;
    availableItems = availableItems.filter(item => Math.abs(item.insulation_value - requiredInsulation) <= insulationTolerance);

    const selectedItems: IClothingItem[] = [];
    const itemTypes: Array<IClothingItem['type']> = ['Top', 'Bottom', 'Footwear', 'Outerwear'];
    
    for (const type of itemTypes) {
        const itemsOfType = availableItems.filter(item => item.type === type);
        if (itemsOfType.length > 0) {
            const sorted = itemsOfType.sort((a, b) => {
                if (!a.last_worn_date) return -1;
                if (!b.last_worn_date) return 1;
                return new Date(a.last_worn_date).getTime() - new Date(b.last_worn_date).getTime();
            });
            selectedItems.push(sorted[0]);
        }
    }

    return {
        items: selectedItems,
        confidence_score: 0.5, // Lower confidence for fallback
        reasoning: "Used fallback logic due to insufficient item variety for advanced recommendations.",
        alerts: constraints?.weather_alerts || [],
        context,
    };
}
