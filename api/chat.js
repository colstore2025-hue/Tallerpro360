export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA UNIVERSAL: gemini-pro en v1 es la frecuencia más estable de Google
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Contexto: Eres el experto de TallerPRO360. Responde al Comandante sobre: " + prompt }] }]
      })
    });

    const data = await response.json();

    // Captura de error de autenticación o modelo
    if (data.error) {
      return res.status(200).json({ 
        response: `Alerta Nexus: ${data.error.message}. Comandante, revise si la API Key de TallerPRO360 está bien pegada en Vercel.` 
      });
    }

    // Extracción de datos
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
      return res.status(200).json({ response: aiText });
    } else {
      return res.status(200).json({ response: "Enlace activo, pero el Núcleo no emitió datos. Reintente el comando." });
    }

  } catch (error) {
    return res.status(500).json({ response: "Falla de hardware en el puente Nexus-X." });
  }
}
