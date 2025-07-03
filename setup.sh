#!/bin/bash

echo "🚀 Setting up Social Media Scheduler..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Set up backend
echo "📦 Setting up Python backend..."
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Backend setup complete!"

cd ..

# Set up frontend
echo "📦 Setting up React frontend..."
cd frontend

# Install Node.js dependencies
npm install

echo "✅ Frontend setup complete!"

cd ..

echo "🎉 Setup complete! You can now run the application."
echo ""
echo "To start the application:"
echo "1. Start the backend: ./run-backend.sh"
echo "2. Start the frontend: ./run-frontend.sh"
echo ""
echo "Or use: ./run-app.sh to start both simultaneously"