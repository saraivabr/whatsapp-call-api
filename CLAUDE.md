# CLAUDE.md - WhatsApp Call API

## Visão Geral do Projeto

**WhatsApp Call API** é uma API REST desenvolvida com Node.js e Express que permite realizar ligações de voz e vídeo via WhatsApp de forma programática usando a biblioteca Baileys. Este serviço fornece endpoints para gerenciar conexões com o WhatsApp, iniciar ligações e manipular eventos de chamadas.

### Propósito
Este projeto foi criado para permitir integração automatizada com o sistema de chamadas do WhatsApp, possibilitando que aplicações façam e gerenciem ligações sem interação manual.

### Principais Tecnologias

- **Runtime**: Node.js 20+ (ambiente de execução JavaScript)
- **Framework Web**: Express.js 4.18+ (servidor HTTP e rotas)
- **Biblioteca WhatsApp**: @whiskeysockets/baileys 6.7+ (comunicação com WhatsApp Web)
- **Sistema de Módulos**: ES Modules (`"type": "module"` no package.json)
- **Logging**: Pino (sistema de logs rápido em JSON)
- **Geração de QR Code**: qrcode (para navegador) e qrcode-terminal (para terminal)
- **Containerização**: Docker com suporte docker-compose

---

## Estrutura de Diretórios

```
whatsapp-call-api/
├── src/                          # Código fonte da aplicação
│   ├── config/
│   │   └── baileys.js            # Gerenciamento da conexão e socket do WhatsApp
│   ├── routes/
│   │   └── callRoutes.js         # Definição dos endpoints da API
│   ├── services/
│   │   └── callService.js        # Lógica de negócio para chamadas
│   └── index.js                  # Ponto de entrada do servidor Express
│
├── examples/                     # Exemplos de uso da API
│   ├── call-examples.js          # Exemplos usando axios
│   ├── advanced-call.js          # Cenários avançados de chamadas
│   └── webhook-handler.js        # Exemplo de integração com webhooks
│
├── auth_info_baileys/            # Armazenamento de sessão do WhatsApp (gitignored)
│
├── .env.example                  # Template de variáveis de ambiente
├── .gitignore                    # Padrões de arquivos ignorados pelo Git
├── Dockerfile                    # Definição da imagem Docker
├── docker-compose.yml            # Orquestração de containers
├── package.json                  # Dependências e scripts npm
├── README.md                     # Documentação para usuários
└── test-api.sh                   # Script de teste da API
```

### Descrição Detalhada dos Diretórios

**`src/config/`**: Contém configurações centralizadas da aplicação, especialmente a configuração do Baileys e gerenciamento do socket do WhatsApp.

**`src/routes/`**: Define todos os endpoints HTTP da API REST, incluindo validação de requisições e tratamento de respostas.

**`src/services/`**: Camada de lógica de negócio que abstrai as operações complexas e interage diretamente com o socket do WhatsApp.

**`examples/`**: Código de exemplo para ajudar desenvolvedores a entenderem como consumir a API.

**`auth_info_baileys/`**: Diretório criado automaticamente pelo Baileys para armazenar credenciais de autenticação. **NUNCA** commite este diretório no Git.

---

## Visão Geral da Arquitetura

### Componentes Principais

#### 1. **Camada de Servidor** (`src/index.js`)
Responsabilidades:
- Inicialização da aplicação Express
- Registro de rotas
- Configuração de middlewares (como `express.json()`)
- Inicialização da conexão com WhatsApp ao startar o servidor
- Execução na porta 3000 (configurável via variável de ambiente `PORT`)

**Características importantes**:
- O servidor inicia e tenta conectar ao WhatsApp automaticamente
- Rota raiz (`/`) retorna informações sobre a API e seus endpoints
- Usa async/await para garantir que a conexão seja estabelecida

#### 2. **Camada de Configuração** (`src/config/baileys.js`)
Responsabilidades:
- Gerenciamento da instância única do socket do WhatsApp
- Geração e armazenamento do QR Code para autenticação
- Rastreamento do estado da conexão
- Lógica de reconexão automática
- Persistência do estado de autenticação
- Listeners de eventos (conexão, credenciais, chamadas)

**Estados de Conexão**:
- `disconnected`: Sem conexão estabelecida
- `qr`: QR Code gerado e aguardando scan
- `connected`: Autenticado e conectado ao WhatsApp
- `reconnecting`: Tentando reconectar após desconexão

**Funções Exportadas**:
- `connectToWhatsApp()`: Estabelece conexão com WhatsApp
- `getSocket()`: Retorna a instância do socket atual
- `getQRCode()`: Retorna o QR Code se disponível
- `getConnectionState()`: Retorna o estado atual da conexão

#### 3. **Camada de Rotas** (`src/routes/callRoutes.js`)
Responsabilidades:
- Definição de endpoints RESTful
- Validação de parâmetros de requisição
- Tratamento de erros HTTP
- Formatação de respostas JSON padronizadas
- Transformação de QR Code em diferentes formatos

**Padrão de Validação**:
```javascript
if (!requiredParameter) {
  return res.status(400).json({
    error: 'Descrição do erro',
    example: { /* exemplo de uso correto */ }
  });
}
```

#### 4. **Camada de Serviço** (`src/services/callService.js`)
Responsabilidades:
- Implementação da lógica de negócio para operações de chamada
- Geração de IDs únicos para chamadas
- Formatação de números de telefone para formato JID
- Interação direta com o socket do WhatsApp
- Validação de disponibilidade do socket

**Funções Principais**:
- `makeCall(phoneNumber, isVideo)`: Inicia uma ligação
- `rejectCall(callId, callFrom)`: Rejeita uma chamada recebida
- `terminateCall(callId)`: Encerra uma chamada ativa
- `getCallHistory()`: Retorna histórico (não implementado)
- `generateCallId()`: Gera ID único para chamadas

### Fluxo de Dados

```
Requisição do Cliente
        ↓
Express Router (validação)
        ↓
Service Layer (lógica de negócio)
        ↓
Baileys Socket (comunicação WhatsApp)
        ↓
WhatsApp Servers
        ↓
Resposta do WhatsApp
        ↓
Process Result (serviço)
        ↓
Format Response (rota)
        ↓
Resposta ao Cliente
```

### Ciclo de Vida de Uma Chamada

1. **Inicialização**: Cliente envia POST para `/api/call`
2. **Validação**: Rota valida presença de `phoneNumber`
3. **Processamento**: Serviço formata número e gera callId
4. **Execução**: Socket Baileys envia comando `offerCall` para WhatsApp
5. **Resposta**: Retorna informações da chamada ao cliente
6. **Gerenciamento**: Cliente pode usar callId para rejeitar ou encerrar

---

## Endpoints da API

### Gerenciamento de Conexão

#### `GET /api/status`
Verifica o status atual da conexão com o WhatsApp.

**Uso**: Verificar se a API está conectada antes de fazer chamadas.

