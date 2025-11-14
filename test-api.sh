#!/bin/bash

API_URL="http://localhost:3000/api"

echo "=== WhatsApp Call API - Testes ==="
echo ""

# 1. Status
echo "1. Verificando status..."
curl -X GET "$API_URL/status" | jq
echo ""
sleep 2

# 2. QR Code
echo "2. Obtendo QR Code..."
curl -X GET "$API_URL/qr" | jq
echo ""
sleep 2

# 3. Fazer chamada de áudio
echo "3. Fazendo chamada de áudio..."
CALL_RESPONSE=$(curl -X POST "$API_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "isVideo": false
  }')
echo $CALL_RESPONSE | jq
CALL_ID=$(echo $CALL_RESPONSE | jq -r '.callId')
echo ""
sleep 2

# 4. Fazer chamada de vídeo
echo "4. Fazendo chamada de vídeo..."
curl -X POST "$API_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "isVideo": true
  }' | jq
echo ""
sleep 2

# 5. Encerrar chamada
if [ ! -z "$CALL_ID" ] && [ "$CALL_ID" != "null" ]; then
  echo "5. Encerrando chamada $CALL_ID..."
  curl -X POST "$API_URL/call/terminate" \
    -H "Content-Type: application/json" \
    -d "{\"callId\": \"$CALL_ID\"}" | jq
  echo ""
fi

# 6. Histórico
echo "6. Verificando histórico..."
curl -X GET "$API_URL/call/history" | jq
echo ""

echo "=== Testes concluídos ==="
