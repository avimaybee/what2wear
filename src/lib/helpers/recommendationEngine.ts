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
  if (temperature < 10) return 7;
  if (temperature < 20) return 5;
  if (temperature < 25) return 3;
  return 1;
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
  const requiredInsulation = adjustInsulationForActivity(baseInsulation, activityLevel);
  
  if (activityLevel) {
    reasoning.push(`Adjusted insulation for ${activityLevel} activity level`);
  }

  // Filter items by insulation (with some tolerance)
  const insulationTolerance = 2;
  availableItems = availableItems.filter(item => 
    Math.abs(item.insulation_value - requiredInsulation) <= insulationTolerance
  );
  reasoning.push(`Filtered by insulation value (target: ${requiredInsulation}±${insulationTolerance})`);

  // Task 3.3: Consider weather alerts
  const alerts = constraints?.weather_alerts || [];
  if (alerts.length > 0) {
    // Prioritize items suitable for weather alerts
    const alertSuitableItems = availableItems.filter(item => 
      isItemSuitableForAlerts(item, alerts)
    );
    
    if (alertSuitableItems.length > 0) {
      reasoning.push(`Prioritized items suitable for weather alerts (${alerts.map(a => a.type).join(', ')})`);
    }
  }

  // Simple outfit selection (one item per type)
  const selectedItems: IClothingItem[] = [];
  const itemTypes: Array<IClothingItem['type']> = ['Top', 'Bottom', 'Footwear', 'Outerwear'];
  
  for (const type of itemTypes) {
    const itemsOfType = availableItems.filter(item => item.type === type);
    if (itemsOfType.length > 0) {
      // Prefer items with lowest last_worn_date (least recently worn)
      const sorted = itemsOfType.sort((a, b) => {
        if (!a.last_worn_date) return -1;
        if (!b.last_worn_date) return 1;
        return new Date(a.last_worn_date).getTime() - new Date(b.last_worn_date).getTime();
      });
      selectedItems.push(sorted[0]);
    }
  }

  // Calculate confidence score
  const hasAllTypes = itemTypes.every(type => 
    selectedItems.some(item => item.type === type)
  );
  const confidence = hasAllTypes ? 0.9 : 0.6;

  return {
    items: selectedItems,
    confidence_score: confidence,
    reasoning: reasoning.join('. '),
    alerts,
    context,
  };
}
