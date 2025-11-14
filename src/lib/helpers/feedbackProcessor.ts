/**
 * Feedback Processor
 * 
 * Processes user feedback (likes/dislikes) on outfit recommendations
 * and adjusts recommendation weights accordingly.
 * 
 * This makes the AI learn what the user likes over time.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { IClothingItem } from '@/lib/types';

export interface FeedbackInput {
  userId: string;
  recommendationId: string;
  isLiked: boolean;
  reason?: string;
  outfitItems: IClothingItem[];
  weather?: {
    temperature: number;
    condition: string;
  };
}

export interface FeedbackAnalysis {
  preferredColors: Record<string, number>;
  preferredStyles: Record<string, number>;
  preferredMaterials: Record<string, number>;
  preferredCombinations: Array<{
    item1Type: string;
    item2Type: string;
    score: number;
  }>;
  likeDislikeRatio: number;
}

/**
 * Process user feedback and adjust recommendation weights
 */
export async function processFeedback(input: FeedbackInput): Promise<{
  success: boolean;
  analysis?: FeedbackAnalysis;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== input.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Save feedback to database
    const { error: feedbackError } = await supabase
      .from('recommendation_feedback')
      .insert({
        user_id: input.userId,
        recommendation_id: input.recommendationId,
        is_liked: input.isLiked,
        reason: input.reason,
        weather_conditions: input.weather,
        created_at: new Date().toISOString(),
      });

    if (feedbackError) {
      logger.error('Failed to save feedback', { error: feedbackError });
      return { success: false, error: feedbackError.message };
    }

    // 2. Analyze feedback to extract preferences
    const analysis = analyzeFeedback(input);

    // 3. Update user preference scores (optional - can be done in background)
    if (input.isLiked) {
      await updateUserPreferences(input.userId, analysis);
    }

    logger.info('Feedback processed successfully', {
      userId: input.userId,
      isLiked: input.isLiked,
      itemCount: input.outfitItems.length,
    });

    return { success: true, analysis };
  } catch (error) {
    logger.error('Error processing feedback', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Analyze outfit feedback to extract user preferences
 */
function analyzeFeedback(input: FeedbackInput): FeedbackAnalysis {
  const preferredColors: Record<string, number> = {};
  const preferredStyles: Record<string, number> = {};
  const preferredMaterials: Record<string, number> = {};
  const preferredCombinations: Array<{
    item1Type: string;
    item2Type: string;
    score: number;
  }> = [];

  // Only count if liked
  const weight = input.isLiked ? 1 : -0.5;

  // Extract color preferences
  input.outfitItems.forEach((item) => {
    if (item.color) {
      const color = item.color.toLowerCase();
      preferredColors[color] = (preferredColors[color] || 0) + weight;
    }

    if (item.style) {
      const style = item.style.toLowerCase();
      preferredStyles[style] = (preferredStyles[style] || 0) + weight;
    }

    if (item.material) {
      const material = item.material.toLowerCase();
      preferredMaterials[material] = (preferredMaterials[material] || 0) + weight;
    }
  });

  // Extract combination preferences (e.g., "top with bottom")
  for (let i = 0; i < input.outfitItems.length; i++) {
    for (let j = i + 1; j < input.outfitItems.length; j++) {
      const item1 = input.outfitItems[i];
      const item2 = input.outfitItems[j];
      preferredCombinations.push({
        item1Type: item1.type,
        item2Type: item2.type,
        score: weight,
      });
    }
  }

  // Fetch user's feedback history for ratio
  const likeDislikeRatio = 0.5; // This would be calculated from actual data

  return {
    preferredColors,
    preferredStyles,
    preferredMaterials,
    preferredCombinations,
    likeDislikeRatio,
  };
}

/**
 * Update user preference weights based on feedback
 */
async function updateUserPreferences(userId: string, analysis: FeedbackAnalysis): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch user preferences from profiles table
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      logger.warn('Could not fetch user profile for preferences', { error: fetchError });
      return;
    }

    const existingPrefs = profile?.preferences || {};

    // Merge with new preferences
    const updatedPreferences = {
      ...existingPrefs,
      colors: mergePreferences(
        existingPrefs.colors || {},
        analysis.preferredColors
      ),
      styles: mergePreferences(
        existingPrefs.styles || {},
        analysis.preferredStyles
      ),
      materials: mergePreferences(
        existingPrefs.materials || {},
        analysis.preferredMaterials
      ),
    };

    // Save updated preferences
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ preferences: updatedPreferences })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to update user preferences', { error: updateError });
    } else {
      logger.info('User preferences updated successfully', { userId });
    }
  } catch (error) {
    logger.error('Error updating user preferences', { error });
  }
}

/**
 * Merge old preferences with new feedback
 * Uses weighted average to gradually shift preferences
 */
function mergePreferences(
  existing: Record<string, number>,
  feedback: Record<string, number>
): Record<string, number> {
  const merged = { ...existing };
  const decayFactor = 0.95; // Decay old preferences slightly

  // Apply decay to existing
  Object.keys(merged).forEach((key) => {
    merged[key] = merged[key] * decayFactor;
  });

  // Add new feedback
  Object.entries(feedback).forEach(([key, value]) => {
    merged[key] = (merged[key] || 0) + value;
  });

  // Filter out very low scores
  Object.keys(merged).forEach((key) => {
    if (Math.abs(merged[key]) < 0.1) {
      delete merged[key];
    }
  });

  return merged;
}

/**
 * Get user's learned preferences
 */
export async function getUserPreferences(userId: string): Promise<{
  colors: string[];
  styles: string[];
  materials: string[];
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('Could not fetch user preferences', { error });
      return { colors: [], styles: [], materials: [] };
    }

    const prefs = data?.preferences as Record<string, Record<string, number>> || {};

    // Extract arrays of preferred items (those with positive scores), sorted by score
    return {
      colors: Object.entries((prefs.colors as Record<string, number>) || {})
        .filter(([_, score]) => (score as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([color]) => color),
      styles: Object.entries((prefs.styles as Record<string, number>) || {})
        .filter(([_, score]) => (score as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([style]) => style),
      materials: Object.entries((prefs.materials as Record<string, number>) || {})
        .filter(([_, score]) => (score as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([material]) => material),
    };
  } catch (error) {
    logger.error('Error getting user preferences', { error });
    return { colors: [], styles: [], materials: [] };
  }
}

/**
 * Calculate feedback score boost for recommendation
 * Used to adjust scores for items matching user preferences
 */
export function calculatePreferenceBoost(
  item: IClothingItem,
  userPreferences: ReturnType<typeof getUserPreferences> extends Promise<infer T> ? T : never
): number {
  let boost = 0;

  // Color preference boost
  if (item.color && userPreferences.colors.includes(item.color.toLowerCase())) {
    boost += 0.15;
  }

  // Style preference boost
  if (item.style && userPreferences.styles.includes(item.style.toLowerCase())) {
    boost += 0.15;
  }

  // Material preference boost
  if (item.material && userPreferences.materials.includes(item.material.toLowerCase())) {
    boost += 0.15;
  }

  return boost;
}
