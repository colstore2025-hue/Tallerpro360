export default async function handler(req, res) {
  // Solo permitimos tráfico POST (desde su chat)
  if (req.method !== 'POST') {
    return res.status(405).json({ response: "Acceso Denegado. Solo se permiten transmisiones POST." });
  }

  // 1. Extracción de energía del núcleo (Clave de Nivel Gratuito)
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // 2. RUTA DE COMUNICACIÓN: Usamos v1beta y el modelo Flash 1.5
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Eres el experto técnico de TallerPRO360. Responde al Comandante de forma profesional y concisa: " + prompt }]
        }]
      })
    });

    const data = await response.json();

    // 3. Gestión de Errores del Satélite
    if (data.error) {
      return res.status(200).json({ 
        response: `Aviso del Núcleo: ${data.error.message}. Comandante, verifique que la nueva clave esté activa en AI Studio.` 
      });
    }

    // 4. Entrega de la respuesta al puente de mando
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
      return res.status(200).json({ response: aiText });
    } else {
      return res.status(200).json({ response: "Señal recibida, pero el núcleo no emitió respuesta. Intente de nuevo." });
    }

  } catch (error) {
    console.error("Falla en el puente:", error);
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X. Reinicie el despliegue." });
  }
}
