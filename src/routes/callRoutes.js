import express from 'express';
import { makeCall, rejectCall, terminateCall, getCallHistory } from '../services/callService.js';
import { getConnectionState, getQRCode } from '../config/baileys.js';
import QRCode from 'qrcode';

const router = express.Router();

// Status da conexão
router.get('/status', (req, res) => {
  const state = getConnectionState();
  res.json({
    connected: state === 'connected',
    state,
    timestamp: new Date().toISOString()
  });
});

// Obter QR Code
router.get('/qr', async (req, res) => {
  const qr = getQRCode();

  if (!qr) {
    return res.status(404).json({
      error: 'QR Code não disponível',
      message: 'WhatsApp já está conectado ou aguardando conexão'
    });
  }

  try {
    const qrImage = await QRCode.toDataURL(qr);
    res.json({
      qrCode: qr,
      qrImage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao gerar QR Code',
      message: error.message
    });
  }
});

// Fazer chamada
router.post('/call', async (req, res) => {
  const { phoneNumber, isVideo } = req.body;

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
    const result = await makeCall(phoneNumber, isVideo);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao fazer chamada',
      message: error.message
    });
  }
});

// Rejeitar chamada
router.post('/call/reject', async (req, res) => {
  const { callId, callFrom } = req.body;

  if (!callId || !callFrom) {
    return res.status(400).json({
      error: 'callId e callFrom são obrigatórios'
    });
  }

  try {
    const result = await rejectCall(callId, callFrom);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao rejeitar chamada',
      message: error.message
    });
  }
});

// Encerrar chamada
router.post('/call/terminate', async (req, res) => {
  const { callId } = req.body;

  if (!callId) {
    return res.status(400).json({
      error: 'callId é obrigatório'
    });
  }

  try {
    const result = await terminateCall(callId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao encerrar chamada',
      message: error.message
    });
  }
});

// Histórico de chamadas
router.get('/call/history', async (req, res) => {
  try {
    const result = await getCallHistory();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao obter histórico',
      message: error.message
    });
  }
});

export default router;
