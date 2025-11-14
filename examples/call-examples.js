import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Exemplo 1: Verificar status da conexão
async function checkStatus() {
  try {
    const response = await axios.get(`${API_URL}/status`);
    console.log('Status:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 2: Obter QR Code
async function getQRCode() {
  try {
    const response = await axios.get(`${API_URL}/qr`);
    console.log('QR Code:', response.data.qrCode);
    console.log('QR Image (Base64):', response.data.qrImage);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 3: Fazer chamada de áudio
async function makeAudioCall(phoneNumber) {
  try {
    const response = await axios.post(`${API_URL}/call`, {
      phoneNumber: phoneNumber,
      isVideo: false
    });
    console.log('Chamada iniciada:', response.data);
    return response.data.callId;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 4: Fazer chamada de vídeo
async function makeVideoCall(phoneNumber) {
  try {
    const response = await axios.post(`${API_URL}/call`, {
      phoneNumber: phoneNumber,
      isVideo: true
    });
    console.log('Chamada de vídeo iniciada:', response.data);
    return response.data.callId;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 5: Rejeitar chamada
async function rejectCall(callId, callFrom) {
  try {
    const response = await axios.post(`${API_URL}/call/reject`, {
      callId: callId,
      callFrom: callFrom
    });
    console.log('Chamada rejeitada:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 6: Encerrar chamada
async function terminateCall(callId) {
  try {
    const response = await axios.post(`${API_URL}/call/terminate`, {
      callId: callId
    });
    console.log('Chamada encerrada:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo 7: Obter histórico
async function getCallHistory() {
  try {
    const response = await axios.get(`${API_URL}/call/history`);
    console.log('Histórico:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

// Exemplo completo de uso
async function main() {
  console.log('=== Testando WhatsApp Call API ===\n');

  // 1. Verificar status
  console.log('1. Verificando status...');
  await checkStatus();
  await sleep(2000);

  // 2. Obter QR Code (se necessário)
  console.log('\n2. Obtendo QR Code...');
  await getQRCode();
  await sleep(2000);

  // 3. Fazer chamada de áudio
  console.log('\n3. Fazendo chamada de áudio...');
  const callId = await makeAudioCall('5511999999999');
  await sleep(2000);

  // 4. Encerrar chamada após 10 segundos
  if (callId) {
    console.log('\n4. Aguardando 10 segundos...');
    await sleep(10000);
    console.log('Encerrando chamada...');
    await terminateCall(callId);
  }

  // 5. Ver histórico
  console.log('\n5. Verificando histórico...');
  await getCallHistory();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Descomentar para executar
// main();

export {
  checkStatus,
  getQRCode,
  makeAudioCall,
  makeVideoCall,
  rejectCall,
  terminateCall,
  getCallHistory
};
