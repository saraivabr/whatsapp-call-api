# 📞 WhatsApp Call API

> API REST em Node.js para realizar e gerenciar ligações de voz e vídeo via WhatsApp de forma programática

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![Baileys](https://img.shields.io/badge/Baileys-6.7-purple.svg)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Características](#-características)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Documentação da API](#-documentação-da-api)
- [Docker](#-docker)
- [Exemplos](#-exemplos)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias](#-tecnologias)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

A **WhatsApp Call API** é uma solução REST completa que permite integrar funcionalidades de chamadas do WhatsApp em suas aplicações. Construída sobre a biblioteca Baileys, ela oferece endpoints simples e eficientes para:

- Iniciar chamadas de voz e vídeo
- Gerenciar chamadas recebidas
- Monitorar status de conexão
- Automatizar fluxos de atendimento

### Por que usar?

- ✅ **Simples**: API REST fácil de integrar em qualquer linguagem
- ✅ **Completo**: Suporte a voz e vídeo
- ✅ **Moderno**: Node.js 20+ com ES Modules
- ✅ **Dockerizado**: Deploy fácil com Docker Compose
- ✅ **Bem Documentado**: Exemplos práticos e documentação detalhada

---

## ✨ Características

- 📞 **Chamadas de Voz e Vídeo**: Inicie chamadas programaticamente
- 🔐 **Autenticação Persistente**: QR Code gerado automaticamente na primeira execução
- 🔄 **Reconexão Automática**: Mantém a conexão ativa mesmo após instabilidades
- 📊 **Status em Tempo Real**: Monitore o estado da conexão WhatsApp
- 🎨 **QR Code Visual**: Endpoint para obter QR Code como imagem base64
- 🐳 **Docker Ready**: Configuração completa para containers
- 📝 **Logging Estruturado**: Utiliza Pino para logs eficientes
- 🛡️ **Tratamento de Erros**: Respostas padronizadas e informativas

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 20.x ou superior ([Download](https://nodejs.org/))
- **npm** 9.x ou superior (vem com Node.js)
- **Git** (opcional, para clonar o repositório)
- **Docker** e **Docker Compose** (opcional, para execução em containers)

### Verificando versões

```bash
node --version   # Deve retornar v20.x.x ou superior
npm --version    # Deve retornar 9.x.x ou superior
```

---

## 📦 Instalação

### Opção 1: Instalação Local

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/whatsapp-call-api.git
cd whatsapp-call-api
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário:

```env
PORT=3000
SESSION_NAME=whatsapp-call-session
```

4. **Inicie o servidor**

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

### Opção 2: Docker (Recomendado)

```bash
# Build e iniciar containers
docker-compose up -d

# Visualizar logs
docker-compose logs -f

# Parar containers
docker-compose down
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `PORT` | Porta do servidor Express | `3000` | Não |
| `SESSION_NAME` | Nome da sessão WhatsApp | `whatsapp-call-session` | Não |

### Autenticação WhatsApp

Na **primeira execução**, será necessário autenticar com o WhatsApp:

1. **Inicie o servidor** (o QR Code aparecerá no terminal)

```bash
npm start
```

2. **Escaneie o QR Code** com o WhatsApp no celular:
   - Abra o WhatsApp
   - Vá em **Configurações** > **Aparelhos conectados**
   - Toque em **Conectar um aparelho**
   - Escaneie o QR Code exibido no terminal

3. **Alternativa**: Obtenha o QR Code via API

```bash
curl http://localhost:3000/api/qr
```

A autenticação será salva em `auth_info_baileys/` e reutilizada nas próximas execuções.

---

## 🚀 Uso

### Iniciando o servidor

```bash
# Desenvolvimento (com nodemon - reinicia automaticamente)
npm run dev

# Produção
npm start
```

O servidor estará disponível em: **http://localhost:3000**

### Verificando status

```bash
curl http://localhost:3000/api/status
```

Resposta esperada:
```json
{
  "connected": true,
  "state": "connected",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

## 📚 Documentação da API

### Base URL

```
http://localhost:3000/api
```

---

### 🔌 Gerenciamento de Conexão

#### `GET /api/status`

Verifica o status da conexão com WhatsApp.

**Resposta (200 OK)**
```json
{
  "connected": true,
  "state": "connected",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Estados possíveis:**
- `disconnected` - Desconectado
- `qr` - Aguardando leitura do QR Code
- `connected` - Conectado e autenticado
- `reconnecting` - Reconectando

---

#### `GET /api/qr`

Obtém o QR Code para autenticação (disponível apenas quando não conectado).

**Resposta (200 OK)**
```json
{
  "qrCode": "2@abc123...",
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Resposta (404 Not Found)** - Quando já está conectado
```json
{
  "error": "QR Code não disponível",
  "message": "WhatsApp já está conectado ou QR Code ainda não foi gerado"
}
```

**Uso do QR Code:**
- `qrCode`: String do QR Code (para geração própria)
- `qrImage`: Imagem base64 pronta para exibir em `<img src="...">`

---

### 📞 Operações de Chamada

#### `POST /api/call`

Inicia uma chamada de voz ou vídeo.

**Request Body**
```json
{
  "phoneNumber": "5511999999999",
  "isVideo": false
}
```

**Parâmetros:**
- `phoneNumber` (string, obrigatório): Número com código do país (sem + ou espaços)
- `isVideo` (boolean, opcional): `true` para videochamada, `false` para voz (padrão)

**Resposta (200 OK)**
```json
{
  "success": true,
  "callId": "call_1731582600000_abc123def",
  "to": "5511999999999@s.whatsapp.net",
  "type": "audio",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Resposta (400 Bad Request)**
```json
{
  "error": "Número de telefone é obrigatório"
}
```

**Resposta (500 Internal Server Error)**
```json
{
  "error": "Erro ao fazer chamada",
  "message": "WhatsApp não está conectado"
}
```

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999", "isVideo": false}'
```

---

#### `POST /api/call/reject`

Rejeita uma chamada recebida.

**Request Body**
```json
{
  "callId": "call_123456",
  "callFrom": "5511999999999@s.whatsapp.net"
}
```

**Parâmetros:**
- `callId` (string, obrigatório): ID da chamada a ser rejeitada
- `callFrom` (string, obrigatório): JID de quem está ligando

**Resposta (200 OK)**
```json
{
  "success": true,
  "message": "Chamada rejeitada",
  "callId": "call_123456",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

#### `POST /api/call/terminate`

Encerra uma chamada ativa.

**Request Body**
```json
{
  "callId": "call_123456"
}
```

**Parâmetros:**
- `callId` (string, obrigatório): ID da chamada a ser encerrada

**Resposta (200 OK)**
```json
{
  "success": true,
  "message": "Chamada encerrada",
  "callId": "call_123456",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

#### `GET /api/call/history`

Obtém o histórico de chamadas (atualmente retorna array vazio - implementação futura).

**Resposta (200 OK)**
```json
{
  "success": true,
  "message": "Histórico de chamadas não implementado",
  "calls": []
}
```

> 📝 **Nota**: Este endpoint será implementado em versões futuras com armazenamento em banco de dados.

---

## 🐳 Docker

### Executar com Docker Compose

```bash
# Iniciar serviço
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f whatsapp-call-api

# Parar serviço
docker-compose down

# Rebuild após alterações
docker-compose up -d --build
```

### Configuração Docker

O `docker-compose.yml` está configurado para:
- ✅ Mapear porta 3000
- ✅ Persistir autenticação em volume (`auth_info_baileys`)
- ✅ Reiniciar automaticamente após falhas
- ✅ Usar variáveis de ambiente

### Volume de Dados

```yaml
volumes:
  - ./auth_info_baileys:/app/auth_info_baileys
```

**Importante**: O diretório `auth_info_baileys/` contém as credenciais da sessão WhatsApp. Mantenha-o seguro e **nunca** commite no Git.

---

## 💡 Exemplos

### Exemplo 1: Fazer uma Chamada de Voz

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

### Exemplo 2: Fazer uma Videochamada

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

### Exemplo 3: Verificar Status Antes de Ligar

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

### Exemplo 4: Obter QR Code para Autenticação

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

### Exemplo 5: Script de Teste Bash

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

### Mais Exemplos

Veja a pasta `examples/` para exemplos mais avançados:
- `examples/call-examples.js` - Exemplos básicos de uso
- `examples/advanced-call.js` - Cenários avançados
- `examples/webhook-handler.js` - Integração com webhooks

---

## 📁 Estrutura do Projeto

```
whatsapp-call-api/
├── src/                        # Código fonte
│   ├── config/
│   │   └── baileys.js          # Configuração do Baileys e gestão do socket
│   ├── routes/
│   │   └── callRoutes.js       # Definição dos endpoints da API
│   ├── services/
│   │   └── callService.js      # Lógica de negócio das chamadas
│   └── index.js                # Entrada do servidor Express
│
├── examples/                   # Exemplos de uso
│   ├── call-examples.js        # Exemplos básicos
│   ├── advanced-call.js        # Exemplos avançados
│   └── webhook-handler.js      # Exemplo de webhook
│
├── auth_info_baileys/          # Sessão WhatsApp (não versionado)
│
├── .env.example                # Template de variáveis de ambiente
├── .gitignore                  # Arquivos ignorados pelo Git
├── CLAUDE.md                   # Documentação para AI assistants
├── Dockerfile                  # Configuração do container
├── docker-compose.yml          # Orquestração de containers
├── package.json                # Dependências e scripts
├── README.md                   # Este arquivo
└── test-api.sh                 # Script de teste da API
```

### Principais Diretórios

- **`src/`**: Todo o código fonte da aplicação
  - `config/`: Configurações (Baileys, banco de dados futuro)
  - `routes/`: Definição de rotas da API
  - `services/`: Lógica de negócio
- **`examples/`**: Exemplos práticos de uso da API
- **`auth_info_baileys/`**: Credenciais da sessão (gerado automaticamente)

---

## 🛠️ Tecnologias

### Principais Dependências

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [Node.js](https://nodejs.org/) | 20+ | Runtime JavaScript |
| [Express](https://expressjs.com/) | 4.18 | Framework web minimalista |
| [Baileys](https://github.com/WhiskeySockets/Baileys) | 6.7 | Biblioteca WhatsApp Web API |
| [Pino](https://getpino.io/) | 8.19 | Logger JSON de alta performance |
| [QRCode](https://www.npmjs.com/package/qrcode) | 1.5 | Geração de QR Codes |
| [QRCode Terminal](https://www.npmjs.com/package/qrcode-terminal) | 0.12 | QR Code no terminal |

### Dependências de Desenvolvimento

- **[Nodemon](https://nodemon.io/)** 3.0 - Auto-reload durante desenvolvimento

### Recursos do Node.js

- ✅ **ES Modules**: Uso nativo de `import/export`
- ✅ **Async/Await**: Código assíncrono moderno
- ✅ **Top-level await**: Suportado nativamente

---

## 🐛 Troubleshooting

### Problema: QR Code não aparece

**Sintomas**: Servidor inicia mas não exibe QR Code

**Soluções**:
1. Verifique se já está autenticado:
   ```bash
   curl http://localhost:3000/api/status
   ```
2. Se `connected: true`, delete a sessão e reinicie:
   ```bash
   rm -rf auth_info_baileys/
   npm start
   ```

---

### Problema: Erro "WhatsApp não está conectado"

**Sintomas**: API retorna erro ao tentar fazer chamada

**Soluções**:
1. Verifique o status:
   ```bash
   curl http://localhost:3000/api/status
   ```
2. Se `state: "qr"`, escaneie o QR Code:
   ```bash
   curl http://localhost:3000/api/qr
   ```
3. Aguarde o estado mudar para `connected`

---

### Problema: Erro "Cannot find module"

**Sintomas**:
```
Error: Cannot find module 'axios'
```

**Solução**:
```bash
npm install
```

---

### Problema: Porta 3000 já em uso

**Sintomas**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Soluções**:
1. **Altere a porta** no `.env`:
   ```env
   PORT=3001
   ```
2. **Ou mate o processo** usando a porta:
   ```bash
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

---

### Problema: Docker não consegue acessar auth_info_baileys

**Sintomas**: Container reinicia constantemente

**Solução**:
1. Certifique-se de que o diretório existe:
   ```bash
   mkdir -p auth_info_baileys
   ```
2. Verifique permissões:
   ```bash
   chmod 755 auth_info_baileys
   ```

---

### Problema: Chamada não completa

**Sintomas**: API retorna sucesso mas chamada não toca no WhatsApp

**Possíveis causas**:
- ⚠️ Número de telefone inválido ou bloqueado
- ⚠️ WhatsApp do destinatário sem internet
- ⚠️ Conta WhatsApp banida temporariamente (uso excessivo de API)

**Recomendação**: Aguarde alguns minutos entre chamadas e evite spam.

---

### Logs e Debugging

**Ver logs do servidor**:
```bash
# Modo desenvolvimento (já ativa logs)
npm run dev

# Docker
docker-compose logs -f
```

**Habilitar logs detalhados do Baileys**:

Edite `src/config/baileys.js`:
```javascript
const logger = pino({ level: 'info' }); // Alterar de 'silent' para 'info'
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork o projeto**
2. **Crie uma branch** para sua feature
   ```bash
   git checkout -b feature/MinhaFeature
   ```
3. **Commit suas mudanças**
   ```bash
   git commit -m '✨ Adiciona MinhaFeature'
   ```
4. **Push para a branch**
   ```bash
   git push origin feature/MinhaFeature
   ```
5. **Abra um Pull Request**

### Convenções

- Use **ES Modules** (`import/export`)
- Sempre inclua extensão `.js` nos imports
- Use **async/await** (não `.then()`)
- Mensagens de commit em português
- Siga o padrão do código existente

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

Encontrou um bug? Tem uma sugestão?

- 🐛 [Abra uma issue](https://github.com/seu-usuario/whatsapp-call-api/issues)
- 💬 [Discussões](https://github.com/seu-usuario/whatsapp-call-api/discussions)

---

## 🙏 Agradecimentos

- [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) - Pela excelente biblioteca
- Comunidade Node.js e Express
- Todos os contribuidores

---

## ⚠️ Disclaimer

Este projeto é para fins educacionais e de desenvolvimento. Use de forma responsável e de acordo com os [Termos de Serviço do WhatsApp](https://www.whatsapp.com/legal/terms-of-service).

**Não utilize para**:
- ❌ Spam ou mensagens não solicitadas
- ❌ Violação de privacidade
- ❌ Atividades ilegais

O uso inadequado pode resultar no **banimento da sua conta WhatsApp**.

---

<div align="center">

**Desenvolvido com ❤️ usando Node.js e Baileys**

[⬆ Voltar ao topo](#-whatsapp-call-api)

</div>
