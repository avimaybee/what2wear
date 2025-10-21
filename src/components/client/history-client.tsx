/**
 * Outfit History Client Component
 * 
 * Displays outfit history with infinite scroll, filtering, and search
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitHistoryCard } from '@/components/ui/outfit-history-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, Filter, Calendar, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';

interface OutfitItem {
  id: number;
  name: string;
  type: string;
  image_url: string;
  color: string;
  category: string;
}

interface OutfitHistoryItem {
  id: number;
  outfit_date: string;
  rendered_image_url: string | null;
  feedback: number | null;
  created_at: string;
  items: OutfitItem[];
}

interface HistoryClientProps {
  userId: string;
}

export function HistoryClient({ userId }: HistoryClientProps) {
  const [outfits, setOutfits] = useState<OutfitHistoryItem[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<OutfitHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    season: '',
    minFeedback: '',
    startDate: '',
    endDate: ''
  });
  
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Fetch outfits
  const fetchOutfits = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(activeFilters.season && { season: activeFilters.season }),
        ...(activeFilters.minFeedback && { minFeedback: activeFilters.minFeedback }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate })
      });
      
      const response = await fetch(`/api/outfits/history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch outfit history');
      }
      
      const data = await response.json();
      
      if (append) {
        setOutfits(prev => [...prev, ...data.data]);
        setFilteredOutfits(prev => [...prev, ...data.data]);
      } else {
        setOutfits(data.data);
        setFilteredOutfits(data.data);
      }
      
      setHasMore(data.pagination.hasMore);
      
    } catch (error) {
      console.error('Error fetching outfit history:', error);
      toast.error('Failed to load outfit history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, activeFilters]);
  
  // Initial fetch
  useEffect(() => {
    fetchOutfits(1, false);
  }, [fetchOutfits]);
  
  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchOutfits(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, fetchOutfits]);
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };
  
  // Handle filter change
  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterKey]: value }));
    setPage(1);
  };
  
  // Clear filters
  const clearFilters = () => {
    setActiveFilters({
      season: '',
      minFeedback: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
    setPage(1);
  };
  
  // Handle reuse outfit
  const handleReuse = async (outfit: OutfitHistoryItem) => {
    toast.success(`${outfit.items.length} items added to today's outfit`);
  };
  
  // Handle delete outfit
  const handleDelete = async (outfitId: number) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return;
    
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }
      
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
      setFilteredOutfits(prev => prev.filter(o => o.id !== outfitId));
      
      toast.success('Outfit deleted from your history');
    } catch (error) {
      console.error('Error deleting outfit:', error);
      toast.error('Failed to delete outfit');
    }
  };
  
  const hasActiveFilters = Object.values(activeFilters).some(v => v) || searchQuery;
  
  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (filteredOutfits.length === 0 && !isLoading) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={Search}
          title="No outfits found"
          description="Try adjusting your search or filters"
          actions={[{
            label: 'Clear Filters',
            onClick: clearFilters
          }]}
        />
      );
    }
    
    return (
      <EmptyState
        icon={Calendar}
        title="No outfit history yet"
        description="Start logging your daily outfits to build your style timeline"
        actions={[{
          label: 'Get Started',
          onClick: () => window.location.href = '/'
        }]}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by item name, color, or category..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(activeFilters).filter(v => v).length + (searchQuery ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter Outfits</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="date"
                        value={activeFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        placeholder="Start date"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={activeFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Minimum Feedback */}
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Button
                        key={rating}
                        variant={activeFilters.minFeedback === rating.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('minFeedback', rating.toString())}
                        className="flex-1"
                      >
                        {rating}★
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Season Filter */}
                <div className="space-y-2">
                  <Label>Season</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Spring', 'Summer', 'Fall', 'Winter'].map(season => (
                      <Button
                        key={season}
                        variant={activeFilters.season === season ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('season', season)}
                      >
                        {season}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <button onClick={() => handleSearch('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {Object.entries(activeFilters).map(([key, value]) =>
              value ? (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key}: {value}
                  <button onClick={() => handleFilterChange(key, '')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null
            )}
          </div>
        )}
      </div>
      
      {/* Outfit Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutfits.map((outfit, index) => (
            <OutfitHistoryCard
              key={outfit.id}
              id={outfit.id}
              date={outfit.outfit_date}
              items={outfit.items}
              feedback={outfit.feedback}
              renderedImage={outfit.rendered_image_url}
              onReuse={() => handleReuse(outfit)}
              onDelete={() => handleDelete(outfit.id)}
              index={index}
            />
          ))}
        </div>
      </AnimatePresence>
      
      {/* Load More Trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm">Loading more outfits...</p>
            </div>
          )}
        </div>
      )}
      
      {/* End Message */}
      {!hasMore && filteredOutfits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached the beginning of your style journey! 🎉
          </p>
        </motion.div>
      )}
    </div>
  );
}
