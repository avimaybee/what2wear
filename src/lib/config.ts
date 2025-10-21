/**
 * Centralized Configuration (Task 0.2)
 * 
 * This file manages all API keys, base URLs, and configuration variables
 * for the What2Wear application.
 */

// ============================================================================
// Environment Variables Validation
// ============================================================================

const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (required && !value) {
    console.warn(`Warning: ${key} environment variable is not set`);
    return '';
  }
  return value || '';
};

// ============================================================================
// Supabase Configuration
// ============================================================================

export const supabaseConfig = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
} as const;

// ============================================================================
// Weather API Configuration (Task 3.1)
// ============================================================================

export const weatherConfig = {
  // Tomorrow.io API (preferred for advanced features)
  tomorrowIo: {
    apiKey: getEnvVar('TOMORROW_IO_API_KEY', false),
    baseUrl: 'https://api.tomorrow.io/v4',
    endpoints: {
      timelines: '/timelines',
      realtime: '/weather/realtime',
    },
  },
  
  // OpenWeatherMap API (fallback)
  openWeather: {
    apiKey: getEnvVar('OPENWEATHER_API_KEY', false),
    baseUrl: 'https://api.openweathermap.org/data/3.0',
    endpoints: {
      onecall: '/onecall',
      current: '/weather',
    },
  },
  
  // Default configuration
  defaultProvider: 'tomorrowIo' as 'tomorrowIo' | 'openWeather',
  cacheDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;

// ============================================================================
// Calendar API Configuration (Task 2.1)
// ============================================================================

export const calendarConfig = {
  google: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID', false),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', false),
    redirectUri: getEnvVar('GOOGLE_REDIRECT_URI', false),
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
  },
  
  // iCal configuration for generic calendar support
  iCal: {
    enabled: true,
  },
  
  // Event fetch window
  fetchWindow: {
    hours: 24, // Fetch events for next 24 hours
  },
} as const;

// ============================================================================
// Health/Activity API Configuration (Task 2.3)
// ============================================================================

export const healthConfig = {
  appleHealth: {
    enabled: false, // Placeholder for future implementation
  },
  
  fitbit: {
    clientId: getEnvVar('FITBIT_CLIENT_ID', false),
    clientSecret: getEnvVar('FITBIT_CLIENT_SECRET', false),
    apiBaseUrl: 'https://api.fitbit.com/1',
  },
  
  // Default configuration
  defaultProvider: 'mock' as 'appleHealth' | 'fitbit' | 'mock',
} as const;

// ============================================================================
// AI/ML Configuration (Task 4.x)
// ============================================================================

export const aiConfig = {
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY', false),
    model: 'gemini-2.5-flash',
    visionModel: 'gemini-pro-vision',
  },
  
  // Learning parameters
  learning: {
    feedbackWeight: 0.1, // How much each feedback adjusts preferences
    minFeedbackCount: 5, // Minimum feedback before adjusting preferences
  },
} as const;

// ============================================================================
// Application Configuration
// ============================================================================

export const appConfig = {
  // Recommendation settings (Task 1.4)
  recommendations: {
    minDaysSinceWorn: 7, // Minimum days before suggesting an item again
    varietyBoost: true, // Prioritize less-worn items
    defaultConfidenceThreshold: 0.7,
  },
  
  // Weather alerts thresholds (Task 3.3)
  alerts: {
    uvIndex: {
      high: 7,
      veryHigh: 10,
    },
    aqi: {
      moderate: 50,
      unhealthy: 100,
      veryUnhealthy: 150,
    },
    pollen: {
      high: 7.3,
      veryHigh: 9.7,
    },
  },
  
  // Pagination defaults
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;

// ============================================================================
// API Endpoints (Internal)
// ============================================================================

export const apiEndpoints = {
  // Wardrobe endpoints (Task 1.2)
  wardrobe: {
    base: '/api/wardrobe',
    byId: (id: number) => `/api/wardrobe/${id}`,
  },
  
  // Outfit endpoints (Task 1.3)
  outfit: {
    log: '/api/outfit/log',
    create: '/api/outfit',
  },
  
  // Calendar endpoints (Task 2.1)
  calendar: {
    events: '/api/calendar/events',
  },
  
  // Health endpoints (Task 2.3)
  health: {
    activity: '/api/health/activity',
  },
  
  // Weather endpoints (Task 3.1)
  weather: {
    current: '/api/weather',
  },
  
  // Settings endpoints
  settings: {
    profile: '/api/settings/profile',
  },
  
  // Recommendation endpoints (Task 4.1)
  recommendations: {
    feedback: (id: string) => `/api/recommendation/${id}/feedback`,
  },
} as const;

// ============================================================================
// Export all configs
// ============================================================================

export const config = {
  supabase: supabaseConfig,
  weather: weatherConfig,
  calendar: calendarConfig,
  health: healthConfig,
  ai: aiConfig,
  app: appConfig,
  endpoints: apiEndpoints,
} as const;

export default config;
