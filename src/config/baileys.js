import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeInMemoryStore,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';

const logger = pino({ level: 'silent' });
const store = makeInMemoryStore({ logger });

let sock;
let qrCode = null;
let connectionState = 'disconnected';

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    logger,
    printQRInTerminal: true,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
  });

  store?.bind(sock.ev);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionState = 'qr';
      console.log('QR Code gerado');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true;

      console.log('Conexão fechada:', lastDisconnect?.error, 'Reconectando:', shouldReconnect);

      if (shouldReconnect) {
        connectionState = 'reconnecting';
        await connectToWhatsApp();
      } else {
        connectionState = 'disconnected';
      }
    } else if (connection === 'open') {
      connectionState = 'connected';
      qrCode = null;
      console.log('Conectado ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('call', async (callData) => {
    console.log('Chamada recebida:', callData);
  });

  return sock;
}

export function getSocket() {
  return sock;
}

export function getQRCode() {
  return qrCode;
}

export function getConnectionState() {
  return connectionState;
}
