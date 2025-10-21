"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, Trash2, Calendar, Sparkles, PackageOpen, AlertCircle, Search, X, ArrowUpDown, Shirt, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { motionVariants, motionDurations } from "@/lib/motion";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { uploadClothingImage } from "@/lib/supabase/storage";
import type { ClothingType, IClothingItem, DressCode } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import Image from "next/image";

const clothingTypes: ClothingType[] = ["Outerwear", "Top", "Bottom", "Footwear", "Accessory", "Headwear"];
const dressCodeOptions: DressCode[] = ["Casual", "Business Casual", "Formal", "Athletic", "Loungewear"];
const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];
type SortOption = "recent" | "lastWorn" | "name" | "type";

export default function WardrobePage() {
  const [wardrobeItems, setWardrobeItems] = useState<IClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ClothingType | "All">("All");
  const [filterColor, setFilterColor] = useState<string | "All">("All");
  const [filterSeason, setFilterSeason] = useState<string | "All">("All");
  const [filterDressCode, setFilterDressCode] = useState<DressCode | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  
  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<IClothingItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [modalSource, setModalSource] = useState<"add-button" | "delete" | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Get unique colors from wardrobe items
  const availableColors = Array.from(
    new Set(
      wardrobeItems
        .filter(item => item.color)
        .map(item => item.color!)
    )
  ).sort();

  // Advanced filtering logic
  const filteredItems = wardrobeItems
    .filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesColor = item.color?.toLowerCase().includes(query);
        const matchesMaterial = item.material.toLowerCase().includes(query);
        if (!matchesName && !matchesColor && !matchesMaterial) return false;
      }
      
      // Type filter
      if (filterType !== "All" && item.type !== filterType) return false;
      
      // Color filter
      if (filterColor !== "All" && item.color !== filterColor) return false;
      
      // Season filter
      if (filterSeason !== "All") {
        if (!item.season_tags || !item.season_tags.includes(filterSeason)) return false;
      }
      
      // Dress code filter
      if (filterDressCode !== "All") {
        if (!item.dress_code || !item.dress_code.includes(filterDressCode)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sorting logic
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "lastWorn":
          if (!a.last_worn_date && !b.last_worn_date) return 0;
          if (!a.last_worn_date) return 1;
          if (!b.last_worn_date) return -1;
          return new Date(b.last_worn_date).getTime() - new Date(a.last_worn_date).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || filterType !== "All" || filterColor !== "All" || filterSeason !== "All" || filterDressCode !== "All";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterType("All");
    setFilterColor("All");
    setFilterSeason("All");
    setFilterDressCode("All");
  };

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
    setSelectedFile(null);
    setImagePreview(null);
    setTimeout(() => setModalSource(null), 300);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAndCreate = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be signed in to upload images');
        return;
      }

      // Upload image to Supabase Storage
      const uploadResult = await uploadClothingImage(selectedFile, user.id);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Upload failed');
        return;
      }

      // Create wardrobe item with default values
      const newItem = {
        name: selectedFile.name.split('.')[0] || 'New Item',
        type: 'Top' as ClothingType,
        material: 'Cotton',
        insulation_value: 2,
        image_url: uploadResult.url!,
        dress_code: ['Casual'] as DressCode[],
      };

      const response = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error('Failed to create wardrobe item');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Item added successfully! 🎉');
        handleCloseAddModal();
        fetchWardrobe(); // Refresh the wardrobe
      } else {
        throw new Error(data.error || 'Failed to create item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item');
    } finally {
      setUploading(false);
    }
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
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon={AlertCircle}
            title="Oops! Something Went Wrong"
            description={error}
            actions={[
              {
                label: "Try Again",
                onClick: fetchWardrobe,
                variant: "default"
              }
            ]}
            variant="default"
          />
        </div>
      </div>
    );
  }

  // Empty state - no items at all in wardrobe
  if (wardrobeItems.length === 0) {
    return (
      <>
        <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Virtual Wardrobe</h1>
              <p className="text-sm text-muted-foreground">
                Manage your clothing collection
              </p>
            </div>
          </div>
          <EmptyState
            icon={PackageOpen}
            title="Your wardrobe is empty"
            description="Start building your digital closet! Add your first clothing item and we'll start generating personalized outfit recommendations."
            actions={[
              {
                label: "Add Your First Item",
                onClick: handleOpenAddModal,
                icon: Plus,
                variant: "default"
              }
            ]}
            tips={[
              "Take a photo or upload from your phone",
              "Add details like color, season, and style tags",
              "Track when you last wore each item",
              "Get AI-powered outfit suggestions based on weather"
            ]}
            variant="illustrated"
          />
        </div>

        {/* Add Item Dialog - needs to be available even in empty state */}
        <AnimatePresence>
          {showAddModal && (
            <Dialog open={showAddModal} onOpenChange={handleCloseAddModal}>
              <DialogContent variant="scale" layoutId="add-item-button" className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                  <DialogDescription>
                    Upload a photo of your clothing item
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {!imagePreview ? (
                    // File upload area
                    <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        id="wardrobe-file-input"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="wardrobe-file-input"
                        className="flex flex-col items-center gap-3 cursor-pointer w-full"
                      >
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium mb-1">Tap to upload photo</p>
                          <p className="text-xs text-muted-foreground">Camera or Gallery</p>
                          <p className="text-xs text-muted-foreground mt-2">Max 5MB • JPG, PNG, WEBP</p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    // Image preview
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          {selectedFile?.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview(null);
                          }}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        After uploading, you&apos;ll be able to edit details like name, type, color, and season tags.
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={handleCloseAddModal} 
                    variant="outline"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  {imagePreview && (
                    <Button 
                      onClick={handleUploadAndCreate}
                      disabled={uploading || !selectedFile}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Add Item
                        </>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Virtual Wardrobe</h1>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} of {wardrobeItems.length} items
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>
        <motion.div layoutId="add-item-button">
          <Button onClick={handleOpenAddModal} size="sm" aria-label="Add new clothing item">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Item
          </Button>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="text"
          placeholder="Search by name, color, or material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search wardrobe items"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter and Sort Bar - Mobile uses Sheet, Desktop inline */}
      <div className="block lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full" aria-label="Open filters menu">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Filters {hasActiveFilters && `(${[filterType !== "All", filterColor !== "All", filterSeason !== "All", filterDressCode !== "All"].filter(Boolean).length})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter & Sort</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Sort */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                  Sort By
                </h3>
                <div className="space-y-2">
                  {[
                    { value: "recent" as SortOption, label: "Recently Added" },
                    { value: "lastWorn" as SortOption, label: "Last Worn" },
                    { value: "name" as SortOption, label: "Name (A-Z)" },
                    { value: "type" as SortOption, label: "Type" },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      className="w-full justify-start"
                      size="sm"
                      variant={sortBy === value ? "secondary" : "ghost"}
                      onClick={() => setSortBy(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Type</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant={filterType === "All" ? "secondary" : "ghost"}
                    onClick={() => setFilterType("All")}
                  >
                    All Types
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
              </div>

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Color</h3>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      size="sm"
                      variant={filterColor === "All" ? "secondary" : "ghost"}
                      onClick={() => setFilterColor("All")}
                    >
                      All Colors
                    </Button>
                    {availableColors.map((color) => (
                      <Button
                        key={color}
                        className="w-full justify-start gap-2"
                        size="sm"
                        variant={filterColor === color ? "secondary" : "ghost"}
                        onClick={() => setFilterColor(color)}
                      >
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Season Filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Season</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant={filterSeason === "All" ? "secondary" : "ghost"}
                    onClick={() => setFilterSeason("All")}
                  >
                    All Seasons
                  </Button>
                  {seasonOptions.map((season) => (
                    <Button
                      key={season}
                      className="w-full justify-start"
                      size="sm"
                      variant={filterSeason === season ? "secondary" : "ghost"}
                      onClick={() => setFilterSeason(season)}
                    >
                      {season}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dress Code Filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Dress Code</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant={filterDressCode === "All" ? "secondary" : "ghost"}
                    onClick={() => setFilterDressCode("All")}
                  >
                    All Dress Codes
                  </Button>
                  {dressCodeOptions.map((code) => (
                    <Button
                      key={code}
                      className="w-full justify-start"
                      size="sm"
                      variant={filterDressCode === code ? "secondary" : "ghost"}
                      onClick={() => setFilterDressCode(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filter Bar */}
      <Card className="hidden lg:block">
        <CardContent className="py-4">
          <div className="space-y-4">
            {/* Sort and Filter Row */}
            <div className="flex items-center justify-between gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Sort:</span>
                <div className="flex gap-2">
                  {[
                    { value: "recent" as SortOption, label: "Recent" },
                    { value: "lastWorn" as SortOption, label: "Last Worn" },
                    { value: "name" as SortOption, label: "Name" },
                    { value: "type" as SortOption, label: "Type" },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={sortBy === value ? "secondary" : "outline"}
                      onClick={() => setSortBy(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" aria-hidden="true" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Type Filter Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground mr-2">Type:</span>
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

            {/* Color Filter Row */}
            {availableColors.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground mr-2">Color:</span>
                <Button
                  size="sm"
                  variant={filterColor === "All" ? "secondary" : "outline"}
                  onClick={() => setFilterColor("All")}
                >
                  All
                </Button>
                {availableColors.slice(0, 8).map((color) => (
                  <Button
                    key={color}
                    size="sm"
                    variant={filterColor === color ? "secondary" : "outline"}
                    onClick={() => setFilterColor(color)}
                    className="gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                    {color}
                  </Button>
                ))}
                {availableColors.length > 8 && (
                  <span className="text-xs text-muted-foreground">+{availableColors.length - 8} more</span>
                )}
              </div>
            )}

            {/* Season & Dress Code Filter Row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Season */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Season:</span>
                <Button
                  size="sm"
                  variant={filterSeason === "All" ? "secondary" : "outline"}
                  onClick={() => setFilterSeason("All")}
                >
                  All
                </Button>
                {seasonOptions.map((season) => (
                  <Button
                    key={season}
                    size="sm"
                    variant={filterSeason === season ? "secondary" : "outline"}
                    onClick={() => setFilterSeason(season)}
                  >
                    {season}
                  </Button>
                ))}
              </div>

              {/* Dress Code */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Dress Code:</span>
                <Button
                  size="sm"
                  variant={filterDressCode === "All" ? "secondary" : "outline"}
                  onClick={() => setFilterDressCode("All")}
                >
                  All
                </Button>
                {dressCodeOptions.slice(0, 3).map((code) => (
                  <Button
                    key={code}
                    size="sm"
                    variant={filterDressCode === code ? "secondary" : "outline"}
                    onClick={() => setFilterDressCode(code)}
                  >
                    {code}
                  </Button>
                ))}
              </div>
            </div>
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
                        <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
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
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                        <Calendar className="h-3 w-3" aria-hidden="true" />
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
      {filteredItems.length === 0 && !loading && wardrobeItems.length > 0 && (
        <EmptyState
          icon={PackageOpen}
          title="No items match your filters"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to see more results."
              : "Your wardrobe appears to be empty for the current selection."
          }
          actions={[
            {
              label: "Clear All Filters",
              onClick: clearAllFilters,
              icon: X,
              variant: "default"
            },
            {
              label: "Add New Item",
              onClick: handleOpenAddModal,
              icon: Plus,
              variant: "outline"
            }
          ]}
          variant="default"
        />
      )}

      {/* Add Item Dialog (uses new Dialog component with layoutId) */}
      <AnimatePresence>
        {showAddModal && (
          <Dialog open={showAddModal} onOpenChange={handleCloseAddModal}>
            <DialogContent variant="scale" layoutId="add-item-button" className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Upload a photo of your clothing item
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!imagePreview ? (
                  // File upload area
                  <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="wardrobe-file-input"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="wardrobe-file-input"
                      className="flex flex-col items-center gap-3 cursor-pointer w-full"
                    >
                      <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium mb-1">Tap to upload photo</p>
                        <p className="text-xs text-muted-foreground">Camera or Gallery</p>
                        <p className="text-xs text-muted-foreground mt-2">Max 5MB • JPG, PNG, WEBP</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  // Image preview
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {selectedFile?.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      After uploading, you&apos;ll be able to edit details like name, type, color, and season tags.
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={handleCloseAddModal} 
                  variant="outline"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                {imagePreview && (
                  <Button 
                    onClick={handleUploadAndCreate}
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Add Item
                      </>
                    )}
                  </Button>
                )}
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
