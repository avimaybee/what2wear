/**
 * Outfit Template System - Allows flexible outfit combinations
 * Instead of always requiring Top + Bottom + Shoes + Outerwear,
 * supports various combinations based on wardrobe content
 */

import { IClothingItem, ClothingType } from '@/lib/types';

export interface OutfitTemplate {
  id: string;
  name: string;
  description: string;
  requiredTypes: ClothingType[];
  optionalTypes: ClothingType[];
  useCaseExamples: string[];
  priority: number; // Higher = preferred when multiple templates available
}

/**
 * Predefined outfit templates
 */
export const OUTFIT_TEMPLATES: OutfitTemplate[] = [
  // Most common: Top + Bottom + Shoes
  {
    id: 'casual-basic',
    name: 'Casual Basic',
    description: 'Simple top and bottom with shoes - perfect for everyday wear',
    requiredTypes: ['Top', 'Bottom', 'Footwear'],
    optionalTypes: ['Accessory', 'Headwear'],
    useCaseExamples: ['Daily wear', 'Casual outings', 'Work from home'],
    priority: 100,
  },
  
  // Formal: Top + Bottom + Shoes + Outerwear
  {
    id: 'formal-complete',
    name: 'Formal Complete',
    description: 'Full formal outfit with jacket - for business and formal events',
    requiredTypes: ['Top', 'Bottom', 'Footwear', 'Outerwear'],
    optionalTypes: ['Accessory'],
    useCaseExamples: ['Business meetings', 'Formal events', 'Job interviews'],
    priority: 95,
  },
  
  // Layered: Top + Outerwear + Bottom + Shoes
  {
    id: 'layered-cozy',
    name: 'Layered & Cozy',
    description: 'Layered outfit with jacket for warmth and style',
    requiredTypes: ['Top', 'Outerwear', 'Bottom', 'Footwear'],
    optionalTypes: ['Accessory', 'Headwear'],
    useCaseExamples: ['Cold weather', 'Fall/Winter outings', 'Casual layering'],
    priority: 90,
  },
  
  // Minimal: Top + Bottom (no shoes required)
  {
    id: 'minimal-indoor',
    name: 'Minimal Indoor',
    description: 'Just top and bottom - for indoor or relaxed settings',
    requiredTypes: ['Top', 'Bottom'],
    optionalTypes: ['Footwear', 'Accessory'],
    useCaseExamples: ['Stay at home', 'Indoor activities', 'Casual loungewear'],
    priority: 70,
  },
  
  // Accessories: Top + Bottom + Shoes + Multiple Accessories
  {
    id: 'accessory-forward',
    name: 'Accessory Forward',
    description: 'Outfit focused on accessories and details',
    requiredTypes: ['Top', 'Bottom', 'Footwear', 'Accessory'],
    optionalTypes: ['Headwear', 'Outerwear'],
    useCaseExamples: ['Fashion statement', 'Accessory showcase', 'Date night'],
    priority: 65,
  },
  
  // Athletic: Top + Bottom + Footwear
  {
    id: 'athletic-active',
    name: 'Athletic Active',
    description: 'Workout or sports outfit',
    requiredTypes: ['Top', 'Bottom', 'Footwear'],
    optionalTypes: ['Accessory', 'Headwear'],
    useCaseExamples: ['Gym', 'Running', 'Sports', 'Active wear'],
    priority: 75,
  },

  // Minimal Shoes: Top + Bottom (shoes optional)
  {
    id: 'barefoot-casual',
    name: 'Barefoot Casual',
    description: 'Casual outfit without requiring shoes',
    requiredTypes: ['Top', 'Bottom'],
    optionalTypes: ['Footwear', 'Accessory', 'Headwear'],
    useCaseExamples: ['Beach', 'Casual summer', 'Indoor relaxation'],
    priority: 60,
  },
];

/**
 * Detect which templates are possible based on wardrobe content
 */
