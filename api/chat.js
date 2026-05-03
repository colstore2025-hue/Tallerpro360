export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  // INYECCIÓN DE CONOCIMIENTO MAESTRO (Data de TallerPRO360)
  const conocimientoMaestro = `
    IDENTIDAD: TallerPRO360 es una PWA (no requiere descarga, acceso por link).
    NICHOS: Mecánica, Latonería (fotos iniciales clave), Eléctrico/Mecatrónica (escaneos).
    SISTEMA: Nodo Central Nexus-X Starlink.
    FUNCIONES: Órdenes digitales, Seguimiento en tiempo real por el cliente, Inventario Inteligente, Historial Clínico por Placa.
    PAGOS: Integración Bold (Boldsync/API Key pk_live), Ciclos de Órbita (Lunar 1m, Trimestre 3m, Semestre 6m, Año Luz 12m).
    TERMINOLOGÍA: Nodo Maestro, NXS_CONFIG, Cloud Master Line, Neural Bold_Link.
    TONO: Profesional, colombiano ("Maestro", "Jefe"), enfocado en rentabilidad y evitar "fugas de capital".
  `;

  const systemPrompt = `
    Eres el Comandante de Ventas de TallerPRO360. Tu misión es convertir dueños de talleres en usuarios de la plataforma.
    CONTEXTO TÉCNICO: ${conocimientoMaestro}
    
    INSTRUCCIONES DE COMPORTAMIENTO:
    1. Si el cliente tiene dudas sobre el pago, explica el 'Neural Bold_Link' y el cifrado grado militar.
    2. Si es de Latonería, destaca la 'Recepción con Evidencia' para evitar reclamos.
    3. Si pregunta por instalación, aclara que es PWA: 'No ocupa espacio, se añade al inicio y listo'.
    
    LOGICA DE CIERRE: 
    - Si el usuario pregunta precios, menciona los 'Ciclos de Órbita' y recomienda el 'Año Luz' por ahorro.
    - IMPORTANTE: Si el usuario muestra intención clara de compra o pide el link de pago/demo, escribe al final de tu respuesta: [DISPARAR_N8N].
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Sistemas en línea. El agente de TallerPRO360 está listo para el despliegue." }] },
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "El satélite no responde, intente de nuevo.";

    // FILTRO INTELIGENTE PARA n8n
    if (aiResponse.includes("[DISPARAR_N8N]")) {
      aiResponse = aiResponse.replace("[DISPARAR_N8N]", "").trim();
      
      // Aquí se enviará a n8n cuando lo tengamos listo
      console.log("LOG: Lead Caliente Detectado. Preparando envío a n8n...");
    }

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
