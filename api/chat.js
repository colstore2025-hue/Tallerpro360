export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY; // La clave terminada en Kk ya configurada en Vercel
  const { prompt } = req.body;

  // 1. INYECCIÓN DE CONOCIMIENTO (Aquí iría el resumen de conocimiento_taller.txt)
  const conocimientoTaller = `
    TallerPRO360 es un ecosistema SaaS para talleres mecánicos. 
    Beneficios: Automatización de ventas, Marketing Hub, gestión de inventarios y CRM.
    Diseño: Estética premium (Naranja/Negro), tipografía Space Grotesk.
    Integraciones: Webhooks para Make.com o n8n para disparar WhatsApp.
    Objetivo: Convertir al dueño del taller mostrando que la app se paga sola.
  `;

  const systemPrompt = `
    Eres el Agente de Ventas Senior de TallerPRO360. 
    Usa este conocimiento para responder: ${conocimientoTaller}
    
    REGLA CRÍTICA: Si el usuario muestra interés real (pregunta precios, pide demo o deja su contacto), 
    añade al final de tu respuesta la etiqueta secreta: [DISPARAR_WEBHOOK].
    Si solo está curioseando, no la pongas.
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Entendido. Estoy listo para vender TallerPRO360 y detectar leads calientes." }] },
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    });

    const data = await response.json();
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 2. LÓGICA DE AUTOMATIZACIÓN (El filtro inteligente)
    if (aiResponse.includes("[DISPARAR_WEBHOOK]")) {
      aiResponse = aiResponse.replace("[DISPARAR_WEBHOOK]", "");
      
      // Aquí conectaremos con n8n en el futuro
      console.log("Lead detectado. Enviando señal a n8n...");
      /* fetch('TU_URL_N8N', { 
        method: 'POST', 
        body: JSON.stringify({ lead: prompt, fecha: new Date() }) 
      });
      */
    }

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    return res.status(500).json({ response: "Error de enlace con el satélite Nexus-X." });
  }
}
