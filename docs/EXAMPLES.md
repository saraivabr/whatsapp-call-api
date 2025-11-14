# 💡 Exemplos de Uso - WhatsApp Call API

Este documento contém exemplos práticos de como usar a WhatsApp Call API em diferentes cenários.

---

## 📋 Índice

- [Exemplo 1: Fazer uma Chamada de Voz](#exemplo-1-fazer-uma-chamada-de-voz)
- [Exemplo 2: Fazer uma Videochamada](#exemplo-2-fazer-uma-videochamada)
- [Exemplo 3: Verificar Status Antes de Ligar](#exemplo-3-verificar-status-antes-de-ligar)
- [Exemplo 4: Obter QR Code para Autenticação](#exemplo-4-obter-qr-code-para-autenticação)
- [Exemplo 5: Script de Teste Bash](#exemplo-5-script-de-teste-bash)
- [Exemplos Avançados](#mais-exemplos)

---

## Exemplo 1: Fazer uma Chamada de Voz

**Node.js com Axios**

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function makeVoiceCall() {
  try {
    const response = await axios.post(`${API_URL}/call`, {
      phoneNumber: '5511999999999',
      isVideo: false
    });

    console.log('Chamada iniciada:', response.data);
    // {
    //   success: true,
    //   callId: 'call_1731582600000_abc123',
    //   to: '5511999999999@s.whatsapp.net',
    //   type: 'audio',
    //   timestamp: '2025-11-14T10:30:00.000Z'
    // }
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

makeVoiceCall();
```

---

## Exemplo 2: Fazer uma Videochamada

```javascript
async function makeVideoCall() {
  try {
    const response = await axios.post(`${API_URL}/call`, {
      phoneNumber: '5511999999999',
      isVideo: true  // ← Videochamada
    });

    console.log('Videochamada iniciada:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}
```

---

## Exemplo 3: Verificar Status Antes de Ligar

```javascript
async function callWithStatusCheck(phoneNumber) {
  try {
    // 1. Verificar se está conectado
    const statusResponse = await axios.get(`${API_URL}/status`);

    if (!statusResponse.data.connected) {
      throw new Error('WhatsApp não está conectado');
    }

    console.log('Status:', statusResponse.data.state);

    // 2. Fazer a chamada
    const callResponse = await axios.post(`${API_URL}/call`, {
      phoneNumber,
      isVideo: false
    });

    console.log('Chamada iniciada:', callResponse.data.callId);

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

callWithStatusCheck('5511999999999');
```

---

## Exemplo 4: Obter QR Code para Autenticação

```javascript
async function getQRCode() {
  try {
    const response = await axios.get(`${API_URL}/qr`);

    // QR Code como string
    console.log('QR Code:', response.data.qrCode);

    // QR Code como imagem base64 (use em <img src="...">)
    console.log('QR Image:', response.data.qrImage);

    // Exemplo de uso em HTML
    const html = `<img src="${response.data.qrImage}" alt="QR Code WhatsApp">`;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('WhatsApp já está conectado!');
    } else {
      console.error('Erro:', error.response?.data || error.message);
    }
  }
}
```

---

## Exemplo 5: Script de Teste Bash

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"

# Verificar status
echo "🔍 Verificando status..."
curl -s "$API_URL/status" | jq

# Fazer chamada
echo -e "\n📞 Fazendo chamada..."
curl -s -X POST "$API_URL/call" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "isVideo": false
  }' | jq
```

---

## Mais Exemplos

Veja a pasta `examples/` no repositório para exemplos mais avançados:

- **`examples/call-examples.js`** - Exemplos básicos de uso da API
- **`examples/advanced-call.js`** - Cenários avançados e casos de uso complexos
- **`examples/webhook-handler.js`** - Integração com webhooks para eventos de chamada

---

## 🔗 Links Úteis

- [Voltar para o README](../README.md)
- [Ver Solução de Problemas](./TROUBLESHOOTING.md)
- [Documentação da API](../README.md#-documentação-da-api)

---

**Dica**: Execute os exemplos em ordem para entender melhor o fluxo da API!
