#!/bin/bash

echo "================================================"
echo "Real-Time Stock Market System - Setup Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Found $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Not found"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} Found v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} Not found"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed - run 'npm install'"
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} Missing - copy from .env.example"
    exit 1
fi

# Check Supabase configuration
echo -n "Checking Supabase URL... "
if grep -q "SUPABASE_URL=https://" .env; then
    echo -e "${GREEN}✓${NC} Configured"
else
    echo -e "${RED}✗${NC} Not configured"
fi

echo -n "Checking Supabase keys... "
if grep -q "SUPABASE_ANON_KEY=" .env && grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env; then
    echo -e "${GREEN}✓${NC} Configured"
else
    echo -e "${RED}✗${NC} Not configured"
fi

# Check directory structure
echo -n "Checking backend structure... "
if [ -d "backend/src" ]; then
    echo -e "${GREEN}✓${NC} Present"
else
    echo -e "${RED}✗${NC} Missing"
fi

echo -n "Checking frontend structure... "
if [ -d "frontend" ]; then
    echo -e "${GREEN}✓${NC} Present"
else
    echo -e "${RED}✗${NC} Missing"
fi

# Check key files
echo -n "Checking server.js... "
if [ -f "backend/src/server.js" ]; then
    echo -e "${GREEN}✓${NC} Present"
else
    echo -e "${RED}✗${NC} Missing"
fi

echo -n "Checking index.html... "
if [ -f "frontend/index.html" ]; then
    echo -e "${GREEN}✓${NC} Present"
else
    echo -e "${RED}✗${NC} Missing"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✓ Setup verification complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Run 'npm install' if dependencies not installed"
echo "  2. Run 'npm start' to start the server"
echo "  3. Open http://localhost:5000 in your browser"
echo "  4. Test with: curl http://localhost:5000/api/health"
echo ""
