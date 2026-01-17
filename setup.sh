#!/bin/bash

# SweetBite Setup Script
echo "🍰 Setting up SweetBite..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

# Check if MongoDB is running (optional check)
echo "📦 Installing dependencies..."

# Install backend dependencies
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in backend directory"
    exit 1
fi

npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration details"
fi

# Create service account file if it doesn't exist
if [ ! -f "services/service-account.json" ]; then
    echo "📝 Creating service account template..."
    cp services/service-account.json.example services/service-account.json
    echo "⚠️  Please edit services/service-account.json with your Google service account details"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MongoDB URI and other configuration"
echo "2. (Optional) Edit backend/services/service-account.json for Google Drive integration"
echo "3. Start the development server: cd backend && npm run dev"
echo "4. Open http://localhost:5001 in your browser"
echo ""
echo "🍰 Happy coding with SweetBite!"