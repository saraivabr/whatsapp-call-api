import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

class WhatsAppCallClient {
  constructor(apiUrl = API_URL) {
    this.apiUrl = apiUrl;
    this.activeCalls = new Map();
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao verificar conexão: ${error.message}`);
    }
  }

  async waitForConnection(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkConnection();
      if (status.connected) {
        console.log('✅ WhatsApp conectado!');
        return true;
      }
      console.log(`⏳ Aguardando conexão... (${i + 1}/${maxAttempts})`);
      await this.sleep(2000);
    }
    throw new Error('Timeout aguardando conexão');
  }

  async makeCall(phoneNumber, options = {}) {
    const { isVideo = false, duration = 30000 } = options;

    try {
      const response = await axios.post(`${this.apiUrl}/call`, {
        phoneNumber,
        isVideo
      });

      const callData = response.data;
      this.activeCalls.set(callData.callId, {
        ...callData,
        startTime: Date.now()
      });

      console.log(`📞 Chamada iniciada: ${callData.callId}`);

      // Auto-encerrar após duração especificada
      if (duration > 0) {
        setTimeout(async () => {
          await this.terminateCall(callData.callId);
        }, duration);
      }

      return callData;
    } catch (error) {
      throw new Error(`Erro ao fazer chamada: ${error.message}`);
    }
  }

  async terminateCall(callId) {
    try {
      const response = await axios.post(`${this.apiUrl}/call/terminate`, {
        callId
      });

      const callData = this.activeCalls.get(callId);
      if (callData) {
        const duration = Date.now() - callData.startTime;
        console.log(`⏱️ Chamada encerrada após ${duration}ms`);
        this.activeCalls.delete(callId);
      }

      return response.data;
    } catch (error) {
      throw new Error(`Erro ao encerrar chamada: ${error.message}`);
    }
  }

  async makeScheduledCall(phoneNumber, delay, options = {}) {
    console.log(`⏰ Chamada agendada para daqui ${delay}ms`);
    await this.sleep(delay);
    return await this.makeCall(phoneNumber, options);
  }

  async makeMultipleCalls(phoneNumbers, options = {}) {
    const { interval = 2000 } = options;
    const results = [];

    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.makeCall(phoneNumber, options);
        results.push({ phoneNumber, success: true, data: result });
        console.log(`✅ Chamada para ${phoneNumber} iniciada`);
      } catch (error) {
        results.push({ phoneNumber, success: false, error: error.message });
        console.log(`❌ Erro ao chamar ${phoneNumber}: ${error.message}`);
      }

      if (interval > 0) {
        await this.sleep(interval);
      }
    }

    return results;
  }

  async terminateAllCalls() {
    const promises = Array.from(this.activeCalls.keys()).map(callId =>
      this.terminateCall(callId)
    );
    return await Promise.all(promises);
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exemplos de uso
async function examples() {
  const client = new WhatsAppCallClient();

  try {
    // Exemplo 1: Verificar conexão
    console.log('\n=== Exemplo 1: Verificar Conexão ===');
    await client.waitForConnection();

    // Exemplo 2: Chamada simples
    console.log('\n=== Exemplo 2: Chamada Simples ===');
    const call1 = await client.makeCall('5511999999999', {
      isVideo: false,
      duration: 10000 // Encerra após 10 segundos
    });

    // Exemplo 3: Chamada agendada
    console.log('\n=== Exemplo 3: Chamada Agendada ===');
    await client.makeScheduledCall('5511888888888', 5000, {
      isVideo: false,
      duration: 15000
    });

    // Exemplo 4: Múltiplas chamadas
    console.log('\n=== Exemplo 4: Múltiplas Chamadas ===');
    const phoneNumbers = [
      '5511111111111',
      '5511222222222',
      '5511333333333'
    ];
    const results = await client.makeMultipleCalls(phoneNumbers, {
      isVideo: false,
      interval: 3000, // 3 segundos entre chamadas
      duration: 20000
    });

    console.log('\nResultados:', results);

    // Exemplo 5: Ver chamadas ativas
    console.log('\n=== Exemplo 5: Chamadas Ativas ===');
    const activeCalls = client.getActiveCalls();
    console.log('Chamadas ativas:', activeCalls);

    // Aguardar um pouco
    await client.sleep(5000);

    // Exemplo 6: Encerrar todas as chamadas
    console.log('\n=== Exemplo 6: Encerrar Todas ===');
    await client.terminateAllCalls();

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Descomentar para executar
// examples();

export default WhatsAppCallClient;
