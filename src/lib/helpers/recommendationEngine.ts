import {
  IClothingItem,
  RecommendationContext,
  RecommendationConstraints,
  OutfitRecommendation,
  DressCode,
  WeatherAlert,
  CalendarEvent,
  RecommendationDebugEvent,
} from '@/lib/types';
import { config } from '@/lib/config';
import chroma from 'chroma-js';

export type RecommendationDebugCollector = (event: RecommendationDebugEvent) => void;

// Item type where insulation_value has been resolved to a non-null number
export type ResolvedClothingItem = Omit<IClothingItem, 'insulation_value'> & { insulation_value: number };

const MATERIAL_INSULATION_PRESETS: Record<string, number> = {
  wool: 8,
  fleece: 7,
  leather: 6,
  denim: 5,
  cotton: 3,
  linen: 2,
  silk: 2,
  synthetic: 3,
  polyester: 3,
  nylon: 2,
  'gore-tex': 6,
  down: 8,
  default: 3,
};

const TYPE_INSULATION_BASELINE: Record<IClothingItem['type'], number> = {
  Outerwear: 7,
  Top: 3,
  Bottom: 4,
  Footwear: 3,
  Accessory: 1,
  Headwear: 2,
};

const clampInsulation = (value: number) => Math.min(10, Math.max(0, value));

export function resolveInsulationValue(item: Partial<IClothingItem>): number {
  const raw = item.insulation_value;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return clampInsulation(raw);
  }

  const materialKey = item.material?.toLowerCase();
  if (materialKey && MATERIAL_INSULATION_PRESETS[materialKey] !== undefined) {
    return MATERIAL_INSULATION_PRESETS[materialKey];
  }

  if (item.type && TYPE_INSULATION_BASELINE[item.type]) {
    return TYPE_INSULATION_BASELINE[item.type];
  }

  return MATERIAL_INSULATION_PRESETS.default;
}

// ============================================================================
// NEW SCORING LOGIC
// ============================================================================


/**
 * Task 1.4: Filter items by last_worn_date to ensure variety
 */
