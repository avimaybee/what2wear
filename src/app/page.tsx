import { DashboardClient } from "@/components/client/dashboard-client";
import type { IRecommendation } from "@/types";

// Mock data for demonstration - In a real app, this would be fetched from an API
const mockRecommendation: IRecommendation = {
  id: "rec-1",
  outfit: [
    {
      id: 1,
      user_id: "user-1",
      name: "Navy Blazer",
      type: "Outerwear" as const,
      material: "Wool" as const,
      insulation_value: 7,
      last_worn_date: "2025-10-10T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop",
      color: "Navy",
      season_tags: ["Fall", "Winter"],
      style_tags: ["Business", "Formal"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      user_id: "user-1",
      name: "White Oxford Shirt",
      type: "Top" as const,
      material: "Cotton" as const,
      insulation_value: 3,
      last_worn_date: "2025-10-12T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
      color: "White",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 3,
      user_id: "user-1",
      name: "Charcoal Trousers",
      type: "Bottom" as const,
      material: "Wool" as const,
      insulation_value: 4,
      last_worn_date: "2025-10-11T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop",
      color: "Charcoal",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 4,
      user_id: "user-1",
      name: "Brown Leather Shoes",
      type: "Footwear" as const,
      material: "Leather" as const,
      insulation_value: 2,
      last_worn_date: "2025-10-09T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=400&fit=crop",
      color: "Brown",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
  ],
  reasoning: "Optimal outfit for today's business meeting. Temperature is cool with light wind, requiring a moderate layer. UV index is low, minimal sun protection needed.",
  constraint_alerts: ["Business Meeting at 2 PM", "Moderate UV Index"],
  temp_feels_like: 16.5,
  aqi: 45,
  uv_index: 4,
  pollen_count: 3.2,
  dress_code: "Business Casual" as const,
  weather_alerts: [
    {
      type: "UV" as const,
      severity: "moderate" as const,
      message: "Moderate UV index detected",
      recommendation: "Consider wearing sunglasses for extended outdoor exposure.",
    },
  ],
};

export default function HomePage() {
  return <DashboardClient recommendation={mockRecommendation} />;
}