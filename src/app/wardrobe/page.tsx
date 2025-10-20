"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, Trash2, Calendar, Sparkles, PackageOpen, AlertCircle } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { motionVariants, motionDurations } from "@/lib/motion";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import type { ClothingType, IClothingItem } from "@/types";

const clothingTypes: ClothingType[] = ["Outerwear", "Top", "Bottom", "Footwear", "Accessory", "Headwear"];

export default function WardrobePage() {
  const [wardrobeItems, setWardrobeItems] = useState<IClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ClothingType | "All">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<IClothingItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [modalSource, setModalSource] = useState<"add-button" | "delete" | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch wardrobe items from API
  const fetchWardrobe = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to view your wardrobe");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/wardrobe");

      if (!response.ok) {
        throw new Error("Failed to fetch wardrobe");
      }

      const data = await response.json();

      if (data.success && data.data) {
        setWardrobeItems(data.data);
      } else {
        throw new Error(data.error || "Failed to load wardrobe");
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching wardrobe:", err);
      setError(err instanceof Error ? err.message : "Failed to load wardrobe");
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchWardrobe();
  }, []);

  const filteredItems = filterType === "All" 
    ? wardrobeItems 
    : wardrobeItems.filter(item => item.type === filterType);

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/wardrobe/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      toast.success("Item deleted successfully!", { duration: 2000 });
      
      // Refresh wardrobe
      await fetchWardrobe();
      
      setDeleteItem(null);
      setModalSource(null);
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalSource("add-button");
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setTimeout(() => setModalSource(null), 300);
  };

  const handleOpenDeleteModal = (item: IClothingItem) => {
    setModalSource("delete");
    setDeleteItem(item);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Oops! Something went wrong</h2>
            <p className="text-center text-muted-foreground">{error}</p>
            <Button onClick={fetchWardrobe}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (wardrobeItems.length === 0) {
    return (
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Virtual Wardrobe</h1>
            <p className="text-sm text-muted-foreground">
              Manage your clothing collection
            </p>
          </div>
        </div>
        <Card className="max-w-md mx-auto glass-effect">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <PackageOpen className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Your wardrobe is empty</h2>
            <p className="text-center text-muted-foreground">
              Start adding clothing items to get personalized outfit recommendations
            </p>
            <Button onClick={handleOpenAddModal} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <motion.div layoutId="add-item-button">
          <Button onClick={handleOpenAddModal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </motion.div>
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
                      onClick={() => handleOpenDeleteModal(item)}
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

      {/* Add Item Dialog (uses new Dialog component with layoutId) */}
      <AnimatePresence>
        {showAddModal && (
          <Dialog open={showAddModal} onOpenChange={handleCloseAddModal}>
            <DialogContent variant="scale" layoutId="add-item-button">
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
                <Button onClick={handleCloseAddModal} variant="outline">
                  Close
                </Button>
                <Button onClick={handleCloseAddModal}>
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

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