**Resposta de Sucesso** (200 OK):
```json
{
  "connected": true,
  "state": "connected",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Possíveis Estados**:
- `connected: true, state: "connected"` - Pronto para usar
- `connected: false, state: "qr"` - Aguardando autenticação
- `connected: false, state: "disconnected"` - Sem conexão
- `connected: false, state: "reconnecting"` - Reconectando

**Exemplo de Uso**:
```bash
curl http://localhost:3000/api/status
```

#### `GET /api/qr`
Obtém o QR Code para autenticação no WhatsApp.

**Quando usar**: Apenas na primeira execução ou quando as credenciais expirarem.

**Resposta de Sucesso** (200 OK):
```json
{
  "qrCode": "2@xLKFj3m2...",
  "qrImage": "data:image/png;base64,iVBORw0KGgo...",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Resposta de Erro** (404 Not Found):
```json
{
  "error": "QR Code não disponível",
  "message": "WhatsApp já está conectado ou aguardando conexão"
}
```

**Como usar**:
1. Faça GET em `/api/qr`
2. Use `qrImage` para exibir em navegador (já em Base64)
3. Use `qrCode` para outros processamentos
4. Escaneie com WhatsApp no celular
5. Conexão será estabelecida automaticamente

**Exemplo de Uso**:
```bash
curl http://localhost:3000/api/qr
```

### Operações de Chamada

#### `POST /api/call`
Inicia uma chamada de voz ou vídeo.

**Quando usar**: Para fazer ligações programáticas via WhatsApp.

**Body da Requisição**:
```json
{
  "phoneNumber": "5511999999999",
  "isVideo": false
}
```

**Parâmetros**:
- `phoneNumber` (string, obrigatório): Número com código do país (ex: 5511999999999)
- `isVideo` (boolean, opcional): `true` para vídeo, `false` ou omitido para áudio

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "callId": "call_1731582600000_abc123def",
  "to": "5511999999999@s.whatsapp.net",
  "type": "audio",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Resposta de Erro** (400 Bad Request):
```json
{
  "error": "Número de telefone é obrigatório",
  "example": {
    "phoneNumber": "5511999999999",
    "isVideo": false
  }
}
```

**Resposta de Erro** (500 Internal Server Error):
```json
{
  "error": "Erro ao fazer chamada",
  "message": "WhatsApp não está conectado"
}
```

**Exemplo de Uso**:
```bash
# Chamada de áudio
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999", "isVideo": false}'

# Chamada de vídeo
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999", "isVideo": true}'
```

#### `POST /api/call/reject`
Rejeita uma chamada recebida.

**Quando usar**: Quando receber evento de chamada e quiser rejeitar automaticamente.

**Body da Requisição**:
```json
{
  "callId": "call_123",
  "callFrom": "5511999999999@s.whatsapp.net"
}
```

**Parâmetros**:
- `callId` (string, obrigatório): ID da chamada recebida
- `callFrom` (string, obrigatório): JID do usuário que está ligando

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "callId": "call_123",
  "action": "rejected",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Exemplo de Uso**:
```bash
curl -X POST http://localhost:3000/api/call/reject \
  -H "Content-Type: application/json" \
  -d '{"callId": "call_123", "callFrom": "5511999999999@s.whatsapp.net"}'
```

#### `POST /api/call/terminate`
Encerra uma chamada ativa.

**Quando usar**: Para desligar programaticamente uma chamada em andamento.

**Body da Requisição**:
```json
{
  "callId": "call_123"
}
```

**Parâmetros**:
- `callId` (string, obrigatório): ID da chamada que deseja encerrar

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "callId": "call_123",
  "action": "terminated",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Exemplo de Uso**:
```bash
curl -X POST http://localhost:3000/api/call/terminate \
  -H "Content-Type: application/json" \
  -d '{"callId": "call_123"}'
```

#### `GET /api/call/history`
Obtém o histórico de chamadas.

**Status**: Atualmente retorna array vazio. Implementação de storage necessária.

**Resposta Atual** (200 OK):
```json
{
  "success": true,
  "message": "Histórico de chamadas não implementado",
  "calls": []
}
```

**Exemplo de Uso**:
```bash
curl http://localhost:3000/api/call/history
```

---

## Convenções de Código

### Sistema de Módulos ES6

Este projeto utiliza **exclusivamente** ES6 Modules. Nunca use CommonJS.

#### ✅ CORRETO - ES6 Modules
```javascript
// Importação
import express from 'express';
import { getSocket } from './config/baileys.js';

// Exportação nomeada
export function makeCall(phoneNumber) { }
export async function rejectCall(callId) { }

// Exportação default
export default router;
```

#### ❌ INCORRETO - CommonJS (NÃO USE)
```javascript
// NÃO FAÇA ISSO
const express = require('express');
const { getSocket } = require('./config/baileys');

module.exports = { makeCall, rejectCall };
module.exports = router;
```

#### Regras Importantes
1. **SEMPRE** inclua a extensão `.js` nos imports
2. Package.json deve conter `"type": "module"`
3. Use `import/export` em vez de `require/module.exports`

#### Exemplos de Import com Extensão
```javascript
// ✅ CORRETO - com .js
import { getSocket } from './config/baileys.js';
import { makeCall } from '../services/callService.js';

// ❌ ERRADO - sem .js (causará erro)
import { getSocket } from './config/baileys';
import { makeCall } from '../services/callService';
```

### Padrão Async/Await

Use **sempre** async/await para código assíncrono. Evite Promises com `.then()/.catch()`.

#### ✅ CORRETO - Async/Await
```javascript
export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();

  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  try {
    const jid = formatPhoneNumber(phoneNumber);
    const callId = generateCallId();

    // Aguarda a operação assíncrona
    await sock.offerCall(jid, callId, isVideo);

    return {
      success: true,
      callId,
      to: jid,
      type: isVideo ? 'video' : 'audio'
    };
  } catch (error) {
    console.error('Erro ao fazer chamada:', error);
    throw error;
  }
}
```

#### ❌ INCORRETO - Promises com .then()
```javascript
// NÃO FAÇA ISSO
export function makeCall(phoneNumber, isVideo = false) {
  return getSocket().offerCall(jid, callId, isVideo)
    .then(result => {
      return { success: true, result };
    })
    .catch(error => {
      console.error(error);
      return { success: false, error };
    });
}
```

#### Por que Async/Await?
- **Mais legível**: Código parece síncrono
- **Melhor tratamento de erros**: try/catch funciona naturalmente
- **Debugging facilitado**: Stack traces mais claras
- **Padrão moderno**: Melhor suporte e performance

### Tratamento de Erros

O projeto segue um padrão específico de tratamento de erros em duas camadas.

#### Camada de Serviço - Lançar Erros

Serviços devem validar condições e **lançar erros** quando algo está incorreto.

```javascript
// src/services/callService.js
export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();

  // Validação - lança erro se falhar
  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  if (!phoneNumber) {
    throw new Error('Número de telefone é obrigatório');
  }

  try {
    // Lógica principal
    const jid = formatPhoneNumber(phoneNumber);
    const callId = generateCallId();
    await sock.offerCall(jid, callId, isVideo);

    return { success: true, callId, to: jid };
  } catch (error) {
    // Log do erro
    console.error('Erro ao fazer chamada:', error);
    // Re-lança para a rota tratar
    throw error;
  }
}
```

#### Camada de Rota - Capturar e Formatar Erros

Rotas devem **capturar erros** e formatar respostas HTTP adequadas.

```javascript
// src/routes/callRoutes.js
router.post('/call', async (req, res) => {
  const { phoneNumber, isVideo } = req.body;

  // Validação na rota
  if (!phoneNumber) {
    return res.status(400).json({
      error: 'Número de telefone é obrigatório',
      example: {
        phoneNumber: '5511999999999',
        isVideo: false
      }
    });
  }

  try {
    // Chama o serviço
    const result = await makeCall(phoneNumber, isVideo);
    res.json(result);
  } catch (error) {
    // Captura erro do serviço e formata resposta
    res.status(500).json({
      error: 'Erro ao fazer chamada',
      message: error.message
    });
  }
});
```

#### Padrão de Resposta de Erro

Todos os erros devem seguir este formato:

```javascript
{
  "error": "Tipo/Categoria do erro",
  "message": "Mensagem detalhada em português"
}
```

Opcionalmente, pode incluir:
```javascript
{
  "error": "Tipo do erro",
  "message": "Mensagem detalhada",
  "example": { /* exemplo de uso correto */ },
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

### Formatação de Números de Telefone

O WhatsApp usa um formato específico chamado **JID** (Jabber ID).

#### Formato JID
```
{número}@s.whatsapp.net
```

Exemplo: `5511999999999@s.whatsapp.net`

#### Implementação Correta

```javascript
// Função para formatar número
function formatPhoneNumber(phoneNumber) {
  // Verifica se já está formatado
  if (phoneNumber.includes('@')) {
    return phoneNumber;
  }

  // Formata para JID
  return `${phoneNumber}@s.whatsapp.net`;
}

// Uso em makeCall
export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();
  const jid = formatPhoneNumber(phoneNumber); // Sempre formatar!

  await sock.offerCall(jid, callId, isVideo);
}
```

#### ✅ CORRETO
```javascript
// Aceita ambos os formatos
const jid = phoneNumber.includes('@')
  ? phoneNumber
  : `${phoneNumber}@s.whatsapp.net`;

