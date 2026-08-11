#!/bin/bash

# Pro Studio - Local PostgreSQL Setup Script
# This script helps you set up PostgreSQL locally on macOS

set -e

echo "🚀 Pro Studio - Local PostgreSQL Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Homebrew is installed
echo "📦 Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew is not installed.${NC}"
    echo ""
    echo "Please install Homebrew first by running:"
    echo -e "${BLUE}/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${NC}"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Homebrew found!${NC}"
echo ""

# Check if PostgreSQL is installed
echo "🐘 Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not installed.${NC}"
    echo ""
    read -p "Do you want to install PostgreSQL@16? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing PostgreSQL@16..."
        brew install postgresql@16
        echo -e "${GREEN}✅ PostgreSQL installed!${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is required. Exiting.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL found!${NC}"
fi
echo ""

# Check if PostgreSQL service is running
echo "🔍 Checking PostgreSQL service..."
if brew services list | grep postgresql | grep started > /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running!${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running.${NC}"
    echo "Starting PostgreSQL service..."
    brew services start postgresql@16
    echo "Waiting for PostgreSQL to start..."
    sleep 3
    echo -e "${GREEN}✅ PostgreSQL started!${NC}"
fi
echo ""

# Create database and user
echo "🗄️  Setting up database..."
if psql -lqt postgres 2>/dev/null | cut -d \| -f 1 | grep -qw prostudio; then
    echo -e "${YELLOW}⚠️  Database 'prostudio' already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U postgres -c "DROP DATABASE IF EXISTS prostudio;" 2>/dev/null || true
        psql -U postgres -c "DROP USER IF EXISTS prostudio;" 2>/dev/null || true
        echo "Running setup script..."
        psql -U postgres -f scripts/setup-postgres.sql
        echo -e "${GREEN}✅ Database recreated!${NC}"
    else
        echo -e "${BLUE}ℹ️  Using existing database.${NC}"
    fi
else
    echo "Running setup script..."
    psql -U postgres -f scripts/setup-postgres.sql 2>/dev/null || {
        echo -e "${RED}❌ Failed to create database with postgres user.${NC}"
        echo ""
        echo "Trying with current user..."
        psql -f scripts/setup-postgres.sql 2>/dev/null || {
            echo -e "${RED}❌ Failed to setup database.${NC}"
            echo ""
            echo "Please run manually:"
            echo -e "${BLUE}psql postgres < scripts/setup-postgres.sql${NC}"
            exit 1
        }
    }
    echo -e "${GREEN}✅ Database created!${NC}"
fi
echo ""

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npm run prisma:migrate
echo -e "${GREEN}✅ Migrations complete!${NC}"
echo ""

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed
echo -e "${GREEN}✅ Database seeded!${NC}"
echo ""

# Success message
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}✨ Setup Complete! ✨${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo ""
echo "Database Configuration:"
echo -e "  ${BLUE}Host:${NC}     localhost"
echo -e "  ${BLUE}Port:${NC}     5432"
echo -e "  ${BLUE}Database:${NC} prostudio"
echo -e "  ${BLUE}User:${NC}     prostudio"
echo -e "  ${BLUE}Password:${NC} prostudio"
echo ""
echo "Test Users:"
echo -e "  ${BLUE}Admin:${NC}    admin@prostudio.dev / password123"
echo -e "  ${BLUE}User:${NC}     user@prostudio.dev / password123"
echo ""
echo "Next Steps:"
echo -e "  1. ${BLUE}npm run dev${NC}         - Start development server"
echo -e "  2. Open ${BLUE}http://localhost:3000${NC}"
echo -e "  3. Login and enjoy! 🎉"
echo ""
