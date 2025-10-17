# API Testing Guide

This guide provides examples of how to test the backend API endpoints using curl or any HTTP client.

## Prerequisites

1. Set up environment variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Authentication

All API endpoints require authentication. You'll need to include the Supabase auth token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN
```

For testing without authentication, you can temporarily modify the routes to skip auth checks (not recommended for production).

## API Endpoints

### 1. Wardrobe Management

#### Get All Wardrobe Items
```bash
curl -X GET http://localhost:3000/api/wardrobe \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "uuid",
      "name": "Blue Cotton Shirt",
      "type": "Top",
      "material": "Cotton",
      "insulation_value": 3,
      "last_worn_date": "2025-10-10T00:00:00Z",
      "image_url": "https://...",
      "dress_code": ["Casual", "Business Casual"],
      "created_at": "2025-10-01T00:00:00Z"
    }
  ]
}
```

#### Add New Item
```bash
curl -X POST http://localhost:3000/api/wardrobe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blue Cotton Shirt",
    "type": "Top",
    "material": "Cotton",
    "insulation_value": 3,
    "image_url": "https://example.com/shirt.jpg",
    "dress_code": ["Casual", "Business Casual"],
    "color": "blue",
    "season_tags": ["spring", "summer"],
    "style_tags": ["casual"]
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": { /* created item */ },
  "message": "Item added successfully"
}
```

#### Get Specific Item
```bash
curl -X GET http://localhost:3000/api/wardrobe/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Item
```bash
curl -X PUT http://localhost:3000/api/wardrobe/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "insulation_value": 4,
    "dress_code": ["Casual"]
  }'
```

#### Delete Item
```bash
curl -X DELETE http://localhost:3000/api/wardrobe/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Outfit Logging

#### Log Outfit Usage
```bash
curl -X POST http://localhost:3000/api/outfit/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ids": [1, 2, 3, 4]
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "updated_count": 4
  },
  "message": "Successfully logged outfit usage for 4 items"
}
```

### 3. Calendar Integration

#### Get Calendar Events (Mock Data)
```bash
curl -X GET "http://localhost:3000/api/calendar/events?hours=24&provider=mock" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "mock-1",
      "title": "Team Meeting",
      "start_time": "2025-10-16T14:00:00Z",
      "end_time": "2025-10-16T15:00:00Z",
      "event_type": "Work/Business",
      "description": "Weekly team sync"
    }
  ],
  "message": "Using mock calendar data. Found 3 events in the next 24 hours."
}
```

### 4. Health/Activity Data

#### Get Health Activity (Mock Data)
```bash
curl -X GET "http://localhost:3000/api/health/activity?provider=mock" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "date": "2025-10-16T00:00:00Z",
    "planned_activity_level": "Medium",
    "steps": 7543,
    "active_minutes": 45
  },
  "message": "Using mock health activity data. Planned activity level based on current time."
}
```

### 5. Weather Data

#### Get Weather with Environmental Data (Mock)
```bash
curl -X GET "http://localhost:3000/api/weather?lat=40.7128&lon=-74.0060&provider=mock" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "weather": {
      "temperature": 22.5,
      "feels_like": 21.8,
      "humidity": 65,
      "wind_speed": 12.3,
      "uv_index": 7,
      "air_quality_index": 45,
      "pollen_count": 5.2,
      "weather_condition": "Partly Cloudy",
      "timestamp": "2025-10-16T12:00:00Z"
    },
    "alerts": [
      {
        "type": "UV",
        "severity": "moderate",
        "message": "High UV index detected",
        "recommendation": "Consider wearing a hat or sunglasses for extended outdoor exposure."
      }
    ]
  },
  "message": "Using mock weather data."
}
```

### 6. User Profile Settings

#### Get User Profile
```bash
curl -X GET http://localhost:3000/api/settings/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "John Doe",
    "region": "New York",
    "full_body_model_url": null,
    "preferences": {
      "temperature_sensitivity": 0.5,
      "styles": ["casual", "business casual"],
      "colors": ["blue", "black", "gray"]
    }
  }
}
```

#### Update User Profile
```bash
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "preferences": {
      "temperature_sensitivity": 1.0,
      "styles": ["casual", "athletic"]
    }
  }'
```

### 7. Recommendation Feedback

#### Submit Feedback
```bash
curl -X POST http://localhost:3000/api/recommendation/rec-123/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_liked": false,
    "reason": "I was too cold",
    "weather_conditions": {
      "temperature": 15,
      "feels_like": 13,
      "humidity": 60,
      "wind_speed": 10,
      "uv_index": 5,
      "air_quality_index": 50,
      "pollen_count": 3,
      "weather_condition": "Cloudy",
      "timestamp": "2025-10-16T08:00:00Z"
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "recommendation_id": "rec-123",
    "is_liked": false,
    "reason": "I was too cold",
    "created_at": "2025-10-16T12:00:00Z"
  },
  "message": "Feedback recorded successfully"
}
```

## Testing Helper Functions

Run the test suite to verify helper functions:

```bash
npx tsx src/lib/helpers/__tests__/helpers.test.ts
```

Expected output:
```
🧪 Testing Backend Helper Functions

📅 Test 1: Event Classification
  "Team Meeting" → Work/Business
  "Gym Workout" → Gym/Active
  ...
✅ Event classification working

👕 Test 2: Last Worn Filter
  ...
✅ Last worn filtering working

🎉 All tests passed!
```

## Error Handling

All endpoints return consistent error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: name, type, image_url"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Item not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

## Mock Data vs Production

All endpoints support mock data for testing without external API dependencies:

- **Weather API**: Use `?provider=mock` to get mock weather data
- **Calendar API**: Use `?provider=mock` to get mock calendar events
- **Health API**: Use `?provider=mock` to get mock activity data

For production:
1. Set up API keys in environment variables
2. Remove `provider=mock` parameter
3. Implement OAuth flows where required

## Next Steps

1. **Database Setup**: Create required tables in Supabase
   - Update `clothing_items` table with new fields
   - Create `recommendation_feedback` table

2. **External APIs**: Set up integrations
   - Google Calendar OAuth
   - Tomorrow.io or OpenWeatherMap API
   - Fitbit or Apple Health API

3. **Frontend**: Build UI to consume these APIs
   - Wardrobe management interface
   - Recommendation display with reasoning
   - Feedback collection forms

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Type Errors
All types are exported from `src/lib/types.ts`. Import what you need:
```typescript
import { IClothingItem, WeatherData, CalendarEvent } from '@/lib/types';
```

### Environment Variables
Make sure `.env.local` is created and contains required variables. The app will show warnings but continue to work with mock data.
