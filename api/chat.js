export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA CON NOMBRE DE RECURSO COMPLETO
    // Esto evita que Google diga "not found" porque usamos el identificador global
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Eres el experto técnico de TallerPRO360. Responde al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();

    // Si vuelve a fallar el nombre, el sistema intentará automáticamente el modelo 'gemini-pro'
    if (data.error && data.error.message.includes("not found")) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Responde como TallerPRO360: " + prompt }] }]
        })
      });
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData.error) {
        return res.status(200).json({ 
          response: `Error de Sistema: ${fallbackData.error.message}. Comandante, revise si la API KEY en Vercel tiene espacios o comillas adicionales.` 
        });
      }
      
      return res.status(200).json({ response: fallbackData.candidates?.[0]?.content?.parts?.[0]?.text });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Señal recibida pero vacía." });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
