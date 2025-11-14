# CLAUDE.md - WhatsApp Call API

## Project Overview

**WhatsApp Call API** is a REST API built with Node.js and Express that enables making WhatsApp voice and video calls programmatically using the Baileys library. This service provides endpoints to manage WhatsApp connections, initiate calls, and handle call events.

### Key Technologies
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18+
- **WhatsApp Library**: @whiskeysockets/baileys 6.7+
- **Module System**: ES Modules (`"type": "module"`)
- **Logging**: Pino
- **QR Code Generation**: qrcode, qrcode-terminal
- **Container**: Docker with docker-compose support

---

## Directory Structure

```
whatsapp-call-api/
├── src/
│   ├── config/
│   │   └── baileys.js          # WhatsApp connection & socket management
│   ├── routes/
│   │   └── callRoutes.js       # API endpoint definitions
│   ├── services/
│   │   └── callService.js      # Call business logic
│   └── index.js                # Express server entry point
├── examples/
│   ├── call-examples.js        # Usage examples with axios
│   ├── advanced-call.js        # Advanced call scenarios
│   └── webhook-handler.js      # Webhook integration example
├── auth_info_baileys/          # WhatsApp session storage (gitignored)
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore patterns
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Docker orchestration
├── package.json                # Dependencies & scripts
├── README.md                   # User documentation
└── test-api.sh                 # API testing script
```

---

## Architecture Overview

### Core Components

1. **Server Layer** (`src/index.js`)
   - Express application setup
   - Route registration
   - WhatsApp connection initialization
   - Runs on port 3000 (configurable via `PORT` env var)

2. **Configuration Layer** (`src/config/baileys.js`)
   - WhatsApp socket management
   - QR code generation and storage
   - Connection state tracking (`disconnected`, `qr`, `connected`, `reconnecting`)
   - Auto-reconnection logic
   - Authentication state persistence
   - Event listeners for connection updates, credentials, and calls

3. **Routes Layer** (`src/routes/callRoutes.js`)
   - RESTful endpoint definitions
   - Request validation
   - Error handling
   - Response formatting

4. **Service Layer** (`src/services/callService.js`)
   - Business logic for call operations
   - Call ID generation
   - Phone number formatting (JID conversion)
   - WhatsApp socket interaction

### Data Flow

```
Client Request → Express Router → Service Layer → Baileys Socket → WhatsApp
                    ↓                                                  ↓
                Response ← Format Response ← Process Result ← WhatsApp Response
```

---

## API Endpoints

### Connection Management

#### `GET /api/status`
Check WhatsApp connection status.

**Response:**
```json
{
  "connected": true,
  "state": "connected",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

#### `GET /api/qr`
Get QR code for WhatsApp authentication (only available when not connected).

**Response:**
```json
{
  "qrCode": "2@...",
  "qrImage": "data:image/png;base64,...",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

### Call Operations

#### `POST /api/call`
Initiate a voice or video call.

**Request Body:**
```json
{
  "phoneNumber": "5511999999999",
  "isVideo": false
}
```

**Response:**
```json
{
  "success": true,
  "callId": "call_1731582600000_abc123def",
  "to": "5511999999999@s.whatsapp.net",
  "type": "audio",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

#### `POST /api/call/reject`
Reject an incoming call.

**Request Body:**
```json
{
  "callId": "call_123",
  "callFrom": "5511999999999@s.whatsapp.net"
}
```

#### `POST /api/call/terminate`
Terminate an active call.

**Request Body:**
```json
{
  "callId": "call_123"
}
```

#### `GET /api/call/history`
Get call history (currently not implemented in storage).

---

## Code Conventions

### Module System
- **ALWAYS** use ES6 modules with `import/export` syntax
- **NEVER** use CommonJS (`require/module.exports`)
- All files use `.js` extension with ES module syntax
- Package.json includes `"type": "module"`

### Async/Await Pattern
```javascript
// ✅ CORRECT
export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();
  const jid = formatPhoneNumber(phoneNumber);
  await sock.offerCall(jid, callId, isVideo);
}

