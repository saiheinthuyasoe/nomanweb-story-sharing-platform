#!/bin/bash

# NoManWeb - Typesense Search Setup Script
# This script sets up Typesense search engine for the NoManWeb platform

set -e

echo "🚀 Setting up Typesense Search Engine for NoManWeb..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p typesense_data
mkdir -p postgres_data

# Start Typesense and PostgreSQL
echo "🐳 Starting Typesense and PostgreSQL containers..."
docker-compose up -d typesense postgres

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if Typesense is running
echo "🔍 Checking Typesense health..."
if curl -s "http://localhost:8108/health" > /dev/null; then
    echo "✅ Typesense is running successfully!"
else
    echo "❌ Typesense failed to start. Check Docker logs: docker-compose logs typesense"
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL health..."
if docker-compose exec postgres pg_isready -U nomanweb_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running successfully!"
else
    echo "❌ PostgreSQL failed to start. Check Docker logs: docker-compose logs postgres"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📊 Service Status:"
echo "  - Typesense:  http://localhost:8108"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "🔑 Typesense API Key: nomanweb-search-api-key-2024"
echo ""
echo "📚 Next Steps:"
echo "  1. Start your NoManWeb backend: cd nomanweb_backend && mvn spring-boot:run"
echo "  2. Start your NoManWeb frontend: cd nomanweb_frontend && npm run dev"
echo "  3. Create some stories to test the search functionality"
echo "  4. Access admin dashboard at: http://localhost:3000/admin/dashboard"
echo ""
echo "🛑 To stop services: docker-compose down"
echo "🗑️  To reset data: docker-compose down -v"
echo ""
echo "Happy storytelling! 📖✨" 