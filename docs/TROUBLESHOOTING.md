# 🐛 Solução de Problemas - WhatsApp Call API

Este guia contém soluções para os problemas mais comuns ao usar a WhatsApp Call API.

---

## 📋 Índice

- [QR Code não aparece](#problema-qr-code-não-aparece)
- [Erro "WhatsApp não está conectado"](#problema-erro-whatsapp-não-está-conectado)
- [Erro "Cannot find module"](#problema-erro-cannot-find-module)
- [Porta 3000 já em uso](#problema-porta-3000-já-em-uso)
- [Docker não consegue acessar auth_info_baileys](#problema-docker-não-consegue-acessar-auth_info_baileys)
- [Chamada não completa](#problema-chamada-não-completa)
- [Logs e Debugging](#logs-e-debugging)

---

## Problema: QR Code não aparece

### Sintomas
Servidor inicia mas não exibe QR Code no terminal.

### Soluções

1. **Verifique se já está autenticado:**
   ```bash
   curl http://localhost:3000/api/status
   ```

2. **Se `connected: true`, delete a sessão e reinicie:**
   ```bash
   rm -rf auth_info_baileys/
   npm start
   ```

3. **Verifique se o terminal suporta QR Code:**
   - Alguns terminais podem não renderizar QR Codes corretamente
   - Use o endpoint `/api/qr` para obter a imagem:
     ```bash
     curl http://localhost:3000/api/qr
     ```

---

## Problema: Erro "WhatsApp não está conectado"

### Sintomas
API retorna erro 500 ao tentar fazer chamada.

### Soluções

1. **Verifique o status da conexão:**
   ```bash
   curl http://localhost:3000/api/status
   ```

2. **Se `state: "qr"`, escaneie o QR Code:**
   ```bash
   curl http://localhost:3000/api/qr
   ```

   Ou visualize o QR Code no terminal ao iniciar o servidor.

3. **Aguarde o estado mudar para `connected`:**
   - Após escanear, pode levar alguns segundos
   - Monitore os logs do servidor

4. **Se continuar desconectado:**
   ```bash
   # Limpe a sessão e tente novamente
   rm -rf auth_info_baileys/
   npm start
   ```

---

## Problema: Erro "Cannot find module"

### Sintomas
```
Error: Cannot find module 'axios'
Error: Cannot find module './config/baileys.js'
```

### Soluções

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Se o erro persistir, limpe o cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verifique a versão do Node.js:**
   ```bash
   node --version  # Deve ser 20.x ou superior
   ```

---

## Problema: Porta 3000 já em uso

### Sintomas
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Soluções

**Opção 1: Alterar a porta**

1. Edite o arquivo `.env`:
   ```env
   PORT=3001
   ```

2. Reinicie o servidor:
   ```bash
   npm start
   ```

**Opção 2: Liberar a porta**

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Problema: Docker não consegue acessar auth_info_baileys

### Sintomas
- Container reinicia constantemente
- Erro de permissão nos logs

### Soluções

1. **Certifique-se de que o diretório existe:**
   ```bash
   mkdir -p auth_info_baileys
   ```

2. **Verifique permissões (Linux/Mac):**
   ```bash
   chmod 755 auth_info_baileys
   ```

3. **No Windows com WSL:**
   ```bash
   # Garanta que o diretório está no sistema de arquivos Linux
   cd ~/whatsapp-call-api
   mkdir -p auth_info_baileys
   ```

4. **Verifique o docker-compose.yml:**
   ```yaml
   volumes:
     - ./auth_info_baileys:/app/auth_info_baileys
   ```

5. **Rebuild do container:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## Problema: Chamada não completa

### Sintomas
API retorna sucesso mas a chamada não toca no WhatsApp do destinatário.

### Possíveis Causas

- ⚠️ **Número de telefone inválido ou incorreto**
  - Verifique o formato: `5511999999999` (sem + ou espaços)
  - Inclua código do país e DDD

- ⚠️ **Destinatário bloqueou o número**
  - Teste com outro número conhecido

- ⚠️ **WhatsApp do destinatário sem internet**
  - Verifique se o destinatário está online

- ⚠️ **Conta WhatsApp temporariamente banida**
  - Uso excessivo de chamadas via API pode resultar em ban
  - Aguarde 24-48 horas

### Recomendações

1. **Evite spam:**
   - Aguarde pelo menos 30 segundos entre chamadas
   - Não faça mais de 10 chamadas por hora

2. **Teste com número conhecido:**
   ```bash
   curl -X POST http://localhost:3000/api/call \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "SEU_NUMERO", "isVideo": false}'
   ```

3. **Verifique logs do servidor:**
   - Procure por erros do Baileys
   - Verifique se há mensagens de ban ou bloqueio

---

## Logs e Debugging

### Ver logs do servidor

**Modo desenvolvimento:**
```bash
npm run dev
```
> Já ativa logs automáticos com nodemon

**Modo produção:**
```bash
npm start
```

**Docker:**
```bash
# Logs em tempo real
docker-compose logs -f

# Últimas 100 linhas
docker-compose logs --tail=100
```

---

### Habilitar logs detalhados do Baileys

Por padrão, os logs do Baileys estão em modo silencioso. Para ativar:

1. **Edite `src/config/baileys.js`:**
   ```javascript
   // Linha ~5
   const logger = pino({ level: 'info' }); // Alterar de 'silent' para 'info'
   ```

2. **Níveis de log disponíveis:**
   - `silent` - Sem logs (padrão)
   - `error` - Apenas erros
   - `warn` - Avisos e erros
   - `info` - Informações gerais
   - `debug` - Debug detalhado
   - `trace` - Máximo detalhe

3. **Reinicie o servidor:**
   ```bash
   npm start
   ```

---

### Debug de Conexão

**Verificar estado da conexão em tempo real:**

```javascript
// Adicione em src/config/baileys.js após o evento connection.update
console.log('Estado da conexão:', update);
```

**Testar endpoints manualmente:**

```bash
# Status
curl http://localhost:3000/api/status | jq

# QR Code
curl http://localhost:3000/api/qr | jq

# Fazer chamada
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999", "isVideo": false}' | jq
```

---

## Comandos Úteis

### Limpar tudo e recomeçar

```bash
# Parar servidor
# Ctrl+C (se estiver rodando)

# Limpar sessão WhatsApp
rm -rf auth_info_baileys/

# Limpar node_modules (opcional)
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Reiniciar
npm start
```

### Docker: Reset completo

```bash
# Parar e remover containers
docker-compose down -v

# Limpar imagens
docker-compose down --rmi all

# Rebuild e reiniciar
docker-compose up -d --build
```

---

## ❓ Não encontrou solução?

Se o seu problema não está listado aqui:

1. 🐛 [Abra uma issue no GitHub](https://github.com/seu-usuario/whatsapp-call-api/issues)
2. 💬 [Participe das discussões](https://github.com/seu-usuario/whatsapp-call-api/discussions)
3. 📖 [Consulte a documentação do Baileys](https://github.com/WhiskeySockets/Baileys)

**Ao reportar um problema, inclua:**
- Sistema operacional
- Versão do Node.js (`node --version`)
- Logs de erro completos
- Passos para reproduzir o problema

---

## 🔗 Links Úteis

- [Voltar para o README](../README.md)
- [Ver Exemplos de Uso](./EXAMPLES.md)
- [Documentação da API](../README.md#-documentação-da-api)

---

**Lembre-se**: A maioria dos problemas pode ser resolvida limpando a sessão (`rm -rf auth_info_baileys/`) e reconectando!
