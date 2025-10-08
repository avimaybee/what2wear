export type UserPreferences = {
  styles?: string[];
  colors?: string[];
};

export type Profile = {
  id: string;
  name: string | null;
  region: string | null;
  full_body_model_url: string | null;
  preferences: UserPreferences | null;
};

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

export type Outfit = {
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
};