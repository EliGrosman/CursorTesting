#!/bin/bash

echo "🚀 Starting Claude Clone..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    echo ""
fi

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  No .env file found in server directory!"
    echo "Creating .env from .env.example..."
    cp server/.env.example server/.env
    echo ""
    echo "⚠️  IMPORTANT: Please edit server/.env and add your Anthropic API key!"
    echo "Then run this script again."
    exit 1
fi

# Check if API key is set
if grep -q "your_anthropic_api_key_here" server/.env; then
    echo "⚠️  Please update your Anthropic API key in server/.env"
    echo "Get your API key at: https://console.anthropic.com/"
    exit 1
fi

echo "✅ Configuration looks good!"
echo ""
echo "🌐 Starting servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the application
npm run dev