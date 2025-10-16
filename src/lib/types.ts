// ============================================================================
// User Preferences & Profile Types
// ============================================================================

export interface UserPreferences {
  styles?: string[];
  colors?: string[];
  temperature_sensitivity?: number; // -2 (very cold) to +2 (very warm)
}

export interface Profile {
  id: string;
  name: string | null;
  region: string | null;
  full_body_model_url: string | null;
  preferences: UserPreferences | null;
}

// ============================================================================
// Clothing Item Types (Enhanced for Task 1.1)
// ============================================================================

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

/**
 * Enhanced Clothing Item Interface (Task 1.1)
 * Represents a single item in the user's virtual wardrobe
 */
export interface IClothingItem {
  id: number;
  user_id: string;
  name: string;
  type: ClothingType;
  category: string | null; // Legacy field, kept for backwards compatibility
  color: string | null;
  material: ClothingMaterial;
  insulation_value: number; // 0-10 scale, higher = warmer
  last_worn_date: Date | null;
  image_url: string;
  season_tags: string[] | null;
  style_tags: string[] | null;
  dress_code: DressCode[];
  created_at: string;
}

/**
 * Legacy type for backwards compatibility
 */
export type ClothingItem = {
  id: number;
  user_id: string;
  category: string | null;
  color: string | null;
  season_tags: string[] | null;
  style_tags: string[] | null;
  image_url: string;
  created_at: string;
  last_used_date: string | null;
};

// ============================================================================
// Outfit Types
// ============================================================================

export interface Outfit {
  id: number;
  created_at: string;
  feedback: number | null;
  outfit_items: {
    clothing_items: {
      id: number;
      image_url: string;
      category: string | null;
    };
  }[];
}

// ============================================================================
// Weather & Environment Types (Task 3.x)
// ============================================================================

export interface WeatherData {
  temperature: number;
  feels_like: number; // Apparent temperature (Task 3.2)
  humidity: number;
  wind_speed: number;
  uv_index: number; // Task 3.1
  air_quality_index: number; // Task 3.1
  pollen_count: number; // Task 3.1
  weather_condition: string;
  timestamp: Date;
}

export interface WeatherAlert {
  type: 'UV' | 'AQI' | 'Pollen';
  severity: 'low' | 'moderate' | 'high';
  message: string;
  recommendation?: string;
}

// ============================================================================
// Calendar & Activity Types (Task 2.x)
// ============================================================================

export type EventType = 'Work/Business' | 'Gym/Active' | 'Casual/Social';

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  event_type: EventType;
  description?: string;
}

export type ActivityLevel = 'Low' | 'Medium' | 'High';

export interface HealthActivity {
  date: Date;
  planned_activity_level: ActivityLevel;
  steps?: number;
  active_minutes?: number;
}

// ============================================================================
// Recommendation Types (Task 1.4, 2.4, 3.3)
// ============================================================================

export interface RecommendationContext {
  weather: WeatherData;
  calendar_events?: CalendarEvent[];
  health_activity?: HealthActivity;
  user_preferences?: UserPreferences;
}

export interface RecommendationConstraints {
  dress_code?: DressCode;
  activity_level?: ActivityLevel;
  weather_alerts?: WeatherAlert[];
  min_days_since_worn?: number;
}

export interface OutfitRecommendation {
  items: IClothingItem[];
  confidence_score: number;
  reasoning: string;
  alerts?: WeatherAlert[];
  context: RecommendationContext;
}

// ============================================================================
// Feedback & Learning Types (Task 4.x)
// ============================================================================

export interface RecommendationFeedback {
  recommendation_id: string;
  is_liked: boolean;
  reason?: string;
  weather_conditions?: WeatherData;
  created_at: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}