import { EventType, CalendarEvent } from '@/lib/types';

/**
 * Task 2.2: Event Type Classification
 * Classifies calendar events based on their title and description
 */

// Keywords for different event types
const EVENT_KEYWORDS = {
  work: [
    'meeting', 'standup', 'sync', 'call', 'conference', 'presentation',
    'review', 'interview', 'client', 'deadline', 'workshop', 'training',
    'office', 'work', 'project', 'team', 'business', 'sprint'
  ],
  gym: [
    'gym', 'workout', 'exercise', 'fitness', 'run', 'jog', 'yoga',
    'pilates', 'crossfit', 'cardio', 'training', 'sports', 'swim',
    'cycling', 'bike', 'hike', 'climb', 'basketball', 'tennis',
    'soccer', 'football', 'marathon', 'race', 'athletics'
  ],
  social: [
    'dinner', 'lunch', 'breakfast', 'coffee', 'drinks', 'party',
    'birthday', 'celebration', 'hangout', 'friends', 'date',
    'movie', 'concert', 'event', 'gathering', 'meetup'
  ]
};

/**
 * Classifies a calendar event based on its title
 * @param title - The event title to classify
 * @returns The classified event type
 */
export function classifyEvent(title: string): EventType {
  const lowerTitle = title.toLowerCase();
  
  // Check for gym/active keywords
  const hasGymKeyword = EVENT_KEYWORDS.gym.some(keyword => 
    lowerTitle.includes(keyword)
  );
  if (hasGymKeyword) {
    return 'Gym/Active';
  }
  
  // Check for work/business keywords
  const hasWorkKeyword = EVENT_KEYWORDS.work.some(keyword => 
    lowerTitle.includes(keyword)
  );
  if (hasWorkKeyword) {
    return 'Work/Business';
  }
  
  // Check for casual/social keywords
  const hasSocialKeyword = EVENT_KEYWORDS.social.some(keyword => 
    lowerTitle.includes(keyword)
  );
  if (hasSocialKeyword) {
    return 'Casual/Social';
  }
  
  // Default to casual/social if no specific keywords found
  return 'Casual/Social';
}

/**
 * Classifies a full calendar event object
 * Uses both title and description for better accuracy
 * @param event - The calendar event to classify
 * @returns The event with updated event_type
 */
export function classifyCalendarEvent(event: CalendarEvent): CalendarEvent {
  const combinedText = `${event.title} ${event.description || ''}`;
  const eventType = classifyEvent(combinedText);
  
  return {
    ...event,
    event_type: eventType,
  };
}

/**
 * Batch classify multiple events
 * @param events - Array of calendar events to classify
 * @returns Array of events with classified event_types
 */
export function classifyCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.map(classifyCalendarEvent);
}
