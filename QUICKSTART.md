# What2Wear UI - Quick Start Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account (for backend integration)

## Installation

```bash
# Install dependencies
npm install
```

## Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For development with mock data, you can use:
```env
NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-for-development
```

## Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## Build & Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run dev-webpack` - Start development server with Webpack
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (/)
│   ├── wardrobe/          # Virtual wardrobe (/wardrobe)
│   ├── settings/          # Settings (/settings)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind CSS
├── components/
│   └── ui/                # Reusable UI components
├── types/                 # TypeScript type definitions
└── lib/                   # Utility functions
```

## Features

### Dashboard (/)
- View recommended outfit for the day
- See weather conditions (temperature, AQI, UV, pollen)
- Check hourly forecast
- Log outfit usage
- Provide feedback

### Wardrobe (/wardrobe)
- View all clothing items
- Filter by type (Outerwear, Top, Bottom, etc.)
- See when items were last worn
- Add new items (placeholder)

### Settings (/settings)
- Update profile information
- Adjust temperature sensitivity
- Set variety preference (days between wearing items)

## Mock Data

The application currently uses mock data for demonstration purposes. All components are ready for backend integration via the existing API endpoints:

- `GET /api/recommendation/current`
- `POST /api/outfit/log`
- `GET /api/wardrobe`
- `POST /api/wardrobe`
- `GET /api/settings/profile`
- `PUT /api/settings/profile`

## Customization

### Colors
Edit `src/app/globals.css` to modify the color scheme:
```css
@theme {
  --color-primary: #06b6d4;    /* Teal accent */
  --color-accent: #3b82f6;     /* Blue accent */
  --color-background: #0a0a0b; /* Dark background */
  /* ... more colors */
}
```

### Components
All UI components are in `src/components/ui/` and can be customized with Tailwind classes.

## Troubleshooting

### Build Errors
If you encounter build errors:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables
Make sure `.env.local` exists with valid Supabase credentials.

### Port Already in Use
If port 3000 is in use:
```bash
PORT=3001 npm run dev
```

## Documentation

- Full implementation details: `IMPLEMENTATION_NOTES.md`
- Backend API documentation: `API_TESTING_GUIDE.md`
- Project summary: `PROJECT_SUMMARY.md`

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
