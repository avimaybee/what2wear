export type Profile = {
  id: string;
  name: string | null;
  region: string | null;
  full_body_model_url: string | null;
  preferences: Record<string, unknown> | null; // You might want to define a more specific type for preferences
};