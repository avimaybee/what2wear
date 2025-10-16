export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>What2Wear Backend API</h1>
      <p>Backend enhancement implementation complete. API routes available:</p>
      
      <h2>Wardrobe Management</h2>
      <ul>
        <li>GET /api/wardrobe - Get all wardrobe items</li>
        <li>POST /api/wardrobe - Add new item</li>
        <li>GET /api/wardrobe/[id] - Get specific item</li>
        <li>PUT /api/wardrobe/[id] - Update item</li>
        <li>DELETE /api/wardrobe/[id] - Delete item</li>
      </ul>

      <h2>Outfit Logging</h2>
      <ul>
        <li>POST /api/outfit/log - Log outfit usage and update last_worn_date</li>
      </ul>

      <h2>Contextual Data</h2>
      <ul>
        <li>GET /api/calendar/events - Fetch calendar events</li>
        <li>GET /api/health/activity - Fetch health/activity data</li>
      </ul>

      <h2>Weather & Environment</h2>
      <ul>
        <li>GET /api/weather - Get weather with UV, AQI, Pollen data</li>
      </ul>

      <h2>Settings & Profile</h2>
      <ul>
        <li>GET /api/settings/profile - Get user profile</li>
        <li>PUT /api/settings/profile - Update user profile</li>
      </ul>

      <h2>Recommendations & Feedback</h2>
      <ul>
        <li>POST /api/recommendation/[id]/feedback - Submit recommendation feedback</li>
      </ul>
    </div>
  );
}
