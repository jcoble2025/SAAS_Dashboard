#!/bin/bash

echo "🚀 Setting up SAAS Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL and create a database."
    echo "   You can install it via Homebrew: brew install postgresql"
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

cd ..

echo "🔧 Setting up environment files..."

# Copy environment files
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "📝 Created server/.env - Please update with your database and Stripe credentials"
fi

if [ ! -f client/.env ]; then
    cp client/.env.example client/.env
    echo "📝 Created client/.env - Please update with your API URL and Stripe publishable key"
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your database URL and Stripe credentials"
echo "2. Update client/.env with your API URL and Stripe publishable key"
echo "3. Set up your PostgreSQL database"
echo "4. Run database migrations: npm run db:migrate"
echo "5. Start the development servers: npm run dev"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev          - Start both client and server in development mode"
echo "   npm run db:migrate   - Run database migrations"
echo "   npm run db:studio    - Open Prisma Studio"
echo "   npm run build        - Build for production"
