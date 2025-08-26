const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function callColombia() {
  try {
    console.log('📞 Iniciando llamada a Colombia...');
    
    const call = await client.calls.create({
      url: 'https://b1960c60b41d.ngrok-free.app/voice',
      to: '+573105334580',
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    console.log(`✅ Llamada iniciada: ${call.sid}`);
    console.log(`📱 Número destino: +573105334580`);
    console.log(`🤖 El agente Sofia te llamará en unos segundos...`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

callColombia();