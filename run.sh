#!/bin/bash

# Golf Competition App - Quick Setup Script
# Uses Gradle to install, lint, build, and serve the Vue frontend

echo "===== Golf Competition App ====="
echo

# Navigate to project root
cd "$(dirname "$0")"

# Use Gradle if wrapper exists
if [ -f "./gradlew" ]; then
    echo "Using Gradle..."
    ./gradlew frontendInstall
    ./gradlew frontendLint --no-daemon || true
    ./gradlew frontendBuild
    echo
    echo "Starting dev server at http://localhost:8080"
    echo "Press Ctrl+C to stop"
    ./gradlew frontendDev
else
    # Fallback: run npm directly in vue-golfcomp
    cd vue-golfcomp
    echo "Working directory: $(pwd)"
    npm install
    npm run lint -- --no-fix || true
    npm run build
    echo "Starting at http://localhost:8080"
    npm run serve
fi