await sock.offerCall(jid, callId, isVideo);
```

#### ❌ INCORRETO
```javascript
// NÃO envie número sem formatar
await sock.offerCall(phoneNumber, callId, isVideo); // ERRO!

// NÃO assuma que sempre tem @
const jid = `${phoneNumber}@s.whatsapp.net`; // Pode duplicar @
```

#### Formato de Número Brasileiro
```
[Código País][DDD][Número]
```

Exemplos:
- `5511999999999` - São Paulo (11) celular
- `5521988888888` - Rio de Janeiro (21) celular
- `5511333334444` - São Paulo (11) fixo

### Estrutura de Respostas

Todas as respostas da API devem seguir padrões consistentes.

#### Resposta de Sucesso
```javascript
{
  "success": true,
  "timestamp": "2025-11-14T10:30:00.000Z",
  // ... dados específicos da operação
}
```

#### Resposta de Erro
```javascript
{
  "error": "Categoria do erro",
  "message": "Descrição detalhada",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

#### Campos Obrigatórios
- **success**: boolean (em operações bem-sucedidas)
- **timestamp**: string ISO 8601
- **error**: string (em falhas)
- **message**: string (explicação legível)

#### Exemplo Completo
```javascript
// Sucesso ao fazer chamada
router.post('/call', async (req, res) => {
  try {
    const result = await makeCall(phoneNumber, isVideo);
    res.json({
      success: true,
      callId: result.callId,
      to: result.to,
      type: result.type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao fazer chamada',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## Fluxos de Desenvolvimento

### Configuração Inicial

#### 1. Clonar e Instalar Dependências
```bash
# Clonar repositório (se aplicável)
git clone <repository-url>
cd whatsapp-call-api

# Instalar dependências
npm install
```

#### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com seus valores
nano .env
# ou
vim .env
```

**Conteúdo do .env**:
```env
PORT=3000
SESSION_NAME=whatsapp-call-session
```

#### 3. Iniciar Servidor de Desenvolvimento
```bash
# Com auto-reload (recomendado para desenvolvimento)
npm run dev

# Ou modo produção
npm start
```

**O que acontece ao iniciar**:
1. Servidor Express sobe na porta 3000
2. Tenta conectar ao WhatsApp automaticamente
3. Se primeira vez: gera QR Code (visível no terminal)
4. Se já autenticado: conecta usando credenciais salvas

#### 4. Verificar se está Funcionando
```bash
# Em outro terminal, teste o endpoint de status
curl http://localhost:3000/api/status

# Deve retornar algo como:
# {"connected":false,"state":"qr","timestamp":"..."}
```

### Fluxo de Autenticação do WhatsApp

Este é o processo para conectar a API ao WhatsApp pela primeira vez.

#### Primeira Execução (Sem Credenciais)

**Passo 1**: Iniciar o servidor
```bash
npm run dev
```

**Passo 2**: O servidor irá:
- Criar diretório `auth_info_baileys/`
- Gerar um QR Code
- Exibir QR Code no terminal

**Passo 3**: Obter QR Code via API (opcional)
```bash
curl http://localhost:3000/api/qr
```

Resposta:
```json
{
  "qrCode": "2@xLKFj...",
  "qrImage": "data:image/png;base64,...",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Passo 4**: Escanear QR Code
1. Abra WhatsApp no celular
2. Vá em **Configurações** → **Aparelhos Conectados**
3. Toque em **Conectar um Aparelho**
4. Escaneie o QR Code exibido no terminal ou use o `qrImage`

**Passo 5**: Autenticação Completa
- WhatsApp conectará automaticamente
- Credenciais serão salvas em `auth_info_baileys/`
- Estado mudará para `connected`
- Próximas execuções não precisarão de QR Code

#### Execuções Subsequentes (Com Credenciais)

```bash
npm run dev
```

O servidor irá:
1. Ler credenciais de `auth_info_baileys/`
2. Conectar automaticamente
3. **NÃO** gerar QR Code
4. Estado será `connected` em segundos

#### Renovar Autenticação

Se precisar re-autenticar (QR Code expirado, logout, etc.):

```bash
# Parar o servidor (Ctrl+C)

# Remover credenciais antigas
rm -rf auth_info_baileys/

# Iniciar servidor novamente
npm run dev

# Novo QR Code será gerado
```

#### Diagrama do Fluxo
```
Servidor Iniciado
     ↓
Verificar auth_info_baileys/
     ↓
├─→ Existe? → Usar credenciais → Conectar → ✅ connected
│
└─→ Não existe? → Gerar QR Code → Aguardar scan → Salvar credenciais → ✅ connected
```

### Deployment com Docker

#### Usando Docker Compose (Recomendado)

**Passo 1**: Construir e iniciar container
```bash
docker-compose up -d
```

**Passo 2**: Verificar logs
```bash
docker-compose logs -f
```

**Passo 3**: Parar container
```bash
docker-compose down
```

#### Usando Docker Diretamente

```bash
# Build da imagem
docker build -t whatsapp-call-api .

# Executar container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/auth_info_baileys:/app/auth_info_baileys \
  -e PORT=3000 \
  -e SESSION_NAME=whatsapp-call-session \
  --name whatsapp-api \
  whatsapp-call-api

# Ver logs
docker logs -f whatsapp-api

# Parar container
docker stop whatsapp-api

# Remover container
docker rm whatsapp-api
```

#### ⚠️ Importante - Volume de Autenticação

O diretório `auth_info_baileys/` **DEVE** ser montado como volume:

```yaml
# docker-compose.yml
volumes:
  - ./auth_info_baileys:/app/auth_info_baileys
```

**Por quê?**
- Preserva credenciais entre restarts do container
- Evita necessidade de re-escanear QR Code toda vez
- Mantém sessão persistente

**Sem o volume**:
- Toda vez que reiniciar, precisará escanear QR Code novamente
- Credenciais serão perdidas ao parar o container

### Testando a API

#### Usando cURL

**Verificar Status**:
```bash
curl http://localhost:3000/api/status
```

**Obter QR Code**:
```bash
curl http://localhost:3000/api/qr
```

**Fazer Chamada de Áudio**:
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "isVideo": false
  }'
```

**Fazer Chamada de Vídeo**:
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "isVideo": true
  }'
