import { RecommendationFeedback, UserPreferences, WeatherData } from '@/lib/types';
import { config } from '@/lib/config';

/**
 * Task 4.2: Preference Adjustment Logic
 * Processes user feedback to learn and adjust temperature sensitivity over time
 */

/**
 * Adjusts user temperature sensitivity based on feedback
 * 
 * @param currentPreferences - Current user preferences
 * @param feedback - User feedback on a recommendation
 * @returns Updated user preferences
 */
export function adjustPreferences(
  currentPreferences: UserPreferences,
  feedback: RecommendationFeedback
): UserPreferences {
  const updatedPreferences = { ...currentPreferences };
  
  // Initialize temperature_sensitivity if not set
  if (updatedPreferences.temperature_sensitivity === undefined) {
    updatedPreferences.temperature_sensitivity = 0; // Neutral baseline
  }

  // Only adjust if we have weather data and negative feedback
  if (!feedback.is_liked && feedback.weather_conditions) {
    const adjustment = calculateTemperatureAdjustment(
      feedback.weather_conditions,
      feedback.reason
    );
    
    if (adjustment !== 0) {
      // Apply adjustment with learning weight
      const currentSensitivity = updatedPreferences.temperature_sensitivity;
      const newSensitivity = currentSensitivity + 
        (adjustment * config.ai.learning.feedbackWeight);
      
      // Clamp to range [-2, 2]
      updatedPreferences.temperature_sensitivity = Math.max(
        -2,
        Math.min(2, newSensitivity)
      );
    }
  }

  return updatedPreferences;
}

/**
 * Calculate temperature sensitivity adjustment based on weather and feedback
 * 
 * @param weather - Weather conditions when outfit was worn
 * @param reason - Optional feedback reason
 * @returns Adjustment value (-1 for warmer, +1 for colder, 0 for no change)
 */
function calculateTemperatureAdjustment(
  weather: WeatherData,
  reason?: string
): number {
  // Parse reason for temperature-related keywords
  const lowerReason = (reason || '').toLowerCase();
  
  // Keywords indicating user was too cold
  const coldKeywords = [
    'cold', 'freezing', 'chilly', 'not warm enough',
    'needed more layers', 'too light'
  ];
  
  // Keywords indicating user was too warm
  const warmKeywords = [
    'hot', 'warm', 'sweating', 'too heavy', 'overdressed',
    'too many layers', 'stuffy'
  ];

  const wasTooWarm = warmKeywords.some(keyword => lowerReason.includes(keyword));
  const wasTooCold = coldKeywords.some(keyword => lowerReason.includes(keyword));

  if (wasTooWarm) {
    // User was too warm, adjust to prefer lighter clothing
    // (decrease temperature sensitivity, making them "feel warmer")
    return -1;
  }

  if (wasTooCold) {
    // User was too cold, adjust to prefer warmer clothing
    // (increase temperature sensitivity, making them "feel colder")
    return 1;
  }

  // If no explicit temperature feedback, make intelligent guess based on temperature
  // If it was objectively cold (< 10°C) and user didn't like it, they might prefer warmer
  if (weather.feels_like < 10) {
    return 0.5; // Slight adjustment towards warmer
  }

  // If it was objectively warm (> 25°C) and user didn't like it, they might prefer cooler
  if (weather.feels_like > 25) {
    return -0.5; // Slight adjustment towards cooler
  }

  return 0; // No adjustment needed
}

/**
 * Determines if enough feedback has been collected to make adjustments
 * 
 * @param feedbackCount - Number of feedback items collected
 * @returns Whether preference adjustments should be applied
 */
export function shouldAdjustPreferences(feedbackCount: number): boolean {
  return feedbackCount >= config.ai.learning.minFeedbackCount;
}

/**
 * Batch process multiple feedback items to update preferences
 * 
 * @param currentPreferences - Current user preferences
 * @param feedbacks - Array of user feedback items
 * @returns Updated user preferences
 */
export function batchAdjustPreferences(
  currentPreferences: UserPreferences,
  feedbacks: RecommendationFeedback[]
): UserPreferences {
  let updatedPreferences = { ...currentPreferences };
  
  // Check if we have enough feedback
  if (!shouldAdjustPreferences(feedbacks.length)) {
    return currentPreferences;
  }

  // Apply each feedback sequentially
  for (const feedback of feedbacks) {
    updatedPreferences = adjustPreferences(updatedPreferences, feedback);
  }

  return updatedPreferences;
}

/**
 * Get adjusted temperature for recommendation based on user sensitivity
 * 
 * @param actualTemperature - Actual weather temperature
 * @param userSensitivity - User's temperature sensitivity (-2 to 2)
 * @returns Adjusted temperature for recommendation calculations
 */
export function getAdjustedTemperature(
  actualTemperature: number,
  userSensitivity: number = 0
): number {
  // Each sensitivity point adjusts perceived temperature by ~3°C
  const adjustmentFactor = 3;
  
  // Positive sensitivity = feels colder = recommend warmer clothes
  // So we subtract from actual temp to make it seem colder
  const adjustedTemp = actualTemperature - (userSensitivity * adjustmentFactor);
  
  return adjustedTemp;
}
