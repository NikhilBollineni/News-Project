#!/bin/bash

echo "🚀 Setting up MongoDB for Automotive News App"
echo "=============================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew is already installed"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "🐳 Docker is available - you can use either MongoDB or Docker"
    echo ""
    echo "Option 1: Install MongoDB locally:"
    echo "  brew install mongodb-community"
    echo "  brew services start mongodb-community"
    echo ""
    echo "Option 2: Use Docker (recommended for development):"
    echo "  docker run -d -p 27017:27017 --name automotive-news-mongo mongo:latest"
    echo ""
    read -p "Choose option (1 for local MongoDB, 2 for Docker, or press Enter to skip): " choice
    
    case $choice in
        1)
            echo "📦 Installing MongoDB..."
            brew install mongodb-community
            echo "🚀 Starting MongoDB service..."
            brew services start mongodb-community
            echo "✅ MongoDB is now running on localhost:27017"
            ;;
        2)
            echo "🐳 Starting MongoDB with Docker..."
            docker run -d -p 27017:27017 --name automotive-news-mongo mongo:latest
            echo "✅ MongoDB is now running in Docker on localhost:27017"
            ;;
        *)
            echo "⏭️ Skipping MongoDB setup. You can set it up later."
            ;;
    esac
else
    echo "📦 Installing MongoDB..."
    brew install mongodb-community
    echo "🚀 Starting MongoDB service..."
    brew services start mongodb-community
    echo "✅ MongoDB is now running on localhost:27017"
fi

echo ""
echo "🎉 Setup complete! You can now:"
echo "1. Run: npm install"
echo "2. Run: node server/scripts/seedGoogleNewsFeed.js"
echo "3. Run: node start-production.js"
echo ""
echo "📋 MongoDB connection string: mongodb://localhost:27017/automotive-news"
