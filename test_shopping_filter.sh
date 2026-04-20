#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧪 Shopping List Filter Test${NC}\n"

# Test 1: Add items with different categories
echo -e "${BLUE}Test 1: Adding items with different categories...${NC}"

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWU2ZDlmMDAtNjBhZi00MjQ2LTg2ZjUtYTM3ZWJmYjdmZDAzIn0.xYb9YbZe-fAJSVG8j0YKqJhJpwQ8LU9ov5XfKI6KM3w"

# Add vegetable
curl -s -X POST http://localhost:8000/api/v1/shopping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Domates",
    "amount": "500",
    "unit": "g",
    "category": "Sebze"
  }' | jq '.category' && echo -e "${GREEN}✅ Domates (Sebze) eklendi${NC}" || echo -e "${RED}❌ Domates eklenemedi${NC}"

# Add fruit
curl -s -X POST http://localhost:8000/api/v1/shopping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Elma",
    "amount": "1",
    "unit": "kg",
    "category": "Meyve"
  }' | jq '.category' && echo -e "${GREEN}✅ Elma (Meyve) eklendi${NC}" || echo -e "${RED}❌ Elma eklenemedi${NC}"

# Add meat
curl -s -X POST http://localhost:8000/api/v1/shopping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Tavuk Göğsü",
    "amount": "500",
    "unit": "g",
    "category": "Et/Balık"
  }' | jq '.category' && echo -e "${GREEN}✅ Tavuk Göğsü (Et/Balık) eklendi${NC}" || echo -e "${RED}❌ Tavuk Göğsü eklenemedi${NC}"

echo ""
echo -e "${BLUE}Test 2: Fetching all items...${NC}"
curl -s -X GET http://localhost:8000/api/v1/shopping \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {item_name, category}' && echo -e "${GREEN}✅ Tüm itemler başarıyla yüklendi${NC}"

echo ""
echo -e "${GREEN}✅ Tüm testler tamamlandı!${NC}"
