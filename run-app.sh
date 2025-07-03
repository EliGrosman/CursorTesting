#!/bin/bash

echo "🚀 Starting Social Media Scheduler..."

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    # Kill background processes
    jobs -p | xargs -r kill
    exit 0
}

# Set up trap to catch Ctrl+C and cleanup
trap cleanup SIGINT

# Start backend in background
echo "🐍 Starting backend..."
./run-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "⚛️ Starting frontend..."
./run-frontend.sh &
FRONTEND_PID=$!

echo "✅ Application is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for background processes
wait