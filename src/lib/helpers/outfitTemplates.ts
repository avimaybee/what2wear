// Templates helper removed — replaced with no-op stubs to keep imports safe.
// The templates feature has been removed from the app.

import { IClothingItem } from '@/lib/types';

export type OutfitTemplate = unknown;

export function detectAvailableTemplates(_wardrobe: IClothingItem[]) {
  return [] as OutfitTemplate[];
}

export function getTemplate(_templateId: string) {
  return null as OutfitTemplate | null;
}

export function getAllTemplates() {
  return [] as OutfitTemplate[];
}

export function getItemsByTemplate(_template: OutfitTemplate, _wardrobe: IClothingItem[]) {
  return {} as Record<string, IClothingItem[]>;
}

export function isTemplateViable(_template: OutfitTemplate, _wardrobe: IClothingItem[]) {
  return false;
}

export function generateOutfitFromTemplate(_template: OutfitTemplate, _wardrobe: IClothingItem[]) {
  return [] as IClothingItem[];
}

export function suggestTemplate(_wardrobe: IClothingItem[], _temperature?: number) {
  return null as OutfitTemplate | null;
}
