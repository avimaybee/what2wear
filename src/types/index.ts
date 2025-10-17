/**
 * Type definitions for What2Wear UI
 * These interfaces align with the backend API data structures
 */

export type ClothingType = 
  | 'Outerwear'
  | 'Top'
  | 'Bottom'
  | 'Footwear'
  | 'Accessory'
  | 'Headwear';

export type ClothingMaterial = 
  | 'Cotton'
  | 'Wool'
  | 'Synthetic'
  | 'Gore-Tex'
  | 'Fleece'
  | 'Leather'
  | 'Denim'
  | 'Silk'
  | 'Linen'
  | 'Polyester'
  | 'Nylon';

export type DressCode = 
  | 'Casual'
  | 'Business Casual'
  | 'Formal'
  | 'Athletic'
  | 'Loungewear';

export interface IClothingItem {
  id: number;
  user_id: string;
  name: string;
  type: ClothingType;
  material: ClothingMaterial;
  insulation_value: number;
  last_worn_date: string | null; // ISO Date String
  image_url: string;
  color: string | null;
  season_tags: string[] | null;
  style_tags: string[] | null;
  dress_code: DressCode[];
  created_at: string;
}

export interface WeatherAlert {
  type: 'UV' | 'AQI' | 'Pollen';
  severity: 'low' | 'moderate' | 'high';
  message: string;
  recommendation?: string;
}

export interface IRecommendation {
  id: string;
  outfit: IClothingItem[];
  reasoning: string;
  constraint_alerts: string[];
  temp_feels_like: number;
  aqi: number;
  uv_index: number;
  pollen_count: number;
  dress_code?: DressCode;
  weather_alerts?: WeatherAlert[];
}

export interface UserPreferences {
  styles?: string[];
  colors?: string[];
  temperature_sensitivity?: number; // -2 (very cold) to +2 (very warm)
  variety_days?: number; // Days before recommending same item
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
