#!/bin/bash

# What2Wear Backend Setup Script
# This script helps you set up the backend quickly

echo "🎨 What2Wear Backend Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the app/ directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up environment variables..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.local and add your API keys:"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - OPENWEATHER_API_KEY"
    else
        echo "❌ .env.example not found. Creating basic template..."
        cat > .env.local << 'EOF'
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Weather API (Required)
OPENWEATHER_API_KEY=your_openweather_api_key_here
EOF
        echo "✅ Created basic .env.local template"
    fi
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit app/.env.local and add your API keys"
echo "2. Run the database migration in Supabase"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: QUICK_START.md"
echo "   - API Guide: BACKEND_API_GUIDE.md"
echo "   - Full Details: BACKEND_IMPLEMENTATION_COMPLETE.md"
echo ""
echo "🚀 Ready to build amazing outfit recommendations!"
