#!/bin/bash

echo "🚀 Claude Clone Deployment Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Deployment Steps:"
echo "  1. Install dependencies"
echo "  2. Build application"
echo "  3. Run database migrations"
echo "  4. Deploy to Render"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
echo "✅ Dependencies installed"
echo ""

# Step 2: Build the application
echo "🔨 Building application..."
cd server && npm run build && cd ..
cd client && npm run build && cd ..
echo "✅ Application built"
echo ""

# Step 3: Run database migrations (if DATABASE_URL is available)
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  Running database migrations..."
    cd server && npm run db:migrate && cd ..
    echo "✅ Database migrations completed"
else
    echo "⚠️  DATABASE_URL not set - skipping migrations"
    echo "   Migrations will run during deployment on Render"
fi
echo ""

echo "🌐 Ready for deployment!"
echo "   The render.yaml file has been updated to run migrations automatically"
echo "   You can now deploy by pushing to your repository"
echo ""
echo "📝 Manual migration command (if needed):"
echo "   cd server && npm run db:migrate"
echo ""