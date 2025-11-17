// Papercraft App - Simplified Type Definitions
// Aligned with the blueprint

// ===== Core Types =====

export type ClothingCategory = 
  | 'shirt' 
  | 't-shirt' 
  | 'jacket' 
  | 'pants' 
  | 'shoes' 
  | 'accessory';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type StyleTag = 'casual' | 'formal' | 'streetwear' | 'sporty' | 'business';
export type Gender = 'male' | 'female' | 'neutral';

// ===== Wardrobe Types =====

export interface ClothingItem {
  id: number;
  user_id: string;
  category: ClothingCategory;
  color: string;
  season_tags: Season[];
  style_tags: StyleTag[];
  tags?: string[]; // Custom user tags
  image_url: string;
  wear_count: number;
  last_worn: string | null; // ISO date string
  is_favorite: boolean;
  created_at: string;
}

export interface WardrobeAnalytics {
  total_items: number;
  favorite_count: number;
  avg_wear_count: number;
  max_wear_count: number;
  worn_last_30_days: number;
  rarely_worn: number;
  most_worn_items: ClothingItem[];
  seasonal_distribution: Record<Season, number>;
  category_distribution: Record<ClothingCategory, number>;
}

// ===== Outfit Types =====

export interface OutfitRecommendation {
  id: number;
  user_id: string;
  outfit_date: string; // ISO date
  items: ClothingItem[];
  reasoning: string; // Brief user-facing explanation
  weather_data?: WeatherData;
  visual_image_url?: string; // AI-generated image
  visual_metadata?: ImageProvenance;
  feedback?: number; // User rating
  created_at: string;
}

export interface OutfitItemSwap {
  id: number;
  outfit_id: number;
  original_item_id: number;
  swapped_item_id: number;
  swap_reason?: string;
  created_at: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  forecast_time: string;
}

export interface ImageProvenance {
  model: string; // e.g., 'gemini-pro-vision'
  generated_at: string;
  prompt_hash: string;
  badge_type?: 'ai-generated' | 'ai-enhanced';
  generation_params?: Record<string, unknown>;
}

// ===== User Profile Types =====

export interface UserProfile {
  id: string;
  name?: string;
  region?: string;
  gender: Gender;
  preferences?: UserPreferences;
  privacy_settings: PrivacySettings;
  style_preferences: StylePreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications_enabled?: boolean;
  language?: string;
}

export interface PrivacySettings {
  data_retention_days: number; // Default: 365
  auto_delete_old_photos: boolean;
  allow_image_generation: boolean;
}

export interface StylePreferences {
  preferred_styles: StyleTag[];
  disliked_items: number[]; // IDs of items user doesn't want recommended
  dress_codes: string[]; // e.g., ['business-casual', 'no-shorts']
  cooldown_days: number; // Days before recommending same item again
}

// ===== Onboarding Types =====

export interface OnboardingStep {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  completed: boolean;
}

export interface OnboardingData {
  style_profile: {
    gender: Gender;
    preferred_styles: StyleTag[];
    typical_occasions: string[];
  };
  wardrobe_photos: {
    uploaded_count: number;
    items: ClothingItem[];
  };
  starter_outfit: {
    generated: boolean;
    outfit?: OutfitRecommendation;
  };
}

// ===== API Types =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WardrobeUploadRequest {
  images: File[];
  metadata: Partial<ClothingItem>[];
}

export interface OutfitGenerationRequest {
  date?: string; // ISO date, defaults to today
  weather?: WeatherData;
  occasion?: string;
  constraints?: {
    must_include?: number[]; // Item IDs
    exclude?: number[]; // Item IDs
    max_recommendations?: number; // 1-3
  };
}

export interface OutfitSwapRequest {
  outfit_id: number;
  item_to_replace_id: number;
  replacement_item_id?: number; // If not provided, AI suggests alternatives
}

export interface BulkDeleteRequest {
  item_ids: number[];
}

// ===== UI Component Types =====

export interface PapercraftCardProps {
  variant?: 'default' | 'elevated' | 'flat';
  pattern?: 'checker' | 'dots' | 'lines' | 'none';
  className?: string;
  children: React.ReactNode;
}

export interface StickerBadgeProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'ai-generated';
  text: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

export interface LoadingSkeletonProps {
  variant: 'card' | 'list' | 'grid';
  count?: number;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  illustration?: 'floppy' | 'torn-note' | 'emoji-face';
}

// ===== Animation Types =====

export interface MicrointeractionConfig {
  type: 'confetti' | 'bounce' | 'slide' | 'pop' | 'sticker';
  trigger: 'mount' | 'click' | 'hover' | 'success';
  duration?: number;
  delay?: number;
}

// ===== Utility Types =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ===== Constants =====

export const CLOTHING_CATEGORIES: readonly ClothingCategory[] = [
  'shirt',
  't-shirt',
  'jacket',
  'pants',
  'shoes',
  'accessory',
] as const;

export const SEASONS: readonly Season[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
] as const;

export const STYLE_TAGS: readonly StyleTag[] = [
  'casual',
  'formal',
  'streetwear',
  'sporty',
  'business',
] as const;

export const DEFAULT_COOLDOWN_DAYS = 3;
export const DEFAULT_RETENTION_DAYS = 365;
export const MAX_OUTFIT_RECOMMENDATIONS = 3;
export const MIN_WARDROBE_ITEMS = 5; // Minimum items needed for recommendations
