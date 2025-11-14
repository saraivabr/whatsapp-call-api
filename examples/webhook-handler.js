import express from 'express';

const app = express();
const PORT = 4000;

app.use(express.json());

// Webhook para receber eventos de chamadas
app.post('/webhook/call', (req, res) => {
  const event = req.body;

  console.log('📞 Evento de chamada recebido:', event);

  switch (event.type) {
    case 'call.incoming':
      console.log(`Chamada recebida de ${event.from}`);
      // Lógica para chamada recebida
      break;

    case 'call.accepted':
      console.log(`Chamada aceita: ${event.callId}`);
      // Lógica para chamada aceita
      break;

    case 'call.rejected':
      console.log(`Chamada rejeitada: ${event.callId}`);
      // Lógica para chamada rejeitada
      break;

    case 'call.ended':
      console.log(`Chamada encerrada: ${event.callId}`);
      console.log(`Duração: ${event.duration}s`);
      // Lógica para chamada encerrada
      break;

    case 'call.missed':
      console.log(`Chamada perdida de ${event.from}`);
      // Lógica para chamada perdida
      break;

    default:
      console.log('Tipo de evento desconhecido:', event.type);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🎣 Webhook handler rodando na porta ${PORT}`);
  console.log(`Configure o endpoint: http://localhost:${PORT}/webhook/call`);
});
