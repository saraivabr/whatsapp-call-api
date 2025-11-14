import express from 'express';
import { connectToWhatsApp } from './config/baileys.js';
import callRoutes from './routes/callRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rotas
app.use('/api', callRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Call API',
    version: '1.0.0',
    endpoints: {
      status: 'GET /api/status',
      qr: 'GET /api/qr',
      makeCall: 'POST /api/call',
      rejectCall: 'POST /api/call/reject',
      terminateCall: 'POST /api/call/terminate',
      history: 'GET /api/call/history'
    }
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Conectando ao WhatsApp...`);

  try {
    await connectToWhatsApp();
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
  }
});
