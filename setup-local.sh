#!/bin/bash
set -e

echo "=== 100Pro Local Setup ==="

# Detect OS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "This script is for macOS. For Linux, adjust as needed."
  exit 1
fi

# Check if postgres CLI is available
if ! command -v psql &> /dev/null; then
  echo "PostgreSQL not found. Installing via Homebrew..."
  if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Install it first: https://brew.sh"
    exit 1
  fi
  brew install postgresql@16
  brew services start postgresql@16
  export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
  echo "Waiting for PostgreSQL to start..."
  sleep 3
fi

# Start PostgreSQL service if not running
if ! pg_isready -q 2>/dev/null; then
  echo "Starting PostgreSQL..."
  brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 3
fi

CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"

# Create 'postgres' superuser role if it doesn't exist
echo "Creating postgres role (if missing)..."
psql -U "$CURRENT_USER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='postgres'" | grep -q 1 || \
  psql -U "$CURRENT_USER" -d postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';"

# Set password for postgres role (in case it exists without a password)
psql -U "$CURRENT_USER" -d postgres -c "ALTER ROLE postgres WITH LOGIN PASSWORD 'postgres';" 2>/dev/null || true

# Create the database if it doesn't exist
echo "Creating hundredpro database (if missing)..."
psql -U "$CURRENT_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='hundredpro'" | grep -q 1 || \
  psql -U "$CURRENT_USER" -d postgres -c "CREATE DATABASE hundredpro OWNER postgres;"

echo ""
echo "=== PostgreSQL setup complete! ==="
echo ""
echo "Now create backend/.env if it doesn't exist:"
echo ""

# Create backend/.env if it doesn't exist
if [ ! -f "backend/.env" ]; then
  cat > backend/.env << 'EOF'
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASS=postgres
DATABASE_NAME=hundredpro
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
PORT=3000
EOF
  echo "Created backend/.env"
else
  echo "backend/.env already exists, skipping."
fi

echo ""
echo "=== Done! Now run the backend: ==="
echo "  cd backend && npm run start:dev"
echo ""
echo "And in another terminal, the frontend:"
echo "  cd frontend && npm start"
