import {
  IClothingItem,
  RecommendationContext,
  RecommendationConstraints,
  OutfitRecommendation,
  DressCode,
  WeatherAlert,
  CalendarEvent,
  RecommendationDebugEvent,
  ClothingType,
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

const SEASON_SYNONYMS: Record<string, string> = {
  fall: 'autumn',
  autumn: 'autumn',
  spring: 'spring',
  summer: 'summer',
  winter: 'winter',
};

const normalizeSeasonName = (season?: string | null): string => {
  if (!season) {
    return '';
  }
  const key = season.trim().toLowerCase();
  return SEASON_SYNONYMS[key] ?? key;
};

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
 * Filter items by season suitability
 * Prioritizes items tagged for the current season, but doesn't completely exclude others
 */
export function filterBySeason<T extends IClothingItem>(
  items: T[],
  currentSeason: string
): { seasonal: T[]; neutral: T[]; offSeason: T[] } {
  const normalizedSeason = normalizeSeasonName(currentSeason);

  if (!normalizedSeason) {
    return {
      seasonal: [],
      neutral: items,
      offSeason: [],
    };
  }

  const seasonal: T[] = [];
  const neutral: T[] = [];
  const offSeason: T[] = [];

  for (const item of items) {
    if (!item.season_tags || item.season_tags.length === 0) {
      neutral.push(item);
      continue;
    }

    const normalizedTags = item.season_tags
      .map(tag => normalizeSeasonName(tag))
      .filter(Boolean);

    if (normalizedTags.includes(normalizedSeason)) {
      seasonal.push(item);
    } else {
      offSeason.push(item);
    }
  }

  return { seasonal, neutral, offSeason };
}

/**
 * Task 1.4: Filter items by last_worn to ensure variety
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
    
    if (!item.last_worn) {
      // Never worn items are always eligible
      return true;
    }

    const lastWorn = new Date(item.last_worn);
    const timeSinceWorn = now.getTime() - lastWorn.getTime();
    
    return timeSinceWorn >= minMilliseconds;
  }) as T[];
}

const normalizeClothingType = (item: Partial<IClothingItem>): string | null => {
  const explicitType = item.type?.toString().toLowerCase();
  if (explicitType) {
    return explicitType;
  }
  const category = item.category?.toString().toLowerCase();
  return category ?? null;
};

function hasCoreTypeCoverage(items: IClothingItem[]): boolean {
  if (!items.length) {
    return false;
  }

  const hasTop = items.some(item => {
    const type = normalizeClothingType(item);
    return type === 'top' || type === 'outerwear';
  });
  const hasBottom = items.some(item => normalizeClothingType(item) === 'bottom');
  const hasFootwear = items.some(item => normalizeClothingType(item) === 'footwear');

  return hasTop && hasBottom && hasFootwear;
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
 * This is the target insulation PER ITEM (roughly) for filtering.
 */
export function calculateRequiredInsulation(temperature: number): number {
  // Adjusted thresholds to be slightly warmer
  // Below 0°C: 9-10 (very warm)
  // 0-10°C: 7-8 (warm)
  // 10-18°C: 5-6 (moderate) - Changed from 20 to 18
  // 18-24°C: 3-4 (light) - Changed from 20-25 to 18-24
  // Above 24°C: 1-2 (minimal)
  
  if (temperature < 0) return 9;
  if (temperature <= 10) return 7;
  if (temperature <= 18) return 5;
  if (temperature <= 24) return 3;
  return 1;
}

/**
 * Calculate target TOTAL outfit insulation based on temperature.
 * Used to determine if layering is needed.
 */
function calculateTargetTotalInsulation(temperature: number): number {
  // Heuristic targets for total outfit warmth (sum of all items)
  // 25°C+: ~8 (Light items)
  // 20°C: ~12 (T-shirt + Jeans + Sneakers)
  // 15°C: ~18 (Sweater + Jeans + Boots)
  // 10°C: ~25 (Add Jacket)
  // 0°C: ~35 (Heavy layers)
  
  if (temperature >= 25) return 8;
  if (temperature >= 20) return 12;
  if (temperature >= 15) return 18;
  if (temperature >= 10) return 25;
  if (temperature >= 0) return 35;
  return 45; // Very cold
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
        if (!item.last_worn) return 365; // Treat never-worn items as worn a year ago
        const lastWorn = new Date(item.last_worn).getTime();
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

function scoreSeasonalSuitability(items: IClothingItem[], currentSeason?: string): number {
  const normalizedSeason = normalizeSeasonName(currentSeason);
  if (!normalizedSeason) {
    return 60; // Slightly above neutral when we do not know the season
  }

  let taggedCount = 0;
  let matches = 0;

  for (const item of items) {
    if (!item.season_tags || item.season_tags.length === 0) {
      continue;
    }

    taggedCount++;
    const normalizedTags = item.season_tags
      .map(tag => normalizeSeasonName(tag))
      .filter(Boolean);

    if (normalizedTags.includes(normalizedSeason)) {
      matches++;
    }
  }

  if (taggedCount === 0) {
    return 55; // Neutral if no items have season metadata
  }

  return Math.round((matches / taggedCount) * 100);
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
    const seasonScore = scoreSeasonalSuitability(items, context.weather?.season);

  const normalizedStyleScore = Math.min(100, (rawStyleScore / 10) * 100);

  // Calculate base score from all positive components
  const baseScore = 
      (colorScore * 0.18) + 
      (normalizedStyleScore * 0.13) + 
      (materialHarmonyScore * 0.09) +
      (fitScore * 0.09) +
      (lastWornScore * 0.09) +
      (stylePrefScore * 0.13) +
      (colorPrefScore * 0.09) +
      (Math.max(0, materialPrefScore) * 0.10) +
      (seasonScore * 0.10); // Prioritize seasonally-appropriate pairings
      
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

  const ensureCoreCoverage = (
    pool: ResolvedClothingItem[],
    fallbackPool: ResolvedClothingItem[],
    stage: string
  ): ResolvedClothingItem[] => {
    if (hasCoreTypeCoverage(pool)) {
      return pool;
    }

    const mergedPool = [...pool];
    const additions: Array<number | null> = [];
    const predicates = [
      {
        label: 'top',
        matcher: (item: ResolvedClothingItem) =>
          normalizeClothingType(item) === 'top' || normalizeClothingType(item) === 'outerwear',
      },
      {
        label: 'bottom',
        matcher: (item: ResolvedClothingItem) => normalizeClothingType(item) === 'bottom',
      },
      {
        label: 'footwear',
        matcher: (item: ResolvedClothingItem) => normalizeClothingType(item) === 'footwear',
      },
    ];

    for (const predicate of predicates) {
      const hasType = mergedPool.some(predicate.matcher);
      if (hasType) {
        continue;
      }

      const replacement = fallbackPool.find(
        (item) => predicate.matcher(item) && !mergedPool.some((existing) => existing.id === item.id)
      );

      if (replacement) {
        mergedPool.push(replacement);
        additions.push(typeof replacement.id === 'number' ? replacement.id : null);
      }
    }

    if (hasCoreTypeCoverage(mergedPool)) {
      emitDebug(`${stage}:coverageRestore`, {
        added: additions.filter((id) => id !== null),
        finalCount: mergedPool.length,
      });
      return mergedPool;
    }

    emitDebug(`${stage}:coverageFallback`, {
      fallbackCount: fallbackPool.length,
    });
    return fallbackPool;
  };

  const enhancementSuggestions: string[] = [];
  const wardrobeGapSuggestions: string[] = [];

  const describeItem = (item: IClothingItem) => {
    const labelParts = [item.color, item.name].filter(Boolean);
    if (labelParts.length > 0) {
      return labelParts.join(' ').trim();
    }
    return item.type;
  };

  let availableItems: ResolvedClothingItem[] = wardrobe.map(item => ({
    ...item,
    insulation_value: resolveInsulationValue(item),
  } as ResolvedClothingItem));
  const reasoning: string[] = [];

  // Task 1.4: Filter by last_worn for variety
  const minDaysSinceWorn = constraints?.min_days_since_worn || 
                          config.app.recommendations.minDaysSinceWorn;
  const beforeLastWornFilter = [...availableItems];
  let lastWornFiltered = filterByLastWorn(availableItems, minDaysSinceWorn) as ResolvedClothingItem[];
  lastWornFiltered = ensureCoreCoverage(lastWornFiltered, beforeLastWornFilter, 'filter:lastWorn');
  availableItems = lastWornFiltered;
  emitDebug('filter:lastWorn', { remaining: availableItems.length, minDaysSinceWorn });
  // Skip verbose filtering debug text

  // Filter by season if season information is available
  if (context.weather.season) {
    const { seasonal, neutral, offSeason } = filterBySeason(availableItems, context.weather.season);
    const prioritizedPool = [...seasonal, ...neutral];
    const appliedSeasonFilter = prioritizedPool.length > 0 && hasCoreTypeCoverage(prioritizedPool);

    if (appliedSeasonFilter) {
      availableItems = prioritizedPool as ResolvedClothingItem[];
      const normalizedSeason = normalizeSeasonName(context.weather.season);
      const message = seasonal.length > 0
        ? `Prioritized ${normalizedSeason} wardrobe staples`
        : `Leaning on all-season basics suited for ${normalizedSeason}`;
      reasoning.push(message);
    }

    emitDebug('filter:season', {
      season: context.weather.season,
      seasonalCount: seasonal.length,
      neutralCount: neutral.length,
      offSeasonCount: offSeason.length,
      applied: appliedSeasonFilter,
    });
  }

  // Task 2.4: Apply dress code constraint
  let dressCode = constraints?.dress_code;
  if (!dressCode && context.calendar_events) {
    dressCode = getDressCodeFromEvents(context.calendar_events);
  }
  
  if (dressCode) {
    const beforeDressCodeFilter = [...availableItems];
    let dressCodeFiltered = filterByDressCode(availableItems, dressCode) as ResolvedClothingItem[];

    if (dressCodeFiltered.length === 0) {
      emitDebug('filter:dressCode:skipped', { reason: 'no matches', dressCode });
    } else {
      dressCodeFiltered = ensureCoreCoverage(dressCodeFiltered, beforeDressCodeFilter, 'filter:dressCode');
      availableItems = dressCodeFiltered;
      reasoning.push(`Selected ${dressCode} attire for your day`);
      emitDebug('filter:dressCode', { dressCode, remaining: availableItems.length });
    }
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
  const tightInsulationPool = availableItems.filter(item => {
    const itemInsulation = resolveInsulationValue(item);
    return Math.abs(itemInsulation - requiredInsulation) <= insulationTolerance;
  });
  emitDebug('filter:insulation', { remaining: tightInsulationPool.length, requiredInsulation });

  let insulationFilteredItems = tightInsulationPool;
  if (!hasCoreTypeCoverage(insulationFilteredItems)) {
    const relaxedPool = availableItems.filter(item => {
      const itemInsulation = resolveInsulationValue(item);
      return Math.abs(itemInsulation - requiredInsulation) <= insulationTolerance + 2;
    });

    if (hasCoreTypeCoverage(relaxedPool)) {
      insulationFilteredItems = relaxedPool;
      emitDebug('filter:insulation:relaxed', { remaining: relaxedPool.length });
    } else {
      insulationFilteredItems = availableItems;
      emitDebug('filter:insulation:fallback', { remaining: availableItems.length });
    }
  }

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
    Accessories: insulationFilteredItems.filter(i => i.type === 'Accessory'),
    Headwear: insulationFilteredItems.filter(i => i.type === 'Headwear'),
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
  // Increased pool size to 50% or max 10 to avoid repetition
  const topCandidateCount = Math.min(10, Math.ceil(combinations.length * 0.5)); 
  emitDebug('generator:combinations', { count: combinations.length, topCandidateCount });
  const topCandidates = combinations.slice(0, topCandidateCount);
  
  // Select randomly from top candidates, weighted toward higher scores
  // Increased randomness for variety
  const selectedIndex = Math.floor(Math.random() * topCandidates.length);
  const selectedOutfit = topCandidates[selectedIndex];
  
  const bestOutfitItems = selectedOutfit.outfit;
  const bestScore = selectedOutfit.score;
  // Skip verbose scoring debug - user doesn't need to see internal scores

  const baseOutfitInsulation = bestOutfitItems.reduce((sum, item) => sum + resolveInsulationValue(item), 0);
  const targetTotalInsulation = calculateTargetTotalInsulation(context.weather.feels_like);
  const insulationDeficit = targetTotalInsulation - baseOutfitInsulation;

  // Add outerwear if needed and available
  // We layer if there is a significant deficit OR if it's simply cold enough to warrant it (<= 16C)
  const shouldLayer = insulationDeficit > 3 || context.weather.feels_like <= 18;
  
  if (shouldLayer && itemsByType.Outerwear.length > 0) {
    let bestOuterwear: IClothingItem | null = null;
    let bestOutfitWithOuterwearScore = -1;

    for (const outerwear of itemsByType.Outerwear) {
      // Only consider outerwear that helps meet the insulation deficit
      const outerwearInsulation = resolveInsulationValue(outerwear);
      // We want something that adds meaningful warmth, but doesn't have to be exact
      if (outerwearInsulation >= 2) { 
        const outfitWithOuterwear = [...bestOutfitItems, outerwear];
        const score = scoreOutfit(outfitWithOuterwear, context);
        
        // Bonus for meeting the target insulation closer
        const newTotalInsulation = baseOutfitInsulation + outerwearInsulation;
        const distToTarget = Math.abs(targetTotalInsulation - newTotalInsulation);
        const insulationScore = Math.max(0, 100 - (distToTarget * 5)); // 100 if exact, -5 per point off
        
        const finalScore = (score * 0.7) + (insulationScore * 0.3);

        if (finalScore > bestOutfitWithOuterwearScore) {
          bestOutfitWithOuterwearScore = finalScore;
          bestOuterwear = outerwear;
        }
      }
    }

    if (bestOuterwear) {
      bestOutfitItems.push(bestOuterwear);
      reasoning.push(`Added outerwear for warmth and style compatibility.`);
    } else if (insulationDeficit > 5) {
      const alternateLayer = itemsByType.Outerwear.find(item => !bestOutfitItems.some(existing => existing.id === item.id));
      if (alternateLayer) {
        enhancementSuggestions.push(`Layer your ${describeItem(alternateLayer)} if you want extra insulation without committing to the full look.`);
      } else {
        wardrobeGapSuggestions.push('A warm outer layer like a jacket or coat would help with today’s weather.');
      }
    }
  } else if (shouldLayer && itemsByType.Outerwear.length === 0) {
    wardrobeGapSuggestions.push('A jacket or cardigan would help balance today’s weather; consider adding one to your wardrobe.');
  }

  const shouldAddHeadwear = context.weather.feels_like <= 12 || alerts.some(alert => alert.type === 'UV' && alert.severity !== 'low');
  if (shouldAddHeadwear) {
    if (itemsByType.Headwear.length > 0) {
      let bestHeadwear: IClothingItem | null = null;
      let bestScoreWithHeadwear = -1;
      for (const headwear of itemsByType.Headwear) {
        const scored = scoreOutfit([...bestOutfitItems, headwear], context);
        if (scored > bestScoreWithHeadwear) {
          bestScoreWithHeadwear = scored;
          bestHeadwear = headwear;
        }
      }
      if (bestHeadwear) {
        bestOutfitItems.push(bestHeadwear);
        reasoning.push(context.weather.feels_like <= 12 ? 'Included headwear for additional warmth.' : 'Added headwear for sun protection.');
      } else {
        const alternateHeadwear = itemsByType.Headwear.find(item => !bestOutfitItems.some(existing => existing.id === item.id));
        if (alternateHeadwear) {
          const benefit = context.weather.feels_like <= 12 ? 'warmth' : 'UV protection';
          enhancementSuggestions.push(`Top it off with your ${describeItem(alternateHeadwear)} for a bit of extra ${benefit}.`);
        }
      }
    } else {
      wardrobeGapSuggestions.push('Headwear like a beanie, cap, or visor would improve comfort for today’s conditions.');
    }
  }

  const shouldAddAccessory = context.weather.feels_like <= 14;
  if (shouldAddAccessory) {
    if (itemsByType.Accessories.length > 0) {
      let bestAccessory: IClothingItem | null = null;
      let bestAccessoryScore = -1;
      for (const accessory of itemsByType.Accessories) {
        const scored = scoreOutfit([...bestOutfitItems, accessory], context);
        if (scored > bestAccessoryScore) {
          bestAccessoryScore = scored;
          bestAccessory = accessory;
        }
      }
      if (bestAccessory) {
        bestOutfitItems.push(bestAccessory);
        reasoning.push('Layered in an accessory for extra coziness.');
      } else {
        const alternateAccessory = itemsByType.Accessories.find(item => !bestOutfitItems.some(existing => existing.id === item.id));
        if (alternateAccessory) {
          enhancementSuggestions.push(`Consider adding your ${describeItem(alternateAccessory)} to tie the textures together.`);
        }
      }
    } else {
      wardrobeGapSuggestions.push('Cold-weather accessories like gloves or a scarf would round out this outfit.');
    }
  }

  if (wardrobeGapSuggestions.length > 0) {
    const summaryText = wardrobeGapSuggestions.length === 1
      ? wardrobeGapSuggestions[0]
      : `${wardrobeGapSuggestions.slice(0, -1).join(', ')} and ${wardrobeGapSuggestions[wardrobeGapSuggestions.length - 1]}`;
    reasoning.push(`Closet gaps noticed: ${summaryText}`);
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
      const seasonContext = context.weather.season_description 
        ? `Currently ${context.weather.season_description}.` 
        : '';
      detailedParts.push(`Temperature & protection: ${seasonContext} Selected to match a feels-like temperature of ${context.weather.feels_like}°C with an estimated insulation level of ${baseOutfitInsulation} (target ${requiredInsulation}). Season appropriateness takes priority over temperature alone.`);

      if (alerts && alerts.length > 0) {
        detailedParts.push(`Safety & alerts: The recommendation considered active alerts (${alerts.map(a => a.type).join(', ')}), adding protection where appropriate.`);
      }

      detailedParts.push(`Recommendation confidence: ${(bestScore / 100 * 100).toFixed(0)}% based on color, style, fit and your preferences.`);

      if (enhancementSuggestions.length > 0) {
        detailedParts.push(`Optional finishing touches to elevate this look: ${enhancementSuggestions.join('; ')}.`);
      } else if (wardrobeGapSuggestions.length > 0) {
        detailedParts.push(`Consider picking up: ${wardrobeGapSuggestions.join('; ')}.`);
      }

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
        missing_items: enhancementSuggestions.length > 0 ? enhancementSuggestions : wardrobeGapSuggestions,
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
        missing_items: enhancementSuggestions.length > 0 ? enhancementSuggestions : wardrobeGapSuggestions,
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
    const ensureCoreCoverage = (items: IClothingItem[]): IClothingItem[] => {
      const augmented = [...items];
      const usedIds = new Set(augmented.map(item => item.id));
      const coreTypes: ClothingType[] = ['Top', 'Bottom', 'Footwear'];

      const satisfiesType = (collection: IClothingItem[], targetType: ClothingType) => {
        if (targetType === 'Top') {
          return collection.some(item => item.type === 'Top' || item.type === 'Outerwear');
        }
        return collection.some(item => item.type === targetType);
      };

      for (const type of coreTypes) {
        if (satisfiesType(augmented, type)) {
          continue;
        }

        const candidate = wardrobe.find(item => {
          if (usedIds.has(item.id)) return false;
          if (type === 'Top') {
            return item.type === 'Top' || item.type === 'Outerwear';
          }
          return item.type === type;
        });

        if (candidate) {
          augmented.push(candidate);
          usedIds.add(candidate.id);
        }
      }

      if (!coreTypes.every(type => satisfiesType(augmented, type))) {
        throw new Error('INSUFFICIENT_ITEMS');
      }

      return augmented;
    };

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
                if (!a.last_worn) return -1;
                if (!b.last_worn) return 1;
                return new Date(a.last_worn).getTime() - new Date(b.last_worn).getTime();
            });
            selectedItems.push(sorted[0]);
        }
    }

    const missingTypes = ['Top', 'Bottom', 'Footwear'].filter(
      (requiredType) => !availableItems.some(item => item.type === requiredType)
    );

    const fallbackReasonParts = [
      'Used fallback logic due to insufficient item variety for advanced recommendations.'
    ];
    if (missingTypes.length > 0) {
      fallbackReasonParts.push(`Missing wardrobe coverage for ${missingTypes.join(', ')}.`);
    }

    const coreGuaranteedItems = ensureCoreCoverage(selectedItems);

    const result = {
      items: coreGuaranteedItems,
        confidence_score: 0.5, // Lower confidence for fallback
        reasoning: fallbackReasonParts.join(' '),
        alerts: constraints?.weather_alerts || [],
        context,
    };

    if (debug) {
      debug({
        stage: 'selection:legacy',
        timestamp: new Date().toISOString(),
        meta: {
          itemIds: coreGuaranteedItems.map(item => item.id),
          remainingItems: availableItems.length,
        },
      });
    }

    return result;
}

// Templates feature removed: outfitTemplates helper and API route deleted.
// If you need to restore templates later, reintroduce `outfitTemplates.ts`
// and the template-based logic here.
