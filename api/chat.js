export default async function handler(req, res) {
  // 1. Protocolo de seguridad de entrada
  if (req.method !== 'POST') {
    return res.status(405).json({ response: "Acceso denegado: Método no permitido." });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ response: "Error crítico: Enlace de energía (API Key) no detectado." });
    }

    // 2. Endpoint de Transmisión (Gemini 1.5 Pro)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    // 3. Matriz de Contexto TallerPRO360 (Estilo Comandante)
    const contextoNexus = `
      IDENTIDAD: Eres el Núcleo IA de TallerPRO360.
      MISIÓN: Asesoría técnica y comercial para talleres automotrices en Colombia.
      TECNOLOGÍA: PWA (Sin descarga), Sincronización Starlink, Gestión Aeroespacial.
      TONO: Profesional, tecnológico, respetuoso. Dirígete siempre como 'Comandante' o 'Jefe'.
      RESTRICCIÓN: Respuestas concisas y directas. No menciones que eres una IA de Google.
    `;

    // 4. Ejecución de Sincronización
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `${contextoNexus}\nCOMANDANTE DICE: ${prompt}` }] 
        }],
        // Ajuste de seguridad para evitar bloqueos por falsos positivos
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    // 5. Extracción y Verificación de Datos
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ response: aiResponse });
    } 
    
    // Si la IA bloquea la respuesta por alguna palabra sensible del usuario
    if (data.promptFeedback?.blockReason) {
      return res.status(200).json({ response: "Comandante, el sistema detectó contenido restringido en la consulta. Por favor, reformule su instrucción técnica." });
    }

    console.error("Fallo en estructura de datos:", JSON.stringify(data));
    return res.status(500).json({ response: "Sincronización inestable. El Núcleo no pudo procesar los datos. Intente de nuevo." });

  } catch (error) {
    console.error("Error en Servidor Nexus:", error);
    return res.status(500).json({ response: "Interrupción total en el enlace Nexus-X. Verifique consola." });
  }
}