export function detectAvailableTemplates(wardrobe: IClothingItem[]): OutfitTemplate[] {
  const itemTypeCount: Record<ClothingType, number> = {
    'Top': 0,
    'Bottom': 0,
    'Footwear': 0,
    'Outerwear': 0,
    'Accessory': 0,
    'Headwear': 0,
  };

  // Count items by type
  for (const item of wardrobe) {
    itemTypeCount[item.type]++;
  }

  // Filter templates that can be satisfied
  const available = OUTFIT_TEMPLATES.filter(template => {
    // Check if all required types are available
    const hasRequiredItems = template.requiredTypes.every(
      type => itemTypeCount[type] > 0
    );
    return hasRequiredItems;
  });

  // Sort by priority (highest first)
  available.sort((a, b) => b.priority - a.priority);

  return available;
}

/**
 * Get a specific template by ID
 */
export function getTemplate(templateId: string): OutfitTemplate | null {
  return OUTFIT_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Get the best template for given wardrobe
 */
export function getBestTemplate(wardrobe: IClothingItem[]): OutfitTemplate | null {
  const available = detectAvailableTemplates(wardrobe);
  return available.length > 0 ? available[0] : null;
}

/**
 * Validate if a template can be satisfied with given items
 */
export function isTemplateViable(template: OutfitTemplate, wardrobe: IClothingItem[]): boolean {
  const itemTypeCount: Record<ClothingType, number> = {
    'Top': 0,
    'Bottom': 0,
    'Footwear': 0,
    'Outerwear': 0,
    'Accessory': 0,
    'Headwear': 0,
  };

  for (const item of wardrobe) {
    itemTypeCount[item.type]++;
  }

  return template.requiredTypes.every(type => itemTypeCount[type] > 0);
}

/**
 * Get items of required types for a template
 */
export function getItemsByTemplate(
  template: OutfitTemplate,
  wardrobe: IClothingItem[]
): Record<ClothingType, IClothingItem[]> {
  const grouped: Record<ClothingType, IClothingItem[]> = {
    'Top': [],
    'Bottom': [],
    'Footwear': [],
    'Outerwear': [],
    'Accessory': [],
    'Headwear': [],
  };

  // Include all items for required and optional types
  const relevantTypes = new Set([...template.requiredTypes, ...template.optionalTypes]);

  for (const item of wardrobe) {
    if (relevantTypes.has(item.type)) {
      grouped[item.type].push(item);
    }
  }

  return grouped;
}

/**
 * Get an outfit from a specific template
 * Returns items only for types in the template
 */
export function generateOutfitFromTemplate(
  template: OutfitTemplate,
  wardrobe: IClothingItem[]
): IClothingItem[] {
  if (!isTemplateViable(template, wardrobe)) {
    return [];
  }

  const itemsByType = getItemsByTemplate(template, wardrobe);
  const outfit: IClothingItem[] = [];

  // Add one item from each required type
  for (const type of template.requiredTypes) {
    const items = itemsByType[type];
    if (items.length > 0) {
      // Pick a random item from this type
      const selectedItem = items[Math.floor(Math.random() * items.length)];
      outfit.push(selectedItem);
    } else {
      // This shouldn't happen if viability was checked, but failsafe
      return [];
    }
  }

  return outfit;
}

/**
 * Suggest the best template based on weather and constraints
 */
export function suggestTemplate(
  wardrobe: IClothingItem[],
  temperature?: number
): OutfitTemplate | null {
  const available = detectAvailableTemplates(wardrobe);

  if (available.length === 0) {
    return null;
  }

  // If no temperature guidance, return best available
  if (temperature === undefined || temperature === null) {
    return available[0];
  }

  // Cold weather (below 10°C) - prefer templates with outerwear
  if (temperature < 10) {
    const withOuterwear = available.find(t => t.requiredTypes.includes('Outerwear'));
    return withOuterwear || available[0];
  }

  // Warm weather (above 25°C) - prefer minimal templates
  if (temperature > 25) {
    const minimal = available.find(t => 
      !t.requiredTypes.includes('Outerwear') && 
      t.requiredTypes.length <= 3
    );
    return minimal || available[0];
  }

  // Mild weather - return best available
  return available[0];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): OutfitTemplate[] {
  return OUTFIT_TEMPLATES;
}