```

**Encerrar Chamada**:
```bash
curl -X POST http://localhost:3000/api/call/terminate \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "call_1731582600000_abc123def"
  }'
```

#### Usando o Script de Teste

```bash
# Dar permissão de execução
chmod +x test-api.sh

# Executar testes
./test-api.sh
```

#### Usando os Exemplos Node.js

```bash
# Navegar até a pasta de exemplos
cd examples

# Executar exemplos
node call-examples.js
```

**Modificar exemplos**:
```javascript
// examples/call-examples.js
// Descomentar a linha final:
main();

// Ajustar número de telefone:
const callId = await makeAudioCall('5511999999999'); // Seu número aqui
```

#### Usando Postman/Insomnia

1. Criar uma Collection/Workspace
2. Adicionar requests para cada endpoint
3. Configurar variáveis de ambiente:
   - `base_url`: `http://localhost:3000`
4. Usar `{{base_url}}/api/status` nos requests

**Exemplo de Request no Postman**:
```
POST {{base_url}}/api/call
Content-Type: application/json

{
  "phoneNumber": "5511999999999",
  "isVideo": false
}
```

---

## Dependências Principais

### Dependências de Produção

#### **@whiskeysockets/baileys** (6.7.9)
Biblioteca principal que implementa o protocolo do WhatsApp Web.

**Funcionalidades**:
- Conexão WebSocket com servidores do WhatsApp
- Autenticação e criptografia end-to-end
- APIs para chamadas, mensagens e mídias
- Gerenciamento de estado e sincronização

**Uso no Projeto**:
```javascript
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
```

**Documentação**: https://github.com/WhiskeySockets/Baileys

#### **express** (4.18.2)
Framework web para Node.js, usado para criar a API REST.

**Funcionalidades**:
- Criação de rotas HTTP
- Middlewares para processamento de requisições
- Gerenciamento de respostas JSON
- Sistema de roteamento

**Uso no Projeto**:
```javascript
import express from 'express';
const app = express();
app.use(express.json()); // Parser de JSON
```

#### **pino** (8.19.0)
Sistema de logging extremamente rápido.

**Status Atual**: Configurado em modo silencioso (`level: 'silent'`)

**Configuração Atual**:
```javascript
const logger = pino({ level: 'silent' });
```

**Para Habilitar Logs**:
```javascript
const logger = pino({
  level: 'info', // ou 'debug', 'warn', 'error'
  transport: {
    target: 'pino-pretty' // Logs formatados (requer pino-pretty)
  }
});
```

#### **qrcode** (1.5.3)
Geração de QR Codes para display em navegadores.

**Uso no Projeto**:
```javascript
import QRCode from 'qrcode';

// Gerar QR Code como Data URL (Base64)
const qrImage = await QRCode.toDataURL(qr);
```

**Formatos Suportados**:
- Data URL (Base64) - usado na API
- Terminal (ASCII art)
- Arquivo de imagem (PNG, SVG)

#### **qrcode-terminal** (0.12.0)
Exibe QR Codes diretamente no terminal.

**Uso no Projeto**:
```javascript
// Configurado automaticamente no Baileys
makeWASocket({
  printQRInTerminal: true // Ativa exibição no terminal
});
```

### Dependências de Desenvolvimento

#### **nodemon** (3.0.3)
Monitora mudanças em arquivos e reinicia o servidor automaticamente.

**Configuração**:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js"
  }
}
```

**Uso**:
```bash
npm run dev
```

**Comportamento**:
- Monitora arquivos `.js`
- Reinicia ao detectar mudanças
- Útil durante desenvolvimento

---

## Notas Importantes para Assistentes de IA

### Especificidades da Biblioteca Baileys

#### 1. Gerenciamento de Socket

**Regra Fundamental**: Use apenas **UMA** instância de socket por aplicação.

**Implementação Correta**:
```javascript
// src/config/baileys.js
let sock; // Variável global única

export async function connectToWhatsApp() {
  // Cria ou reconecta o socket único
  sock = makeWASocket({ /* config */ });
  return sock;
}

export function getSocket() {
  return sock; // Retorna a instância única
}
```

**❌ NUNCA faça isso**:
```javascript
// NÃO crie múltiplos sockets
const sock1 = makeWASocket({ /* ... */ });
const sock2 = makeWASocket({ /* ... */ }); // ERRO!

// NÃO crie socket fora de baileys.js
// em callService.js
const sock = makeWASocket({ /* ... */ }); // ERRADO!
```

**Por quê?**
- WhatsApp permite apenas uma conexão por vez
- Múltiplos sockets causam conflitos
- Pode resultar em ban temporário

#### 2. Estados de Conexão

O Baileys gerencia estados através do evento `connection.update`.

**Estados Possíveis**:

| Estado | Significado | Ação Necessária |
|--------|-------------|-----------------|
| `disconnected` | Sem conexão | Aguardar reconexão automática |
| `qr` | QR Code disponível | Escanear com WhatsApp |
| `connected` | Conectado e autenticado | Pronto para usar |
| `reconnecting` | Reconectando | Aguardar |

**Implementação**:
```javascript
sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    qrCode = qr;
    connectionState = 'qr';
  }

  if (connection === 'close') {
    // Decidir se reconecta baseado no motivo
    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

    if (shouldReconnect) {
      connectionState = 'reconnecting';
      await connectToWhatsApp(); // Reconectar
    }
  }

  if (connection === 'open') {
    connectionState = 'connected';
    qrCode = null;
  }
});
```

**Razões de Desconexão** (DisconnectReason):
- `loggedOut`: Usuário fez logout - NÃO reconectar
- `restartRequired`: Servidor solicitou restart - Reconectar
- `connectionClosed`: Conexão caiu - Reconectar
- `connectionLost`: Perda de conexão - Reconectar

#### 3. Event Listeners

O Baileys usa um sistema de eventos para comunicação.

**Eventos Principais**:

**`connection.update`**: Mudanças no estado da conexão
```javascript
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update;
  // Processar mudanças de estado
});
```

**`creds.update`**: Credenciais foram atualizadas
```javascript
sock.ev.on('creds.update', saveCreds);
// saveCreds salva automaticamente em auth_info_baileys/
```

**`call`**: Chamada recebida
```javascript
sock.ev.on('call', async (callData) => {
  console.log('Chamada recebida:', callData);
  // callData contém: id, from, isVideo, etc.
});
```

**Outros Eventos Disponíveis**:
- `messages.upsert`: Mensagens recebidas
- `messages.update`: Mensagens atualizadas (lidas, enviadas, etc.)
- `presence.update`: Status online/offline
- `chats.update`: Conversas atualizadas

#### 4. Persistência de Autenticação

**Como Funciona**:
```javascript
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

