"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import type { ClothingType } from "@/types";

// Mock wardrobe data
const mockWardrobeItems = [
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
  {
    id: 5,
    user_id: "user-1",
    name: "Black Puffer Jacket",
    type: "Outerwear" as const,
    material: "Synthetic" as const,
    insulation_value: 9,
    last_worn_date: null,
    image_url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop",
    color: "Black",
    season_tags: ["Winter"],
    style_tags: ["Casual", "Athletic"],
    dress_code: ["Casual" as const, "Athletic" as const],
    created_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: 6,
    user_id: "user-1",
    name: "Grey Hoodie",
    type: "Top" as const,
    material: "Cotton" as const,
    insulation_value: 5,
    last_worn_date: "2025-10-14T00:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    color: "Grey",
    season_tags: ["Fall", "Spring"],
    style_tags: ["Casual", "Comfort"],
    dress_code: ["Casual" as const, "Loungewear" as const],
    created_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: 7,
    user_id: "user-1",
    name: "Blue Jeans",
    type: "Bottom" as const,
    material: "Denim" as const,
    insulation_value: 3,
    last_worn_date: "2025-10-13T00:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    color: "Blue",
    season_tags: ["All Season"],
    style_tags: ["Casual"],
    dress_code: ["Casual" as const],
    created_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: 8,
    user_id: "user-1",
    name: "White Sneakers",
    type: "Footwear" as const,
    material: "Synthetic" as const,
    insulation_value: 1,
    last_worn_date: "2025-10-15T00:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    color: "White",
    season_tags: ["All Season"],
    style_tags: ["Casual", "Athletic"],
    dress_code: ["Casual" as const, "Athletic" as const],
    created_at: "2025-01-01T00:00:00.000Z",
  },
];

const clothingTypes: ClothingType[] = ["Outerwear", "Top", "Bottom", "Footwear", "Accessory", "Headwear"];

export default function WardrobePage() {
  const [filterType, setFilterType] = useState<ClothingType | "All">("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredItems = filterType === "All" 
    ? mockWardrobeItems 
    : mockWardrobeItems.filter(item => item.type === filterType);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-1">Virtual Wardrobe</h1>
          <p className="text-foreground-secondary">
            Manage your clothing collection ({filteredItems.length} items)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-foreground-secondary" />
            <span className="text-sm text-foreground-secondary mr-2">Filter by type:</span>
            <Button
              size="sm"
              variant={filterType === "All" ? "secondary" : "outline"}
              onClick={() => setFilterType("All")}
            >
              All
            </Button>
            {clothingTypes.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? "secondary" : "outline"}
                onClick={() => setFilterType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wardrobe Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredItems.map((item) => (
          <Card key={item.id} className="group overflow-hidden transition-all hover:border-primary">
            <div className="relative aspect-square">
              <Image
                src={item.image_url}
                alt={item.name}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
                  {item.type}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                <p className="text-sm text-foreground-secondary">{item.material}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="text-xs">
                  <p className="text-foreground-secondary">Last Worn</p>
                  <p className="text-primary font-medium">{getRelativeTime(item.last_worn_date)}</p>
                </div>
                {item.color && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: item.color.toLowerCase() }}
                    title={item.color}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <p className="text-foreground-secondary">No items found in this category</p>
            <Button onClick={() => setFilterType("All")}>Show All Items</Button>
          </div>
        </Card>
      )}

      {/* Add Item Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-serif font-bold">Add New Item</h2>
              <p className="text-foreground-secondary">
                This feature would integrate with POST /api/wardrobe to add new items.
              </p>
              <Button onClick={() => setShowAddModal(false)} className="w-full" variant="outline">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
