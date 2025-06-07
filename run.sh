#!/bin/bash

# Golf Competition App Test Script

echo "===== Golf Competition App Test Script ====="
echo "This script will test the functionality of the Golf Competition App"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to continue."
    exit 1
fi

# Navigate to the project directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"
echo

# Install dependencies
echo "Installing dependencies..."
npm install
echo

# Run linting
echo "Running linting..."
npm run lint -- --no-fix || true
echo

# Build the application
echo "Building the application..."
npm run build
echo

# Serve the application
echo "Starting the application..."
echo "The application will be available at http://localhost:8080"
echo "Press Ctrl+C to stop the server"
echo
npm run serve

