import { getSocket } from '../config/baileys.js';

export async function makeCall(phoneNumber, isVideo = false) {
  const sock = getSocket();

  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  try {
    // Formatar número para JID
    const jid = phoneNumber.includes('@')
      ? phoneNumber
      : `${phoneNumber}@s.whatsapp.net`;

    // Oferecer chamada
    const callId = generateCallId();

    await sock.offerCall(jid, callId, isVideo);

    return {
      success: true,
      callId,
      to: jid,
      type: isVideo ? 'video' : 'audio',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao fazer chamada:', error);
    throw error;
  }
}

export async function rejectCall(callId, callFrom) {
  const sock = getSocket();

  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  try {
    await sock.rejectCall(callId, callFrom);
    return {
      success: true,
      callId,
      action: 'rejected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao rejeitar chamada:', error);
    throw error;
  }
}

export async function terminateCall(callId) {
  const sock = getSocket();

  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  try {
    await sock.terminateCall(callId);
    return {
      success: true,
      callId,
      action: 'terminated',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao encerrar chamada:', error);
    throw error;
  }
}

function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getCallHistory() {
  const sock = getSocket();

  if (!sock) {
    throw new Error('WhatsApp não está conectado');
  }

  // Baileys não armazena histórico de chamadas por padrão
  // Você precisaria implementar um sistema de armazenamento
  return {
    success: true,
    message: 'Histórico de chamadas não implementado',
    calls: []
  };
}
