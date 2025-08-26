const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const DENTAL_PROMPT = `
Eres Sofia, la asistente virtual de "Clínica Dental Sonrisa Perfecta" en Bogotá, Colombia. 
Eres muy amable, profesional y hablas ÚNICAMENTE en español colombiano.

INFORMACIÓN DE LA CLÍNICA:
- Horarios: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 2:00 PM
- Servicios: Limpieza dental ($50.000), Ortodoncia ($2.500.000), Implantes ($1.800.000), Blanqueamiento ($200.000), Endodoncia ($300.000)
- Ubicación: Carrera 15 #93-47, Chapinero, Bogotá
- WhatsApp: +57 310 456-7890
- Doctora principal: Dra. María González

INSTRUCCIONES IMPORTANTES:
1. SIEMPRE responde en español de Colombia
2. Saluda: "¡Hola! Soy Sofia de Clínica Dental Sonrisa Perfecta. ¿En qué le puedo ayudar?"
3. Para citas: Pregunta nombre completo, cédula, servicio, día preferido
4. Horarios disponibles: Mañanas 8-12, Tardes 2-6
5. Emergencias: "Para urgencias llame al WhatsApp +57 310 456-7890"
6. Respuestas máximo 30 palabras
7. Termina siempre: "¿Algo más en lo que le pueda ayudar?"

CRÍTICO: Responde SOLO en español colombiano, nunca en inglés.
`;

app.post('/voice', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  try {
    const userSpeech = req.body.SpeechResult || '';
    const callSid = req.body.CallSid;
    const callFrom = req.body.From || '';
    const callTo = req.body.To || '';
    
    console.log('='.repeat(60));
    console.log(`🔥 NUEVA INTERACCIÓN - ${new Date().toLocaleString()}`);
    console.log(`📞 CallSid: ${callSid}`);
    console.log(`📱 Desde: ${callFrom} → Hacia: ${callTo}`);
    console.log(`🎤 Usuario dijo: "${userSpeech}"`);
    console.log(`📊 Datos completos:`, JSON.stringify(req.body, null, 2));
    
    if (!userSpeech) {
      console.log('🤖 ENVIANDO SALUDO INICIAL');
      const saludoInicial = '¡Hola! Soy Sofia de Clínica Dental Sonrisa Perfecta en Bogotá. ¿En qué le puedo ayudar hoy?';
      
      twiml.say({
        voice: 'Polly.Lupe',
        language: 'es-MX'
      }, saludoInicial);
      
      console.log(`🔊 Sofia dice: "${saludoInicial}"`);
      
      twiml.gather({
        input: 'speech',
        language: 'es-CO',
        speechTimeout: '3',
        action: '/voice'
      });
      
    } else {
      console.log('🧠 CONSULTANDO OPENAI...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: DENTAL_PROMPT },
          { role: 'user', content: userSpeech }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      const aiResponse = completion.choices[0].message.content;
      console.log(`✅ OPENAI RESPONDIÓ: "${aiResponse}"`);
      console.log(`📊 Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
      
      twiml.say({
        voice: 'Polly.Lupe',
        language: 'es-MX'
      }, aiResponse);
      
      console.log(`🔊 Sofia responde: "${aiResponse}"`);
      
      twiml.gather({
        input: 'speech',
        language: 'es-CO',
        speechTimeout: '3',
        action: '/voice'
      });
    }
    
    console.log('📤 XML Generado:', twiml.toString());
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
    console.error('Stack:', error.stack);
    
    twiml.say({
      voice: 'Polly.Lupe',
      language: 'es-MX'
    }, 'Lo siento, tenemos problemas técnicos. Por favor llame más tarde.');
    
    console.log('🚨 Enviando mensaje de error técnico');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

app.get('/', (req, res) => {
  res.send(`
    <h1>🦷 Vozia - Agente Dental IA</h1>
    <p><strong>Estado:</strong> ✅ Funcionando</p>
    <p><strong>Número:</strong> ${process.env.TWILIO_PHONE_NUMBER}</p>
    <p><strong>Desde Colombia marque:</strong> 001 775 262 6247</p>
    <hr>
    <h3>Prueba desde Colombia:</h3>
    <ol>
      <li>Marca: <strong>001 775 262 6247</strong></li>
      <li>Habla cuando escuches a Sofia</li>
      <li>Pide una cita o información</li>
    </ol>
  `);
});

app.get('/voice', (req, res) => {
  res.send(`
    <h2>🎤 Endpoint de Voz</h2>
    <p>Este endpoint recibe llamadas de Twilio via POST</p>
    <p><strong>Estado:</strong> ✅ Listo para recibir llamadas</p>
    <p><strong>Método:</strong> POST (Twilio)</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📞 Número Twilio: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`🇨🇴 Desde Colombia: 001 775 262 6247`);
});
