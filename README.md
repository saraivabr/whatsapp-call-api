# WhatsApp Call API

API REST para realizar ligações via WhatsApp usando Baileys.

## Instalação

```bash
npm install
```

## Configuração

```bash
cp .env.example .env
```

## Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Endpoints

### GET /api/status
Verifica status da conexão

### GET /api/qr
Obtém QR Code para autenticação

### POST /api/call
Faz uma ligação

```json
{
  "phoneNumber": "5511999999999",
  "isVideo": false
}
```

### POST /api/call/reject
Rejeita uma chamada

```json
{
  "callId": "call_123",
  "callFrom": "5511999999999@s.whatsapp.net"
}
```

### POST /api/call/terminate
Encerra uma chamada

```json
{
  "callId": "call_123"
}
```

### GET /api/call/history
Obtém histórico de chamadas

## Exemplos

Ver pasta `examples/` para exemplos de uso.