sock = makeWASocket({
  auth: state, // Usa estado salvo
  // ...
});

// Salva automaticamente quando credenciais mudam
sock.ev.on('creds.update', saveCreds);
```

**Estrutura de `auth_info_baileys/`**:
```
auth_info_baileys/
├── creds.json          # Credenciais principais
├── app-state-sync-key-*.json  # Chaves de sincronização
└── ...outros arquivos de sessão
```

**⚠️ NUNCA:**
- Commite este diretório no Git
- Compartilhe estes arquivos
- Delete durante a execução do app
- Modifique manualmente

**Está no .gitignore**:
```gitignore
auth_info_baileys/
```

### Armadilhas Comuns e Como Evitar

#### 1. Esquecer Extensão `.js` nos Imports

**❌ ERRADO**:
```javascript
import { getSocket } from './config/baileys';
import { makeCall } from '../services/callService';
```

**Erro que ocorre**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**✅ CORRETO**:
```javascript
import { getSocket } from './config/baileys.js';
import { makeCall } from '../services/callService.js';
```

**Por quê?**
- ES Modules exigem extensão completa
- Node.js não assume `.js` automaticamente em ES Modules

#### 2. Esquecer Conversão JID

**❌ ERRADO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();
  // Envia número sem formatar
  await sock.offerCall(phoneNumber, callId, isVideo); // ERRO!
}
```

**Erro que ocorre**:
- Chamada não é iniciada
- WhatsApp rejeita requisição
- Erro silencioso ou timeout

**✅ CORRETO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();

  // Sempre formatar para JID
  const jid = phoneNumber.includes('@')
    ? phoneNumber
    : `${phoneNumber}@s.whatsapp.net`;

  await sock.offerCall(jid, callId, isVideo);
}
```

#### 3. Não Verificar Disponibilidade do Socket

**❌ ERRADO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();
  // Assume que sock sempre existe
  await sock.offerCall(jid, callId, isVideo); // Pode ser null!
}
```

**Erro que ocorre**:
```
TypeError: Cannot read properties of null (reading 'offerCall')
```

**✅ CORRETO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();

  // SEMPRE verificar antes de usar
  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  await sock.offerCall(jid, callId, isVideo);
}
```

#### 4. Esquecer `await` em Operações Assíncronas

**❌ ERRADO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();
  const jid = formatPhoneNumber(phoneNumber);
  const callId = generateCallId();

  // Faltou await - retorna Promise não resolvida
  sock.offerCall(jid, callId, isVideo);

  // Retorna antes da chamada ser feita!
  return { success: true, callId };
}
```

**Problema**:
- Função retorna antes da operação completar
- Erros não são capturados
- Estado inconsistente

**✅ CORRETO**:
```javascript
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();
  const jid = formatPhoneNumber(phoneNumber);
  const callId = generateCallId();

  // Aguarda operação completar
  await sock.offerCall(jid, callId, isVideo);

  // Só retorna após sucesso
  return { success: true, callId };
}
```

#### 5. Modificar Lógica de Conexão sem Entender

**❌ PERIGOSO**:
```javascript
// NÃO modifique o ciclo de vida sem entender
sock.ev.on('connection.update', async (update) => {
  if (connection === 'close') {
    // Reconectar sempre pode causar loops infinitos
    await connectToWhatsApp(); // PERIGOSO!
  }
});
```

**Problemas**:
- Loop infinito de reconexão
- Possível ban do WhatsApp
- Consumo excessivo de recursos

**✅ SEGURO**:
```javascript
sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update;

  if (connection === 'close') {
    // Verificar motivo antes de reconectar
    const shouldReconnect =
      (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;

    if (shouldReconnect) {
      connectionState = 'reconnecting';
      await connectToWhatsApp();
    } else {
      connectionState = 'disconnected';
    }
  }
});
```

### Considerações de Segurança

#### 1. Variáveis de Ambiente

**❌ NUNCA faça**:
```javascript
// NÃO hardcode informações sensíveis
const API_KEY = 'minha-chave-secreta'; // ERRADO!
const DB_PASSWORD = 'senha123'; // ERRADO!
```

**✅ SEMPRE use**:
```javascript
// Use variáveis de ambiente
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
```

**Arquivo .env** (não commitado):
```env
API_KEY=minha-chave-secreta
DB_PASSWORD=senha123
PORT=3000
```

#### 2. Arquivos de Sessão

**Diretório `auth_info_baileys/`**:
- Contém tokens de autenticação
- Acesso total ao WhatsApp conectado
- **EXTREMAMENTE SENSÍVEL**

**Proteção**:
```gitignore
# .gitignore
auth_info_baileys/
*.session
.env
```

**Permissões em Produção**:
```bash
# Restringir acesso ao diretório
chmod 700 auth_info_baileys/
chmod 600 auth_info_baileys/*
```

#### 3. Validação de Entrada

**SEMPRE valide inputs do usuário**:

```javascript
router.post('/call', async (req, res) => {
  const { phoneNumber, isVideo } = req.body;

  // Validar presença
  if (!phoneNumber) {
    return res.status(400).json({
      error: 'Número de telefone é obrigatório'
    });
  }

  // Validar formato (exemplo básico)
  if (!/^\d+$/.test(phoneNumber.replace('@s.whatsapp.net', ''))) {
    return res.status(400).json({
      error: 'Formato de número inválido'
    });
  }

  // Validar tipo
  if (isVideo !== undefined && typeof isVideo !== 'boolean') {
    return res.status(400).json({
      error: 'isVideo deve ser booleano'
    });
  }

  // Processar...
});
```

#### 4. Rate Limiting

**Problema**: API sem rate limiting pode ser abusada.

**Solução** (para implementar):
```javascript
import rateLimit from 'express-rate-limit';

const callLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 chamadas
  message: 'Muitas chamadas deste IP, tente novamente mais tarde'
});

router.post('/call', callLimiter, async (req, res) => {
  // ...
});
```

#### 5. CORS

**Problema Atual**: Sem configuração CORS.

**Quando Adicionar**: Se frontend em domínio diferente.

**Implementação**:
```javascript
import cors from 'cors';

// Permitir domínios específicos
app.use(cors({
  origin: 'https://meu-frontend.com',
  credentials: true
}));

// OU permitir todos (desenvolvimento)
app.use(cors());
```

### Melhorias Futuras Sugeridas

#### 1. Armazenamento de Histórico de Chamadas

**Problema Atual**: `getCallHistory()` retorna array vazio.