// ❌ INCORRECT - Don't use .then()/.catch() chains
export function makeCall(phoneNumber, isVideo = false) {
  return getSocket().offerCall(jid, callId, isVideo)
    .then(result => result)
    .catch(error => error);
}
```

### Error Handling
- Use try-catch blocks in async functions
- Log errors with `console.error()`
- Throw errors to be caught by route handlers
- Return structured error responses in routes

```javascript
// Service layer - throw errors
export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();
  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }
  // ... rest of implementation
}

// Route layer - catch and format errors
router.post('/call', async (req, res) => {
  try {
    const result = await makeCall(phoneNumber, isVideo);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao fazer chamada',
      message: error.message
    });
  }
});
```

### Phone Number Formatting
- Always convert phone numbers to JID format: `{number}@s.whatsapp.net`
- Check if already formatted before converting
- Format: `5511999999999@s.whatsapp.net` (country code + area + number + domain)

### Response Structure
All API responses should include:
- `success`: boolean (for successful operations)
- `timestamp`: ISO 8601 date string
- `error`: error type (for failed operations)
- `message`: human-readable message

---

## Development Workflows

### Initial Setup

1. **Clone and Install**
```bash
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env as needed
```

3. **Start Development Server**
```bash
npm run dev  # Uses nodemon for auto-reload
```

4. **Start Production Server**
```bash
npm start
```

### WhatsApp Authentication Flow

1. Start the server (`npm start` or `npm run dev`)
2. Server will print QR code to terminal
3. Call `GET /api/qr` to get QR code as image
4. Scan QR code with WhatsApp mobile app
5. Authentication credentials saved to `auth_info_baileys/` directory
6. Future runs will use saved credentials (no QR needed)

### Docker Deployment

**Build and Run:**
```bash
docker-compose up -d
```

**Important**: The `auth_info_baileys` directory is mounted as a volume to persist WhatsApp sessions across container restarts.

### Testing the API

Use the provided `test-api.sh` script or the examples in `examples/call-examples.js`:

```bash
# Check status
curl http://localhost:3000/api/status

