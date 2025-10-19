"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Filter, Trash2, Calendar, Sparkles, PackageOpen } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { motionVariants, motionDurations } from "@/lib/motion";
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
  const [deleteItem, setDeleteItem] = useState<typeof mockWardrobeItems[0] | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const filteredItems = filterType === "All" 
    ? mockWardrobeItems 
    : mockWardrobeItems.filter(item => item.type === filterType);

  const handleDeleteConfirm = () => {
    // Here you would call DELETE /api/wardrobe/[id]
    console.log("Deleting item:", deleteItem?.id);
    setDeleteItem(null);
  };

  return (
    <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Virtual Wardrobe</h1>
          <p className="text-sm text-muted-foreground">
            Manage your clothing collection ({filteredItems.length} items)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filter Bar - Mobile uses Sheet, Desktop inline */}
      <div className="block lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Type {filterType !== "All" && `(${filterType})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Filter Wardrobe</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              <Button
                className="w-full justify-start"
                size="sm"
                variant={filterType === "All" ? "secondary" : "ghost"}
                onClick={() => setFilterType("All")}
              >
                All Items
              </Button>
              {clothingTypes.map((type) => (
                <Button
                  key={type}
                  className="w-full justify-start"
                  size="sm"
                  variant={filterType === type ? "secondary" : "ghost"}
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="hidden lg:block">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Filter by type:</span>
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

      {/* Wardrobe Grid with Enhanced Cards */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              variants={motionVariants.fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ 
                duration: motionDurations.fast / 1000,
                delay: idx * 0.02 
              }}
              layout
            >
              <Card 
                hoverable
                squircle
                className="group overflow-hidden transition-shadow hover:shadow-md"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Image with zoom on hover */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <motion.img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    
                  />
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="backdrop-blur-sm bg-black/50 text-white border-0">
                      {item.type}
                    </Badge>
                  </div>

                  {/* "Most Worn" or "Never Worn" Badge */}
                  {!item.last_worn_date && (
                    <div className="absolute top-2 left-2">
                      <Badge className="backdrop-blur-sm bg-primary/90 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    </div>
                  )}

                  {/* Delete Button on Hover */}
                  <motion.div
                    className="absolute top-2 left-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: hoveredItem === item.id ? 1 : 0,
                      scale: hoveredItem === item.id ? 1 : 0.8
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 shadow-lg"
                      onClick={() => setDeleteItem(item)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.material}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last Worn</span>
                      </div>
                      <p className="text-primary font-medium">{getRelativeTime(item.last_worn_date)}</p>
                    </div>
                    {item.color && (
                      <div
                        className="w-7 h-7 rounded-full border-2 shadow-sm"
                        style={{ backgroundColor: item.color.toLowerCase() }}
                        title={item.color}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Empty State with Beautiful Illustration */}
      {filteredItems.length === 0 && (
        <motion.div
          variants={motionVariants.fade}
          initial="hidden"
          animate="visible"
          transition={{ duration: motionDurations.medium / 1000 }}
        >
          <Card className="p-12">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-6">
                  <PackageOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No items found</h3>
                <p className="text-muted-foreground">
                  No {filterType !== "All" ? filterType.toLowerCase() : ""} items in your wardrobe yet.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setFilterType("All")} variant="outline">
                  Show All Items
                </Button>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Add Item Dialog (uses new Dialog component) */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent variant="scale">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              This feature would integrate with POST /api/wardrobe to add new items to your collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              In a production version, this would include:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Image upload with preview</li>
              <li>• Name, type, and material selection</li>
              <li>• Color picker for accurate matching</li>
              <li>• Season and style tags</li>
              <li>• Insulation value slider</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddModal(false)} variant="outline">
              Close
            </Button>
            <Button onClick={() => setShowAddModal(false)}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent variant="scale">
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &ldquo;{deleteItem?.name}&rdquo; from your wardrobe? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteItem(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