**Solução Sugerida**:
```javascript
// Usar banco de dados (ex: SQLite, MongoDB)
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./calls.db');

// Salvar chamada
export async function saveCall(callData) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO calls (callId, to, type, timestamp) VALUES (?, ?, ?, ?)`,
      [callData.callId, callData.to, callData.type, callData.timestamp],
      (err) => err ? reject(err) : resolve()
    );
  });
}

// Buscar histórico
export async function getCallHistory() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM calls ORDER BY timestamp DESC', (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });
}
```

#### 2. Sistema de Webhooks

**Implementação Sugerida**:
```javascript
// src/config/baileys.js
import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_URL;

sock.ev.on('call', async (callData) => {
  console.log('Chamada recebida:', callData);

  // Enviar para webhook
  if (WEBHOOK_URL) {
    try {
      await axios.post(WEBHOOK_URL, {
        event: 'call.received',
        data: callData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
    }
  }
});
```

#### 3. Autenticação da API

**Implementação com API Key**:
```javascript
// src/middlewares/auth.js
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'API key inválida ou ausente'
    });
  }

  next();
}

// Uso
import { validateApiKey } from './middlewares/auth.js';
app.use('/api', validateApiKey, callRoutes);
```

#### 4. Logging Estruturado

**Habilitar Pino com Formato**:
```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

// Usar em toda aplicação
logger.info('Servidor iniciado na porta 3000');
logger.error({ err: error }, 'Erro ao fazer chamada');
```

#### 5. Health Check Completo

**Endpoint de Health**:
```javascript
router.get('/health', async (req, res) => {
  const sock = getSocket();
  const state = getConnectionState();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsapp: {
      connected: state === 'connected',
      state: state
    },
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  const httpStatus = health.whatsapp.connected ? 200 : 503;
  res.status(httpStatus).json(health);
});
```

#### 6. Métricas e Monitoramento

**Implementação com Prometheus**:
```javascript
import promClient from 'prom-client';

const register = new promClient.Registry();

const callsTotal = new promClient.Counter({
  name: 'whatsapp_calls_total',
  help: 'Total de chamadas realizadas',
  labelNames: ['type', 'status']
});

register.registerMetric(callsTotal);

// Incrementar ao fazer chamada
export async function makeCall(phoneNumber, isVideo) {
  try {
    // ... lógica de chamada
    callsTotal.inc({ type: isVideo ? 'video' : 'audio', status: 'success' });
  } catch (error) {
    callsTotal.inc({ type: isVideo ? 'video' : 'audio', status: 'error' });
    throw error;
  }
}

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### 7. Banco de Dados para Persistência

**Exemplo com MongoDB**:
```javascript
import mongoose from 'mongoose';

// Schema de chamada
const callSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true },
  to: { type: String, required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['initiated', 'rejected', 'terminated'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const Call = mongoose.model('Call', callSchema);

// Salvar chamada
export async function makeCall(phoneNumber, isVideo) {
  const sock = getSocket();
  // ... validações

  const callId = generateCallId();
  await sock.offerCall(jid, callId, isVideo);

  // Salvar no banco
  await Call.create({
    callId,
    to: jid,
    type: isVideo ? 'video' : 'audio',
    status: 'initiated'
  });

  return { success: true, callId, to: jid, type: isVideo ? 'video' : 'audio' };
}

// Buscar histórico
export async function getCallHistory(limit = 50) {
  const calls = await Call.find()
    .sort({ timestamp: -1 })
    .limit(limit);

  return {
    success: true,
    calls: calls,
    total: calls.length
  };
}
```

---

## Workflow Git

### Estratégia de Branches

Este projeto usa branches de feature com prefixo `claude/`.

**Padrão de Nomenclatura**:
```
claude/claude-md-{session-id}
```

**Exemplo**:
```
claude/claude-md-mhyj1u7d13uu39bm-01EkUiaT4pQHSefKg2U9qKT6
```

**Regras**:
- Desenvolvimento acontece em branches de feature
- **NUNCA** faça push direto para `main` ou `master`
- Sempre use a branch designada fornecida

### Mensagens de Commit

**Idioma**: Português brasileiro

**Formato**:
```
[emoji] Descrição concisa da mudança

Detalhes opcionais se necessário
```

**Emojis Comuns**:
- 🚀 `:rocket:` - Deploy, lançamento, nova feature
- 📚 `:books:` - Documentação
- 🐛 `:bug:` - Correção de bug
- ✨ `:sparkles:` - Nova funcionalidade
- ♻️ `:recycle:` - Refatoração
- 🔧 `:wrench:` - Configuração
- 🧪 `:test_tube:` - Testes
- 🎨 `:art:` - Melhorias de UI/formatação

**Exemplos**:
```bash
git commit -m "🚀 Adiciona endpoint para histórico de chamadas"
git commit -m "📚 Atualiza documentação da API"
git commit -m "🐛 Corrige formatação de número de telefone"
git commit -m "✨ Implementa sistema de webhooks"
```

### Comandos de Push

**Sempre use** a flag `-u` na primeira push:
```bash
git push -u origin <nome-da-branch>
```

**Exemplo**:
```bash
git push -u origin claude/claude-md-mhyj1u7d13uu39bm-01EkUiaT4pQHSefKg2U9qKT6
```

**Pushes subsequentes**:
```bash
git push
```

### Workflow Completo

```bash
# 1. Verificar branch atual
git status

# 2. Adicionar arquivos modificados
git add .

# 3. Commitar com mensagem descritiva
git commit -m "🚀 Adiciona nova funcionalidade"

# 4. Fazer push (primeira vez)
git push -u origin nome-da-branch

# 5. Criar Pull Request (se aplicável)
# Usar URL fornecida pelo Git
```

---

## Testes e Debugging

### Testes Manuais

#### Usando Exemplos Node.js

**Arquivo**: `examples/call-examples.js`

**Passo 1**: Descomentar função main
```javascript
// Linha final do arquivo
main(); // Descomentar esta linha
```

**Passo 2**: Ajustar número de telefone
```javascript
// Linha ~105
const callId = await makeAudioCall('5511999999999'); // Seu número
```

**Passo 3**: Executar
```bash
node examples/call-examples.js
```

#### Usando Script de Teste

**Arquivo**: `test-api.sh`

**Executar**:
```bash
chmod +x test-api.sh
./test-api.sh
```

**O que testa**:
- Status da conexão
- Geração de QR Code
- Fazer chamada
- Histórico

#### Checklist de Testes Completo

- [ ] Servidor inicia sem erros
- [ ] `/api/status` retorna estado correto
- [ ] `/api/qr` gera QR Code quando desconectado
- [ ] `/api/qr` retorna 404 quando conectado
- [ ] QR Code pode ser escaneado com sucesso
- [ ] Após scan, estado muda para `connected`
- [ ] `/api/call` com número válido inicia chamada
- [ ] `/api/call` sem número retorna erro 400
- [ ] `/api/call/terminate` encerra chamada
- [ ] Credenciais são salvas em `auth_info_baileys/`
- [ ] Reiniciar servidor conecta automaticamente
- [ ] Docker container inicia corretamente
- [ ] Volume persiste credenciais no Docker