# Make a call
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999", "isVideo": false}'
```

---

## Key Dependencies

### Production Dependencies

- **@whiskeysockets/baileys** (6.7.9): WhatsApp Web API library
  - Handles WebSocket connection to WhatsApp
  - Manages authentication and encryption
  - Provides call, message, and media APIs

- **express** (4.18.2): Web framework for API endpoints

- **pino** (8.19.0): Fast JSON logger (currently set to silent mode)

- **qrcode** (1.5.3): QR code generation for browser display

- **qrcode-terminal** (0.12.0): QR code display in terminal

### Development Dependencies

- **nodemon** (3.0.3): Auto-restart on file changes

---

## Important Notes for AI Assistants

### Baileys Library Specifics

1. **Socket Management**
   - Single global socket instance managed in `src/config/baileys.js`
   - Socket accessed via `getSocket()` function
   - Never create multiple socket instances

2. **Connection States**
   - `disconnected`: No connection
   - `qr`: QR code ready for scanning
   - `connected`: Authenticated and connected
   - `reconnecting`: Attempting to reconnect

3. **Event Listeners**
   - `connection.update`: Connection state changes, QR codes
   - `creds.update`: Save authentication credentials
   - `call`: Incoming call events

4. **Authentication Persistence**
   - Uses `useMultiFileAuthState('auth_info_baileys')`
   - Credentials stored in `auth_info_baileys/` directory
   - **NEVER** commit this directory to git (in .gitignore)

### Common Pitfalls to Avoid

1. **Module Imports**: Always use `.js` extension in imports
   ```javascript
   // ✅ CORRECT
   import { getSocket } from './config/baileys.js';

   // ❌ WRONG
   import { getSocket } from './config/baileys';
   ```

2. **Phone Number Format**: Don't forget JID conversion
   ```javascript
   // ✅ CORRECT
   const jid = phoneNumber.includes('@')
     ? phoneNumber
     : `${phoneNumber}@s.whatsapp.net`;

   // ❌ WRONG
   await sock.offerCall(phoneNumber, callId, isVideo);
   ```

3. **Socket Availability**: Always check if socket exists before use
   ```javascript
   // ✅ CORRECT
   const sock = getSocket();
   if (!sock) {
     throw new Error('WhatsApp não está conectado');
   }

   // ❌ WRONG
   const sock = getSocket();
   await sock.offerCall(...); // May crash if null
   ```

4. **Async/Await**: Don't forget await keyword
   ```javascript
   // ✅ CORRECT
   await sock.offerCall(jid, callId, isVideo);

   // ❌ WRONG
   sock.offerCall(jid, callId, isVideo); // Returns unhandled promise
   ```

### Security Considerations

1. **Environment Variables**: Never hardcode sensitive data
2. **Session Files**: `auth_info_baileys/` contains session tokens - keep secure
3. **Input Validation**: Always validate phone numbers and request parameters
4. **Rate Limiting**: Consider adding rate limiting for production use
5. **CORS**: Currently no CORS configuration - add if needed for web clients

### Future Enhancements to Consider

1. **Call History Storage**: Currently returns empty array - implement database storage
2. **Webhooks**: Add webhook support for call events (example in `examples/webhook-handler.js`)
3. **Rate Limiting**: Add express-rate-limit for API protection
4. **Authentication**: Add API key or JWT authentication
5. **Logging**: Enable and configure Pino logger (currently silent)
6. **Health Checks**: Add comprehensive health check endpoint
7. **Metrics**: Add call metrics and monitoring
8. **Database**: Implement persistent storage for call history and events

---

## Git Workflow

### Branch Strategy
- Development occurs on feature branches with `claude/` prefix
- Branch naming: `claude/claude-md-{session-id}`
- Always push to the designated feature branch, never to main/master

### Commit Messages
- Use Portuguese (project language)
- Be descriptive and concise
- Use emoji prefixes when they match project style (see git history)
- Example: `🚀 Adiciona endpoint para histórico de chamadas`

### Push Commands
```bash
git push -u origin <branch-name>
```

---

## Testing and Debugging

### Manual Testing
- Use `examples/call-examples.js` for comprehensive testing
- Use `test-api.sh` for quick API endpoint testing
- Check terminal output for QR codes and connection status

### Debugging Tips
1. Check connection state: `GET /api/status`
2. Monitor server console for Baileys events
3. Verify `auth_info_baileys/` directory exists and has files after first auth
4. Check Docker logs: `docker-compose logs -f`
5. Ensure WhatsApp mobile app is connected to internet during auth

### Common Issues

**Issue**: QR code endpoint returns 404
- **Cause**: Already authenticated or connection not in QR state
- **Solution**: Delete `auth_info_baileys/` directory and restart

**Issue**: Calls not working
- **Cause**: WhatsApp not connected
- **Solution**: Check `/api/status` and ensure state is "connected"

**Issue**: Module import errors
- **Cause**: Missing `.js` extension or wrong import syntax
- **Solution**: Use ES6 imports with `.js` extension

---

## Environment Variables

**Required**:
- `PORT`: Server port (default: 3000)
- `SESSION_NAME`: WhatsApp session identifier (default: whatsapp-call-session)

**Optional** (for future enhancements):
- Database credentials
- Webhook URLs
- API keys
- Logging levels

---

## Additional Resources

- **Baileys Documentation**: https://github.com/WhiskeySockets/Baileys
- **Express Documentation**: https://expressjs.com/
- **WhatsApp Business API**: Alternative for production use
- **Docker Documentation**: https://docs.docker.com/

---

## Summary for AI Assistants

When working with this codebase:

1. ✅ **DO**:
   - Use ES6 modules with `.js` extensions
   - Use async/await pattern consistently
   - Validate phone numbers and convert to JID format
   - Check socket availability before operations
   - Follow existing error handling patterns
   - Test endpoints with examples provided
   - Keep authentication files secure and gitignored

2. ❌ **DON'T**:
   - Use CommonJS syntax
   - Create multiple socket instances
   - Commit `auth_info_baileys/` or `.env` files
   - Skip input validation
   - Forget await keywords on async operations
   - Modify connection logic without understanding Baileys lifecycle

3. 🎯 **FOCUS AREAS**:
   - Maintain single socket instance pattern
   - Preserve connection state management
   - Keep response formats consistent
   - Follow Portuguese language for user-facing content
   - Ensure proper error handling in all routes

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
