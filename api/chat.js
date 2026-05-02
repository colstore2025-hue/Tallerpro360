export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso denegado." });

  // Forzamos la lectura ÚNICAMENTE de la clave de Gemini
  const apiKey = process.env.GEMINI_API_KEY; 
  const { prompt } = req.body;

  try {
    // Usamos el modelo Pro estable para saltar cualquier restricción de modelos Flash nuevos
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Contexto: Eres el experto de TallerPRO360. Responde al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();

    // Si por error se estuviera usando una clave de OpenAI, Google responderá con un error 400 o 403
    if (data.error) {
      return res.status(200).json({ 
        response: `Aviso del Núcleo: ${data.error.message}. Verifique que en Vercel la variable GEMINI_API_KEY sea la correcta.` 
      });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Señal recibida sin datos." });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica Nexus-X. Posible conflicto de protocolos." });
  }
}