### Dicas de Debugging

#### 1. Verificar Estado da Conexão

**Sempre comece aqui**:
```bash
curl http://localhost:3000/api/status
```

**Interpretação**:
```json
{"connected": false, "state": "qr"}
```
→ Precisa escanear QR Code

```json
{"connected": true, "state": "connected"}
```
→ Pronto para usar

```json
{"connected": false, "state": "reconnecting"}
```
→ Aguardar alguns segundos

#### 2. Monitorar Console do Servidor

**Mensagens importantes**:
```
🚀 Servidor rodando na porta 3000
📱 Conectando ao WhatsApp...
QR Code gerado
Conectado ao WhatsApp!
```

**Mensagens de erro**:
```
❌ Erro ao conectar: [detalhes]
Conexão fechada: [motivo] Reconectando: true/false
```

#### 3. Verificar Diretório de Autenticação

**Comando**:
```bash
ls -la auth_info_baileys/
```

**Deve conter**:
```
creds.json
app-state-sync-key-*.json
app-state-sync-version-*.json
```

**Se vazio ou não existe**:
- QR Code será gerado
- Autenticação necessária

#### 4. Verificar Logs do Docker

**Comando**:
```bash
docker-compose logs -f
```

**Buscar por**:
- Erros de conexão
- QR Code gerado
- Status de autenticação

#### 5. Verificar Conectividade do WhatsApp

**No celular**:
1. Abrir WhatsApp
2. Ir em Configurações → Aparelhos Conectados
3. Verificar se API está listada
4. Se offline: desconectar e reconectar

### Problemas Comuns e Soluções

#### ❌ Problema: Endpoint /api/qr retorna 404

**Causa**: WhatsApp já está conectado ou não está no estado `qr`

**Diagnóstico**:
```bash
curl http://localhost:3000/api/status
# Verificar campo "state"
```

**Soluções**:

**Se state = "connected"**:
```
OK - Você já está autenticado. Não precisa de QR Code.
```

**Se state = "disconnected"**:
```bash
# Aguardar alguns segundos para QR Code ser gerado
# ou
# Reiniciar servidor
npm run dev
```

**Se state = "reconnecting"**:
```bash
# Aguardar reconexão completar
# Se demorar >30s, reiniciar servidor
```

**Forçar novo QR Code**:
```bash
# Parar servidor
Ctrl+C

# Deletar credenciais
rm -rf auth_info_baileys/

# Reiniciar
npm run dev
```

#### ❌ Problema: Chamadas não funcionam

**Causa**: WhatsApp não está conectado

**Diagnóstico**:
```bash
curl http://localhost:3000/api/status
```

**Solução**:
```bash
# Se state != "connected"
# 1. Verificar QR Code
curl http://localhost:3000/api/qr

# 2. Escanear com WhatsApp
# 3. Aguardar estado mudar para "connected"
# 4. Tentar chamada novamente
```

**Erro comum**:
```json
{
  "error": "Erro ao fazer chamada",
  "message": "WhatsApp não está conectado"
}
```

**Verificar**:
- Estado da conexão (`/api/status`)
- Se WhatsApp no celular está online
- Se não foi feito logout no celular

#### ❌ Problema: Erros de módulo (Module import errors)

**Causa 1**: Falta extensão `.js`

**Erro**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../baileys'
```

**Solução**:
```javascript
// Adicionar .js no import
import { getSocket } from './config/baileys.js';
```

**Causa 2**: Sintaxe CommonJS em projeto ES Module

**Erro**:
```
ReferenceError: require is not defined
```

**Solução**:
```javascript
// Mudar de:
const express = require('express');

// Para:
import express from 'express';
```

**Causa 3**: Package.json sem "type": "module"

**Solução**:
```json
{
  "type": "module",
  ...
}
```

#### ❌ Problema: Docker não persiste autenticação

**Causa**: Volume não está montado corretamente

**Diagnóstico**:
```bash
# Verificar docker-compose.yml
cat docker-compose.yml | grep volumes
```

**Deve ter**:
```yaml
volumes:
  - ./auth_info_baileys:/app/auth_info_baileys
```

**Solução**:
```bash
# 1. Parar containers
docker-compose down

# 2. Verificar/corrigir docker-compose.yml
# 3. Rebuild e restart
docker-compose up -d --build

# 4. Verificar volume foi criado
docker inspect whatsapp-call-api | grep Mounts -A 10
```

#### ❌ Problema: QR Code expirado

**Sintoma**: QR Code não funciona após escanear

**Causa**: QR Code tem validade de ~60 segundos

**Solução**:
```bash
# Obter novo QR Code
curl http://localhost:3000/api/qr

# Escanear imediatamente
```

**Prevenção**:
- Ter WhatsApp aberto antes de obter QR Code
- Escanear imediatamente após gerar
- Se expirar, obter novo

#### ❌ Problema: Loop de reconexão

**Sintoma**: Servidor fica reconectando infinitamente

**Logs**:
```
Conexão fechada: ... Reconectando: true
Conexão fechada: ... Reconectando: true
(repete)
```

**Causas possíveis**:
1. WhatsApp bloqueou temporariamente
2. Credenciais corrompidas
3. Problema de rede

**Solução**:
```bash
# 1. Parar servidor
Ctrl+C

# 2. Deletar credenciais
rm -rf auth_info_baileys/

# 3. Aguardar 5 minutos (se foi bloqueio temporário)

# 4. Reiniciar
npm run dev

# 5. Autenticar novamente com QR Code
```

**Prevenção**:
- Não fazer muitas chamadas em curto período
- Não reconectar agressivamente (já está correto no código)
- Manter WhatsApp no celular online

---

## Variáveis de Ambiente

### Variáveis Obrigatórias

**PORT**
- **Descrição**: Porta onde o servidor Express irá rodar
- **Tipo**: Número
- **Default**: 3000
- **Exemplo**: `PORT=3000`

**SESSION_NAME**
- **Descrição**: Nome identificador da sessão WhatsApp
- **Tipo**: String
- **Default**: whatsapp-call-session
- **Exemplo**: `SESSION_NAME=minha-sessao-whatsapp`

### Variáveis Opcionais (Para Implementações Futuras)

**DATABASE_URL**
- **Descrição**: URL de conexão com banco de dados
- **Tipo**: String
- **Exemplo**: `DATABASE_URL=mongodb://localhost:27017/whatsapp`

**WEBHOOK_URL**
- **Descrição**: URL para enviar eventos de chamadas
- **Tipo**: URL
- **Exemplo**: `WEBHOOK_URL=https://meu-servidor.com/webhook`

**API_KEY**
- **Descrição**: Chave para autenticação da API
- **Tipo**: String
- **Exemplo**: `API_KEY=minha-chave-secreta-123`

**LOG_LEVEL**
- **Descrição**: Nível de logging (silent, error, warn, info, debug, trace)
- **Tipo**: String
- **Default**: silent
- **Exemplo**: `LOG_LEVEL=info`

**NODE_ENV**
- **Descrição**: Ambiente de execução
- **Tipo**: String (development, production, test)
- **Default**: development
- **Exemplo**: `NODE_ENV=production`

