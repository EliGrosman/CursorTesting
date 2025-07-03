#!/bin/bash

echo "🐍 Starting Python backend..."

cd backend

# Activate virtual environment
source venv/bin/activate

# Run the FastAPI server
python app.py