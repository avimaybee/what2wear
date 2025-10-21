/**
 * Gamification Statistics Calculator
 * 
 * Calculates user engagement metrics and statistics:
 * - Outfit logging streak
 * - Style consistency score
 * - Wardrobe diversity metrics
 * - Usage patterns
 * - Achievement progress
 */

import { createClient } from "@/lib/supabase/client";

export interface UserStats {
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  totalOutfitsLogged: number;
  
  // Style metrics
  styleConsistencyScore: number; // 0-100
  favoriteStyle: string | null;
  styleDistribution: Record<string, number>;
  
  // Wardrobe diversity
  wardrobeSize: number;
  categoryDistribution: Record<string, number>;
  colorDiversity: number; // 0-100
  mostWornItem: {
    id: number;
    name: string;
    timesWorn: number;
  } | null;
  
  // Usage patterns
  averageOutfitsPerWeek: number;
  lastLoggedDate: string | null;
  weeklyActivity: number[]; // Last 7 days
  
  // Achievements
  achievements: Achievement[];
  totalAchievements: number;
  unlockedAchievements: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number; // 0-100
  target?: number;
  current?: number;
}

/**
 * Calculate user's current outfit logging streak
 */
export async function calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
  const supabase = createClient();
  
  // Get all outfit dates, sorted descending
  const { data: outfits, error } = await supabase
    .from('outfits')
    .select('outfit_date')
    .eq('user_id', userId)
    .order('outfit_date', { ascending: false });
  
  if (error || !outfits || outfits.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  const dates = outfits.map(o => new Date(o.outfit_date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const expectedDate = new Date(today);
  
  // Calculate current streak
  for (const date of dates) {
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === expectedDate.getTime()) {
      currentStreak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (date.getTime() < expectedDate.getTime()) {
      // Gap in streak - current streak ends
      break;
    }
  }
  
  // Calculate longest streak
  const checkDate = dates[0];
  tempStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, currentStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

/**
 * Calculate style consistency score based on dress codes
 */
export async function calculateStyleConsistency(userId: string): Promise<{
  score: number;
  favoriteStyle: string | null;
  distribution: Record<string, number>;
}> {
  const supabase = createClient();
  
  // Get all logged outfits with their items
  const { data: outfits, error } = await supabase
    .from('outfits')
    .select(`
      id,
      outfit_items (
        clothing_item_id
      )
    `)
    .eq('user_id', userId);
  
  if (error || !outfits || outfits.length === 0) {
    return { score: 0, favoriteStyle: null, distribution: {} };
  }
  
  // Get clothing items with dress codes
  const itemIds = outfits.flatMap(outfit => 
    outfit.outfit_items?.map((oi: { clothing_item_id: number }) => oi.clothing_item_id) || []
  );
  
  if (itemIds.length === 0) {
    return { score: 0, favoriteStyle: null, distribution: {} };
  }
  
  const { data: items } = await supabase
    .from('clothing_items')
    .select('id, dress_code')
    .in('id', itemIds);
  
  if (!items || items.length === 0) {
    return { score: 0, favoriteStyle: null, distribution: {} };
  }
  
  // Count style occurrences
  const styleCount: Record<string, number> = {};
  items.forEach((item: { id: number; dress_code: string[] | null }) => {
    if (item.dress_code && Array.isArray(item.dress_code)) {
      item.dress_code.forEach((style: string) => {
        styleCount[style] = (styleCount[style] || 0) + 1;
      });
    }
  });
  
  const totalStyles = Object.values(styleCount).reduce((sum, count) => sum + count, 0);
  const favoriteStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Calculate consistency score (higher if user sticks to fewer styles)
  const uniqueStyles = Object.keys(styleCount).length;
  const dominance = favoriteStyle ? (styleCount[favoriteStyle] / totalStyles) : 0;
  const score = Math.round((dominance * 70) + ((1 / (uniqueStyles || 1)) * 30));
  
  return {
    score: Math.min(100, score),
    favoriteStyle,
    distribution: styleCount
  };
}

/**
 * Calculate wardrobe diversity metrics
 */
export async function calculateWardrobeDiversity(userId: string): Promise<{
  size: number;
  categoryDistribution: Record<string, number>;
  colorDiversity: number;
  mostWornItem: { id: number; name: string; timesWorn: number } | null;
}> {
  const supabase = createClient();
  
  const { data: items, error } = await supabase
    .from('clothing_items')
    .select('id, name, category, color, last_worn_date')
    .eq('user_id', userId);
  
  if (error || !items || items.length === 0) {
    return {
      size: 0,
      categoryDistribution: {},
      colorDiversity: 0,
      mostWornItem: null
    };
  }
  
  // Category distribution
  const categoryCount: Record<string, number> = {};
  const colorSet = new Set<string>();
  
  items.forEach((item: { category?: string; color?: string }) => {
    if (item.category) {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    }
    if (item.color) {
      colorSet.add(item.color.toLowerCase());
    }
  });
  
  // Color diversity (more unique colors = higher score)
  const colorDiversity = Math.min(100, Math.round((colorSet.size / items.length) * 100));
  
  // Find most worn item
  const { data: wornItems } = await supabase
    .from('outfit_items')
    .select('clothing_item_id, clothing_items!inner(id, name)')
    .eq('clothing_items.user_id', userId);
  
  let mostWornItem = null;
  if (wornItems && wornItems.length > 0) {
    const wornCount: Record<number, { name: string; count: number }> = {};
    
    wornItems.forEach(item => {
      const id = item.clothing_item_id;
      const name = Array.isArray(item.clothing_items) && item.clothing_items.length > 0 
        ? item.clothing_items[0].name 
        : 'Unknown';
      
      if (!wornCount[id]) {
        wornCount[id] = { name, count: 0 };
      }
      wornCount[id].count++;
    });
    
    const mostWorn = Object.entries(wornCount).sort((a, b) => b[1].count - a[1].count)[0];
    if (mostWorn) {
      mostWornItem = {
        id: parseInt(mostWorn[0]),
        name: mostWorn[1].name,
        timesWorn: mostWorn[1].count
      };
    }
  }
  
  return {
    size: items.length,
    categoryDistribution: categoryCount,
    colorDiversity,
    mostWornItem
  };
}

/**
 * Calculate weekly activity metrics
 */
export async function calculateWeeklyActivity(userId: string): Promise<{
  averagePerWeek: number;
  lastLoggedDate: string | null;
  weeklyActivity: number[];
}> {
  const supabase = createClient();
  
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Get outfits from last 7 days
  const { data: recentOutfits, error: recentError } = await supabase
    .from('outfits')
    .select('outfit_date')
    .eq('user_id', userId)
    .gte('outfit_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('outfit_date', { ascending: false });
  
  // Get all outfits for average calculation
  const { data: allOutfits, error: allError } = await supabase
    .from('outfits')
    .select('outfit_date, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  const weeklyActivity = new Array(7).fill(0);
  
  if (recentOutfits && recentOutfits.length > 0) {
    recentOutfits.forEach(outfit => {
      const date = new Date(outfit.outfit_date);
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 7) {
        weeklyActivity[6 - daysAgo]++;
      }
    });
  }
  
  let averagePerWeek = 0;
  let lastLoggedDate = null;
  
  if (allOutfits && allOutfits.length > 0) {
    const firstDate = new Date(allOutfits[0].created_at);
    const weeksSinceFirst = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    averagePerWeek = Math.round((allOutfits.length / weeksSinceFirst) * 10) / 10;
    
    lastLoggedDate = allOutfits[allOutfits.length - 1].outfit_date;
  }
  
  return {
    averagePerWeek,
    lastLoggedDate,
    weeklyActivity
  };
}

/**
 * Define all available achievements
 */
export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'current'>[] = [
  {
    id: 'first_outfit',
    title: 'Fashion Debut',
    description: 'Log your first outfit',
    icon: '👔',
    target: 1
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day logging streak',
    icon: '🔥',
    target: 7
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Maintain a 30-day logging streak',
    icon: '🏆',
    target: 30
  },
  {
    id: 'streak_100',
    title: 'Century Club',
    description: 'Maintain a 100-day logging streak',
    icon: '💯',
    target: 100
  },
  {
    id: 'outfits_10',
    title: 'Getting Started',
    description: 'Log 10 outfits',
    icon: '✨',
    target: 10
  },
  {
    id: 'outfits_50',
    title: 'Style Explorer',
    description: 'Log 50 outfits',
    icon: '🌟',
    target: 50
  },
  {
    id: 'outfits_100',
    title: 'Fashion Curator',
    description: 'Log 100 outfits',
    icon: '👑',
    target: 100
  },
  {
    id: 'wardrobe_20',
    title: 'Collector',
    description: 'Build a wardrobe of 20+ items',
    icon: '👕',
    target: 20
  },
  {
    id: 'wardrobe_50',
    title: 'Fashionista',
    description: 'Build a wardrobe of 50+ items',
    icon: '🎽',
    target: 50
  },
  {
    id: 'style_consistent',
    title: 'Style Icon',
    description: 'Achieve 80% style consistency',
    icon: '💎',
    target: 80
  },
  {
    id: 'color_diverse',
    title: 'Rainbow Warrior',
    description: 'Achieve 70% color diversity',
    icon: '🌈',
    target: 70
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Log an outfit before 8 AM',
    icon: '🌅',
    target: 1
  }
];

/**
 * Check which achievements user has unlocked
 */
export async function calculateAchievements(userId: string, stats: Partial<UserStats>): Promise<Achievement[]> {
  const achievements: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    let unlocked = false;
    let current = 0;
    let progress = 0;
    
    switch (achievement.id) {
      case 'first_outfit':
        current = stats.totalOutfitsLogged || 0;
        unlocked = current >= 1;
        progress = Math.min(100, (current / 1) * 100);
        break;
        
      case 'streak_7':
        current = stats.currentStreak || 0;
        unlocked = current >= 7;
        progress = Math.min(100, (current / 7) * 100);
        break;
        
      case 'streak_30':
        current = stats.longestStreak || 0;
        unlocked = current >= 30;
        progress = Math.min(100, (current / 30) * 100);
        break;
        
      case 'streak_100':
        current = stats.longestStreak || 0;
        unlocked = current >= 100;
        progress = Math.min(100, (current / 100) * 100);
        break;
        
      case 'outfits_10':
        current = stats.totalOutfitsLogged || 0;
        unlocked = current >= 10;
        progress = Math.min(100, (current / 10) * 100);
        break;
        
      case 'outfits_50':
        current = stats.totalOutfitsLogged || 0;
        unlocked = current >= 50;
        progress = Math.min(100, (current / 50) * 100);
        break;
        
      case 'outfits_100':
        current = stats.totalOutfitsLogged || 0;
        unlocked = current >= 100;
        progress = Math.min(100, (current / 100) * 100);
        break;
        
      case 'wardrobe_20':
        current = stats.wardrobeSize || 0;
        unlocked = current >= 20;
        progress = Math.min(100, (current / 20) * 100);
        break;
        
      case 'wardrobe_50':
        current = stats.wardrobeSize || 0;
        unlocked = current >= 50;
        progress = Math.min(100, (current / 50) * 100);
        break;
        
      case 'style_consistent':
        current = stats.styleConsistencyScore || 0;
        unlocked = current >= 80;
        progress = Math.min(100, (current / 80) * 100);
        break;
        
      case 'color_diverse':
        current = stats.colorDiversity || 0;
        unlocked = current >= 70;
        progress = Math.min(100, (current / 70) * 100);
        break;
        
      case 'early_bird':
        // This would require checking outfit creation times
        // For now, mark as not unlocked
        unlocked = false;
        progress = 0;
        break;
    }
    
    achievements.push({
      ...achievement,
      unlocked,
      progress: Math.round(progress),
      current
    });
  }
  
  return achievements;
}

/**
 * Get all user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  // Calculate all metrics in parallel
  const [
    streakData,
    styleData,
    diversityData,
    activityData
  ] = await Promise.all([
    calculateStreak(userId),
    calculateStyleConsistency(userId),
    calculateWardrobeDiversity(userId),
    calculateWeeklyActivity(userId)
  ]);
  
  // Get total outfits count
  const supabase = createClient();
  const { count } = await supabase
    .from('outfits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const totalOutfitsLogged = count || 0;
  
  // Build partial stats for achievement calculation
  const partialStats: Partial<UserStats> = {
    currentStreak: streakData.current,
    longestStreak: streakData.longest,
    totalOutfitsLogged,
    styleConsistencyScore: styleData.score,
    wardrobeSize: diversityData.size,
    colorDiversity: diversityData.colorDiversity
  };
  
  // Calculate achievements
  const achievements = await calculateAchievements(userId, partialStats);
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  
  return {
    currentStreak: streakData.current,
    longestStreak: streakData.longest,
    totalOutfitsLogged,
    styleConsistencyScore: styleData.score,
    favoriteStyle: styleData.favoriteStyle,
    styleDistribution: styleData.distribution,
    wardrobeSize: diversityData.size,
    categoryDistribution: diversityData.categoryDistribution,
    colorDiversity: diversityData.colorDiversity,
    mostWornItem: diversityData.mostWornItem,
    averageOutfitsPerWeek: activityData.averagePerWeek,
    lastLoggedDate: activityData.lastLoggedDate,
    weeklyActivity: activityData.weeklyActivity,
    achievements,
    totalAchievements: ACHIEVEMENTS.length,
    unlockedAchievements
  };
}