### Arquivo .env Completo (Exemplo)

```env
# Servidor
PORT=3000
NODE_ENV=development

# WhatsApp
SESSION_NAME=whatsapp-call-session

# Logging
LOG_LEVEL=info

# Banco de Dados (futuro)
# DATABASE_URL=mongodb://localhost:27017/whatsapp

# Webhooks (futuro)
# WEBHOOK_URL=https://meu-servidor.com/webhook

# Autenticação (futuro)
# API_KEY=sua-chave-secreta-aqui
```

---

## Recursos Adicionais

### Documentações Oficiais

**Baileys**
- **URL**: https://github.com/WhiskeySockets/Baileys
- **O que aprender**: API completa, eventos, configurações avançadas

**Express.js**
- **URL**: https://expressjs.com/
- **O que aprender**: Rotas, middlewares, best practices

**WhatsApp Business API** (Alternativa Oficial)
- **URL**: https://developers.facebook.com/docs/whatsapp
- **Quando usar**: Aplicações comerciais em larga escala

**Docker**
- **URL**: https://docs.docker.com/
- **O que aprender**: Containerização, docker-compose, volumes

**Node.js ES Modules**
- **URL**: https://nodejs.org/api/esm.html
- **O que aprender**: Sistema de módulos, imports, exports

### Tutoriais Recomendados

**Baileys + Express**
- Como criar bot de WhatsApp com Baileys
- Gerenciamento de sessões múltiplas
- Tratamento de eventos

**Docker para Node.js**
- Containerizar aplicações Node
- Docker compose para desenvolvimento
- Volumes e persistência

**API REST Best Practices**
- Design de endpoints RESTful
- Versionamento de API
- Documentação com Swagger/OpenAPI

---

## Resumo para Assistentes de IA

### Quando trabalhar com este código

#### ✅ FAZER (Regras Fundamentais)

1. **Módulos ES6**
   ```javascript
   import express from 'express';
   import { getSocket } from './config/baileys.js';
   ```
   - SEMPRE use `import/export`
   - SEMPRE inclua extensão `.js`

2. **Async/Await Consistente**
   ```javascript
   export async function makeCall(phoneNumber, isVideo) {
     await sock.offerCall(jid, callId, isVideo);
   }
   ```
   - Use async/await, não Promises
   - Sempre `await` operações assíncronas

3. **Validar e Formatar Números**
   ```javascript
   const jid = phoneNumber.includes('@')
     ? phoneNumber
     : `${phoneNumber}@s.whatsapp.net`;
   ```
   - Sempre converter para JID
   - Verificar antes de formatar

4. **Verificar Socket**
   ```javascript
   const sock = getSocket();
   if (!sock) {
     throw new Error('WhatsApp não está conectado');
   }
   ```
   - SEMPRE verificar antes de usar
   - Lançar erro descritivo

5. **Tratamento de Erros**
   ```javascript
   // Serviço: throw
   throw new Error('Descrição');

   // Rota: catch
   catch (error) {
     res.status(500).json({ error, message });
   }
   ```
   - Serviços lançam erros
   - Rotas capturam e formatam

6. **Testar Endpoints**
   - Usar `examples/call-examples.js`
   - Usar `test-api.sh`
   - Sempre verificar `/api/status` primeiro

7. **Manter Arquivos Seguros**
   ```gitignore
   auth_info_baileys/
   .env
   *.session
   ```
   - Nunca commitar credenciais
   - Usar .gitignore corretamente

#### ❌ NÃO FAZER (Erros Críticos)

1. **Sintaxe CommonJS**
   ```javascript
   // NUNCA FAÇA ISSO
   const express = require('express');
   module.exports = { function };
   ```

2. **Múltiplos Sockets**
   ```javascript
   // NUNCA FAÇA ISSO
   const sock1 = makeWASocket({...});
   const sock2 = makeWASocket({...});
   ```

3. **Commitar Credenciais**
   ```bash
   # NUNCA FAÇA ISSO
   git add auth_info_baileys/
   git add .env
   ```

4. **Pular Validações**
   ```javascript
   // NUNCA FAÇA ISSO
   await sock.offerCall(phoneNumber, callId); // Sem validar!
   ```

5. **Esquecer await**
   ```javascript
   // NUNCA FAÇA ISSO
   sock.offerCall(jid, callId, isVideo); // Sem await!
   ```

6. **Modificar Lógica de Conexão sem Entender**
   ```javascript
   // PERIGOSO - pode causar loop infinito
   if (connection === 'close') {
     await connectToWhatsApp(); // Sempre reconectar
   }
   ```

#### 🎯 ÁREAS DE FOCO

1. **Padrão de Socket Único**
   - Manter instância global em `baileys.js`
   - Nunca criar novos sockets
   - Acessar via `getSocket()`

2. **Gerenciamento de Estado**
   - Rastrear estados corretamente
   - Reconectar apenas quando apropriado
   - Verificar `DisconnectReason`

3. **Formatos de Resposta Consistentes**
   ```javascript
   {
     success: true/false,
     timestamp: ISO 8601,
     // dados específicos
   }
   ```

4. **Português em User-Facing Content**
   - Mensagens de erro em PT-BR
   - Logs em PT-BR
   - Documentação de API em PT-BR
   - Comentários podem ser em inglês

5. **Tratamento de Erros em Todas as Rotas**
   - Sempre usar try/catch
   - Retornar status HTTP correto
   - Incluir mensagens descritivas

---

## Checklist de Desenvolvimento

Ao fazer mudanças no projeto:

### Antes de Commitar

- [ ] Código usa ES6 modules com `.js`
- [ ] Todas funções async têm `await` onde necessário
- [ ] Validações de entrada implementadas
- [ ] Erros tratados em serviços e rotas
- [ ] Números de telefone formatados para JID
- [ ] Socket verificado antes de uso
- [ ] Não commitando `auth_info_baileys/` ou `.env`
- [ ] Mensagens em português
- [ ] Código testado manualmente

### Antes de Fazer Push

- [ ] Todos os testes passando
- [ ] Servidor inicia sem erros
- [ ] Conexão WhatsApp funciona
- [ ] Endpoints respondem corretamente
- [ ] Docker build funciona
- [ ] Documentação atualizada (se necessário)
- [ ] Commit message descritiva em PT-BR
- [ ] Branch correta (`claude/...`)

### Ao Adicionar Nova Feature

- [ ] Validação de inputs
- [ ] Tratamento de erros
- [ ] Resposta padronizada
- [ ] Documentar em README.md e CLAUDE.md
- [ ] Adicionar exemplo em `examples/`
- [ ] Testar manualmente
- [ ] Considerar rate limiting
- [ ] Considerar logging

---

**Última Atualização**: 2025-11-14
**Versão**: 1.0.0
**Idioma**: Português Brasileiro

---

## Contato e Suporte

Para dúvidas ou problemas:

1. **Issues**: Abrir issue no repositório
2. **Documentação**: Consultar README.md e este arquivo
3. **Baileys**: https://github.com/WhiskeySockets/Baileys/issues
4. **Express**: https://expressjs.com/en/resources/community.html

---

**Fim da Documentação**
