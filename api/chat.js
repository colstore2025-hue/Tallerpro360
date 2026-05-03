export default async function handler(req, res) {
  // 1. PROTOCOLO DE SEGURIDAD: Solo permitimos transmisiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ response: "Acceso Denegado. Solo se permiten transmisiones seguras tipo POST." });
  }

  // 2. EXTRACCIÓN DE ENERGÍA: Clave API del entorno de Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ response: "Comandante, no se detectó ningún mensaje en la transmisión." });
  }

  // 3. NÚCLEO DE CONOCIMIENTO TALLERPRO360 (ADN del Sistema)
  const conocimientoMaestro = `
    IDENTIDAD Y TECNOLOGÍA:
    - TallerPRO360 es una PWA (Progressive Web App). No se descarga, se accede por link y se añade a la pantalla de inicio.
    - Sistema: Nodo Central Nexus-X Starlink con arquitectura en la nube.
    
    NICHOS Y ESPECIALIDADES:
    - Mecánica General: Control de preventivos y correctivos.
    - Latonería y Pintura: Recepción con evidencia fotográfica del estado inicial para evitar reclamos injustos.
    - Eléctrico y Mecatrónica: Registro de escaneos y fallas electrónicas.
    
    FUNCIONES CLAVE:
    - Órdenes de Servicio Digitales: Elimina el papel manchado de grasa.
    - Seguimiento en Tiempo Real: El cliente ve el avance desde su celular.
    - Inventario Inteligente: Control de stock para evitar fugas de dinero.
    - Historial Clínico: Hoja de vida completa por cada placa/vehículo.
    
    ESTRUCTURA DE PAGOS Y PLANES:
    - Sistema Boldsync: Pagos integrados con Bold (API pk_live).
    - Ciclos de Órbita: 1 Mes (Lunar), 3 Meses (Trimestre Estelar), 6 Meses (Semestre Galáctico), 12 Meses (Año Luz).
    - El plan 'Año Luz' (12 meses) ofrece el máximo ahorro.
    
    CONFIGURACIÓN (NXS_CONFIG):
    - Nodo Maestro centraliza todo. Cloud Master Line para WhatsApp. Neural Bold_Link para pagos digitales con cifrado grado militar.
  `;

  // 4. INSTRUCCIONES DE COMANDO (Personalidad del Agente)
  const systemPrompt = `
    Eres el Comandante de Ventas Senior de TallerPRO360. Tu objetivo es convertir dueños de talleres colombianos en usuarios de la plataforma.
    
    REGLAS DE ENGANCHE:
    - Usa un tono profesional pero cercano (Maestro, Jefe, Estimado).
    - Enfócate en el beneficio económico: 'Digitalizar tu taller es dejar de perder dinero por desorden'.
    - Si preguntan por instalación, destaca: 'No ocupa espacio, es un link y listo'.
    - Si preguntan por pagos, menciona la seguridad de 'Bold' y los 'Ciclos de Órbita'.
    
    CONOCIMIENTO DEL SISTEMA:
    ${conocimientoMaestro}
    
    PROTOCOLO DE CIERRE (CRÍTICO):
    - Si el usuario muestra interés real, pide una demo, pregunta precios específicos o deja su contacto, añade EXACTAMENTE la etiqueta [DISPARAR_N8N] al final de tu respuesta para activar la automatización.
  `;

  try {
    // 5. ENLACE CON EL SATÉLITE GEMINI (Uso de v1beta para máxima compatibilidad con Nivel Gratuito)
    const url = https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey};
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Confirmado. Sistemas de TallerPRO360 operativos. Estoy listo para comandar las ventas." }] },
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.95
        }
      })
    });

    const data = await response.json();

    // Gestión de errores de la API de Google
    if (data.error) {
      console.error("Error API Google:", data.error.message);
      return res.status(200).json({ 
        response: "Comandante, hay una interferencia en la red Nexus-X. Verifique su clave API y el estado del servidor." 
      });
    }

    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Señal recibida, pero el núcleo no emitió respuesta. Intente de nuevo.";

    // 6. FILTRO DE AUTOMATIZACIÓN (n8n Bridge)
    let triggerN8N = false;
    if (aiResponse.includes("[DISPARAR_N8N]")) {
      triggerN8N = true;
      aiResponse = aiResponse.replace("[DISPARAR_N8N]", "").trim();
      
      // LOG para monitoreo en el panel de Vercel
      console.log("LOG: Lead Caliente detectado. Señal de disparo n8n lista.");
      
      /* MAÑANA ACTIVAREMOS ESTO:
         await fetch('TU_URL_DE_N8N', {
           method: 'POST',
           body: JSON.stringify({
  contents: [{
    parts: [{ text: systemPrompt + "\n\nUsuario dice: " + prompt }]
  }]
})

    // 7. RESPUESTA FINAL AL USUARIO
    return res.status(200).json({ 
      response: aiResponse,
      automation_triggered: triggerN8N 
    });

  } catch (error) {
    console.error("Falla en el puente Nexus:", error);
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X. Reinicie el despliegue." });
  }
}
