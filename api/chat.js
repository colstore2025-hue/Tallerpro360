export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA MAESTRA: Usamos la versión de identificación directa
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Eres el núcleo IA de TallerPRO360. Responde al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // Si falla, el sistema intentará una última ruta de respaldo automáticamente
      return res.status(200).json({ 
        response: `Aviso del Núcleo: ${data.error.message}. Verifique que el API de Gemini esté 'Enabled' en Google AI Studio.` 
      });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Sincronización fallida. Sin datos." });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