export function filterByLastWorn<T extends IClothingItem>(
  items: T[],
  minDaysSinceWorn: number = config.app.recommendations.minDaysSinceWorn
): T[] {
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
  }) as T[];
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
export function filterByDressCode<T extends IClothingItem>(
  items: T[],
  dressCode: DressCode
): T[] {
  return items.filter(item => 
    item.dress_code && item.dress_code.includes(dressCode)
  ) as T[];
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
    } catch (_e) {
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
 * Returns a penalty that reduces the score, not a hard -1000.
 * @param items - The items in the outfit.
 * @returns A negative score if patterns clash, otherwise 0.
 */
function scorePatternCohesion(items: IClothingItem[]): number {
  const patternedItems = items.filter(item => 
    item.pattern && item.pattern.toLowerCase() !== 'solid'
  );

  // No patterned items is fine
  if (patternedItems.length === 0) return 0;
  
  // One patterned item is fine
  if (patternedItems.length === 1) return 0;
  
  // Two patterned items: give a moderate penalty
  if (patternedItems.length === 2) return -30;
  
  // Three or more: heavy penalty but not outfit-killing
  return -50;
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

  const textureWeights = items.map(item => {
    const materialKey = (item.material ?? 'default').toLowerCase();
    return MATERIAL_TEXTURE_MAP[materialKey] ?? MATERIAL_TEXTURE_MAP.default;
  });

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
 * Returns negative score for disliked materials (penalty), positive for preferred.
 * @param items - The items in the outfit.
 * @param preferred - User's preferred materials.
 * @param disliked - User's disliked materials.
 * @returns A score from -50 to 100.
 */
function scoreMaterialPreference(items: IClothingItem[], preferred?: string[], disliked?: string[]): number {
  const itemMaterials = items.map(item => item.material?.toLowerCase() || '').filter(Boolean);
  
  if (!itemMaterials.length) return 50; // Neutral if no materials specified

  // Check for disliked materials first - penalty instead of hard rejection
  if (disliked && disliked.length > 0) {
    const dislikedMatches = itemMaterials.filter(mat => 
      disliked.some(d => mat.includes(d.toLowerCase()))
    ).length;
    
    if (dislikedMatches > 0) {
      // Apply penalty based on how many disliked materials
      return -25 * dislikedMatches; // -25 per disliked material
    }
  }

  // Bonus for preferred materials
  if (preferred && preferred.length > 0) {
    let matchCount = 0;
    for (const item of items) {
      if (item.material && preferred.some(p => 
        item.material!.toLowerCase().includes(p.toLowerCase())
      )) {
        matchCount++;
      }
    }
    return (matchCount / items.length) * 100;
  }

  return 50; // Neutral - no preferences set
}


/**
 * Calculates a total score for a given outfit combination.
 * All components now contribute positively or with moderate penalties.
 * Integrates learned preference boosts from user feedback for continuous improvement.
 */
function scoreOutfit(items: IClothingItem[], context: RecommendationContext): number {
  // Get all component scores
  const materialPrefScore = scoreMaterialPreference(items, context.user_preferences?.preferred_materials, context.user_preferences?.disliked_materials);
  const patternPenalty = scorePatternCohesion(items);
  const colorScore = scoreColorHarmony(items);
  const rawStyleScore = scoreStyleMatch(items);
  const materialHarmonyScore = scoreMaterialHarmony(items);
  const fitScore = scoreFitBalance(items, context.user_preferences?.fit_preference);
  const lastWornScore = scoreLastWorn(items);
  const stylePrefScore = scoreStylePreference(items, context.user_preferences?.styles);
  const colorPrefScore = scoreColorPreference(items, context.user_preferences?.colors);

  const normalizedStyleScore = Math.min(100, (rawStyleScore / 10) * 100);

  // Calculate base score from all positive components
  const baseScore = 
      (colorScore * 0.20) + 
      (normalizedStyleScore * 0.15) + 
      (materialHarmonyScore * 0.10) +
      (fitScore * 0.10) +
      (lastWornScore * 0.10) +
      (stylePrefScore * 0.15) +
      (colorPrefScore * 0.10) +
      (Math.max(0, materialPrefScore) * 0.10); // Only positive contribution
      
  // Apply penalties (these reduce but don't eliminate the score)
  const penalties = Math.min(0, materialPrefScore) + patternPenalty;
  
  // Apply learned preference boosts from user feedback
  // Each item gets boosted based on matching learned preferences
  let preferenceBoostTotal = 0;
  if (context.user_preferences) {
    const prefs = context.user_preferences;
    for (const item of items) {
      // Check for color match in learned preferences
      if (item.color && prefs.colors?.includes(item.color.toLowerCase())) {
        preferenceBoostTotal += 5; // 5 points per matching color item
      }
      
      // Check for style match in learned preferences
      if (item.style_tags && prefs.styles) {
        const styleMatches = item.style_tags.filter(tag => 
          prefs.styles?.includes(tag.toLowerCase())
        ).length;
        preferenceBoostTotal += styleMatches * 4; // 4 points per matching style tag
      }
      
      // Check for material match in learned preferences
      if (item.material && prefs.preferred_materials?.includes(item.material.toLowerCase())) {
        preferenceBoostTotal += 5; // 5 points per matching material item
      }
    }
  }
  
  // Final score: base score + penalties + learned preference boost, ensuring minimum of 0
  return Math.max(0, baseScore + penalties + preferenceBoostTotal);
}


/**
 * Task 1.4, 2.4, 3.3: Core recommendation logic
 * Gets outfit recommendations based on context and constraints
 */
export function getRecommendation(
  wardrobe: IClothingItem[],
  context: RecommendationContext,
  constraints?: RecommendationConstraints,
  debug?: RecommendationDebugCollector
): OutfitRecommendation {
  const emitDebug = (stage: string, meta?: Record<string, unknown>) => {
    if (!debug) return;
    debug({ stage, timestamp: new Date().toISOString(), meta });
  };

  let availableItems: ResolvedClothingItem[] = wardrobe.map(item => ({
    ...item,
    insulation_value: resolveInsulationValue(item),
  } as ResolvedClothingItem));
  const reasoning: string[] = [];

  // Task 1.4: Filter by last_worn_date for variety
  const minDaysSinceWorn = constraints?.min_days_since_worn || 
                          config.app.recommendations.minDaysSinceWorn;
  availableItems = filterByLastWorn(availableItems, minDaysSinceWorn);
  emitDebug('filter:lastWorn', { remaining: availableItems.length, minDaysSinceWorn });
  // Skip verbose filtering debug text

  // Task 2.4: Apply dress code constraint
  let dressCode = constraints?.dress_code;
  if (!dressCode && context.calendar_events) {
    dressCode = getDressCodeFromEvents(context.calendar_events);
  }
  
  if (dressCode) {
    availableItems = filterByDressCode(availableItems, dressCode);
    reasoning.push(`Selected ${dressCode} attire for your day`);
    emitDebug('filter:dressCode', { dressCode, remaining: availableItems.length });
  }

  // Calculate insulation needs based on weather
  const baseInsulation = calculateRequiredInsulation(context.weather.feels_like);
  
  // Task 2.4: Adjust for activity level
  const activityLevel = constraints?.activity_level || 
                       context.health_activity?.planned_activity_level;
  let requiredInsulation = adjustInsulationForActivity(baseInsulation, activityLevel);
  
  if (activityLevel) {
    reasoning.push(`Optimized for ${activityLevel.toLowerCase()} activity`);
  }

  // Adjust for user's temperature sensitivity
  const tempSensitivity = context.user_preferences?.temperature_sensitivity;
  if (tempSensitivity !== undefined && tempSensitivity !== null) {
    requiredInsulation = adjustInsulationForSensitivity(requiredInsulation, tempSensitivity);
  const _sensitivityDesc = tempSensitivity > 0 ? 'runs hot' : 'runs cold';
    reasoning.push(`Adjusted for your temperature preference`);
  }

  // Filter items by insulation (with some tolerance)
  const insulationTolerance = 2;
  const insulationFilteredItems = availableItems.filter(item => {
    const itemInsulation = resolveInsulationValue(item);
    return Math.abs(itemInsulation - requiredInsulation) <= insulationTolerance;
  });
  emitDebug('filter:insulation', { remaining: insulationFilteredItems.length, requiredInsulation });
  // Skip verbose insulation filter debug

  // Task 3.3: Consider weather alerts
  const alerts = constraints?.weather_alerts || [];
  if (alerts.length > 0) {
    // Prioritize items suitable for weather alerts
    const alertSuitableItems = insulationFilteredItems.filter(item => 
      isItemSuitableForAlerts(item, alerts)
    );
    
    if (alertSuitableItems.length > 0) {
      reasoning.push(`Added protection for ${alerts.map(a => a.type).join(', ').toLowerCase()}`);
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
    emitDebug('fallback:legacy', { reason: 'missing core category' });
    return getLegacyRecommendation(wardrobe, context, constraints, debug);
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
    emitDebug('fallback:legacy', { reason: 'no viable combinations' });
    return getLegacyRecommendation(wardrobe, context, constraints, debug);
  }

  // Sort combinations by score (highest first)
  combinations.sort((a, b) => b.score - a.score);

  // Add variety: instead of always picking the absolute best, select randomly from top candidates
  // This ensures each refresh shows a different outfit while maintaining quality
  const topCandidateCount = Math.min(5, Math.ceil(combinations.length * 0.2)); // Top 20% or 5 max
  emitDebug('generator:combinations', { count: combinations.length, topCandidateCount });
  const topCandidates = combinations.slice(0, topCandidateCount);
  
  // Select randomly from top candidates, weighted toward higher scores
  const selectedIndex = Math.floor(Math.random() * topCandidates.length);
  const selectedOutfit = topCandidates[selectedIndex];
  
  const bestOutfitItems = selectedOutfit.outfit;
  const bestScore = selectedOutfit.score;
  // Skip verbose scoring debug - user doesn't need to see internal scores

  const baseOutfitInsulation = bestOutfitItems.reduce((sum, item) => sum + resolveInsulationValue(item), 0);
  const insulationDeficit = requiredInsulation - baseOutfitInsulation;

  // Add outerwear if needed and available
  if (insulationDeficit > 1 && itemsByType.Outerwear.length > 0) {
    let bestOuterwear: IClothingItem | null = null;
    let bestOutfitWithOuterwearScore = -1;

    for (const outerwear of itemsByType.Outerwear) {
      // Only consider outerwear that helps meet the insulation deficit
      const outerwearInsulation = resolveInsulationValue(outerwear);
      if (outerwearInsulation >= insulationDeficit - insulationTolerance) {
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

    // --- Compose a more detailed, user-facing explanation ---
    try {
      const colorScore = scoreColorHarmony(bestOutfitItems);
      const rawStyleScore = scoreStyleMatch(bestOutfitItems);
      const styleScore = Math.min(100, (rawStyleScore / 10) * 100);
      const materialHarmony = scoreMaterialHarmony(bestOutfitItems);
      const fitScore = scoreFitBalance(bestOutfitItems, context.user_preferences?.fit_preference);
  const _lastWornScore = scoreLastWorn(bestOutfitItems);

      // Find shared style tags (if any)
      const allStyleTags = bestOutfitItems.map(i => new Set(i.style_tags || []));
      const sharedStyleTags: string[] = [];
      if (allStyleTags.length > 0) {
        const base = allStyleTags[0];
        for (const tag of Array.from(base)) {
          if (allStyleTags.every(s => s.has(tag))) sharedStyleTags.push(tag);
        }
      }

      const detailedParts: string[] = [];

      // Color & Material explanation
      if (colorScore >= 80) {
        detailedParts.push(`Color harmony: The pieces form a cohesive palette (score ${Math.round(colorScore)}/100). This creates a clean, visually balanced look.`);
      } else if (colorScore >= 40) {
        detailedParts.push(`Color pairing: The outfit mixes a neutral base with an accent color (score ${Math.round(colorScore)}/100), giving a subtle contrast that feels intentional.`);
      } else {
        detailedParts.push(`Color note: There are multiple accent colors (score ${Math.round(colorScore)}/100). This produces a more eclectic, expressive look; you can simplify by choosing a neutral shoe or top.`);
      }

      if (materialHarmony >= 50) {
        detailedParts.push(`Material & texture: The fabrics and textures work together (${Math.round(materialHarmony)}/100), adding depth without feeling busy.`);
      } else {
        detailedParts.push(`Material note: The outfit mixes contrasting textures (${Math.round(materialHarmony)}/100). This can be stylish when balanced, but pay attention to comfort.`);
      }

      // Style & fit explanation
      if (styleScore >= 60) {
        detailedParts.push(`Style alignment: Items share complementary style cues${sharedStyleTags.length ? ` (${sharedStyleTags.slice(0,3).join(', ')})` : ''} (score ${Math.round(styleScore)}/100), so the outfit reads as a single look.`);
      } else {
        detailedParts.push(`Style note: The outfit blends different style elements (score ${Math.round(styleScore)}/100). This can create a personalized hybrid look.`);
      }

      if (fitScore >= 70) {
        detailedParts.push(`Fit balance: The silhouettes complement each other (fit score ${Math.round(fitScore)}/100), creating a flattering proportion.`);
      } else {
        detailedParts.push(`Fit note: Silhouettes are less balanced (fit score ${Math.round(fitScore)}/100). Consider swapping to a slimmer or looser piece for improved balance.`);
      }

      // Practical/weather reasoning
      detailedParts.push(`Temperature & protection: Selected to match a feels-like temperature of ${context.weather.feels_like}°C with an estimated insulation level of ${baseOutfitInsulation} (target ${requiredInsulation}).`);

      if (alerts && alerts.length > 0) {
        detailedParts.push(`Safety & alerts: The recommendation considered active alerts (${alerts.map(a => a.type).join(', ')}), adding protection where appropriate.`);
      }

      detailedParts.push(`Recommendation confidence: ${(bestScore / 100 * 100).toFixed(0)}% based on color, style, fit and your preferences.`);

      emitDebug('selection:final', {
        itemIds: bestOutfitItems.map(item => item.id),
        score: bestScore,
        addedOuterwear: bestOutfitItems.length > 3,
      });

      // Append short summary reasoning too for compact places
      const detailedReasoning = detailedParts.join('\n\n');

      const result = {
        items: bestOutfitItems,
        confidence_score: bestScore / 100,
        reasoning: reasoning.join('. '),
        detailed_reasoning: detailedReasoning,
        alerts,
        context,
      };
      return result;
    } catch (_e) {
      // Fallback to the original simpler response if anything goes wrong
      emitDebug('selection:final', {
        itemIds: bestOutfitItems.map(item => item.id),
        score: bestScore,
        warning: 'formatter_failed',
      });
      return {
        items: bestOutfitItems,
        confidence_score: bestScore / 100,
        reasoning: reasoning.join('. '),
        alerts,
        context,
      };
    }
}

/**
 * Fallback to the old recommendation logic if the new one fails.
 */
function getLegacyRecommendation(
  wardrobe: IClothingItem[],
  context: RecommendationContext,
  constraints?: RecommendationConstraints,
  debug?: RecommendationDebugCollector
): OutfitRecommendation {
    // This is the original simple selection logic
    let availableItems = [...wardrobe];
    // Apply filters again for this self-contained fallback
    const minDaysSinceWorn = constraints?.min_days_since_worn || config.app.recommendations.minDaysSinceWorn;
    availableItems = filterByLastWorn(availableItems, minDaysSinceWorn);
    const requiredInsulation = calculateRequiredInsulation(context.weather.feels_like);
    const insulationTolerance = 2;
    availableItems = availableItems
      .map(item => ({ ...item, insulation_value: resolveInsulationValue(item) }))
      .filter(item => Math.abs(resolveInsulationValue(item) - requiredInsulation) <= insulationTolerance);

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

    const result = {
        items: selectedItems,
        confidence_score: 0.5, // Lower confidence for fallback
        reasoning: "Used fallback logic due to insufficient item variety for advanced recommendations.",
        alerts: constraints?.weather_alerts || [],
        context,
    };

    if (debug) {
      debug({
        stage: 'selection:legacy',
        timestamp: new Date().toISOString(),
        meta: {
          itemIds: selectedItems.map(item => item.id),
          remainingItems: availableItems.length,
        },
      });
    }

    return result;
}

// ============================================================================
// TEMPLATE-BASED RECOMMENDATION (NEW - Task 7)
// ============================================================================

import { 
  getTemplate, 
  detectAvailableTemplates, 
  isTemplateViable, 
  getItemsByTemplate 
} from '@/lib/helpers/outfitTemplates';

/**
 * Generate outfit recommendation based on a specific template.
 * Allows flexible outfit combinations instead of fixed Top + Bottom + Shoes.
 * 
 * Task 7: Implement flexible outfit templates system
 */
export function getRecommendationWithTemplate(
  wardrobe: IClothingItem[],
  context: RecommendationContext,
  templateId?: string,
  constraints?: RecommendationConstraints,
  debug?: RecommendationDebugCollector
): OutfitRecommendation {
  // If no template specified, detect available templates and use the best one
  const availableTemplates = detectAvailableTemplates(wardrobe);
  
  if (availableTemplates.length === 0) {
    // Fall back to standard recommendation if no templates available
    return getRecommendation(wardrobe, context, constraints, debug);
  }

  // Find the template to use
  let selectedTemplate = availableTemplates[0];
  if (templateId) {
    const requested = getTemplate(templateId);
    if (requested && isTemplateViable(requested, wardrobe)) {
      selectedTemplate = requested;
    }
  }

  // Get items grouped by type
  const itemsByType = getItemsByTemplate(selectedTemplate, wardrobe);
  const reasoning: string[] = [];

  reasoning.push(`Using ${selectedTemplate.name} template for outfit generation`);

  // Filter by constraints
  const filtered = { ...itemsByType };
  
  // Apply dress code constraint
  let dressCode = constraints?.dress_code;
  if (!dressCode && context.calendar_events) {
    dressCode = getDressCodeFromEvents(context.calendar_events);
  }
  
  if (dressCode) {
    for (const type of Object.keys(filtered) as Array<keyof typeof filtered>) {
      filtered[type] = filtered[type].filter(item => 
        item.dress_code && item.dress_code.includes(dressCode)
      );
    }
    reasoning.push(`Filtered for ${dressCode} dress code`);
  }

  // Filter by last worn date
  const minDaysSinceWorn = constraints?.min_days_since_worn || 
                          config.app.recommendations.minDaysSinceWorn;
  for (const type of Object.keys(filtered) as Array<keyof typeof filtered>) {
    filtered[type] = filterByLastWorn(filtered[type], minDaysSinceWorn);
  }

  // Apply insulation filtering for required types
  const requiredInsulation = calculateRequiredInsulation(context.weather.feels_like);
  const insulationTolerance = 2;
  
  for (const type of selectedTemplate.requiredTypes) {
    if (filtered[type]) {
      filtered[type] = filtered[type].filter(item =>
        Math.abs(resolveInsulationValue(item) - requiredInsulation) <= insulationTolerance
      );
    }
  }

  // Check if we still have items for all required types
  const hasRequiredItems = selectedTemplate.requiredTypes.every(type => 
    filtered[type] && filtered[type].length > 0
  );

  if (!hasRequiredItems) {
    // Fall back to standard recommendation if can't satisfy template
    reasoning.push('Insufficient items for template, using standard recommendation');
    return getRecommendation(wardrobe, context, constraints, debug);
  }

  // Select one item from each required type
  const outfit: IClothingItem[] = [];
  for (const type of selectedTemplate.requiredTypes) {
    const items = filtered[type];
    if (items.length > 0) {
      // Score items and select best
      const scoredItems = items.map(item => ({
        item,
        score: scoreOutfit([item], context),
      }));
      scoredItems.sort((a, b) => b.score - a.score);
      outfit.push(scoredItems[0].item);
    }
  }

  // Optionally add items from optional types if they improve the score
  for (const type of selectedTemplate.optionalTypes) {
    const items = filtered[type];
    if (items.length > 0) {
      const bestItem = items.reduce((best, current) => {
        const scoreWithCurrent = scoreOutfit([...outfit, current], context);
        const scoreWithoutCurrent = scoreOutfit(outfit, context);
        return scoreWithCurrent > scoreWithoutCurrent ? current : best;
      });
      
      // Only add if it improves the score
      const scoreWithBest = scoreOutfit([...outfit, bestItem], context);
      const scoreWithout = scoreOutfit(outfit, context);
      if (scoreWithBest > scoreWithout) {
        outfit.push(bestItem);
      }
    }
  }

  const finalScore = scoreOutfit(outfit, context);

  reasoning.push(`Selected outfit with ${outfit.length} items`);
  if (selectedTemplate.optionalTypes.length > 0) {
    const optionalCount = outfit.length - selectedTemplate.requiredTypes.length;
    if (optionalCount > 0) {
      reasoning.push(`Added ${optionalCount} accessory/optional items`);
    }
  }

  return {
    items: outfit,
    confidence_score: Math.min(1, finalScore / 100),
    reasoning: reasoning.join('. '),
    alerts: constraints?.weather_alerts || [],
    context,
  };
}

/**
 * Get available templates for the user's wardrobe
 * Task 7: Support for outfit templates
 */
export function getAvailableTemplatesForWardrobe(wardrobe: IClothingItem[]) {
  return detectAvailableTemplates(wardrobe);
}
