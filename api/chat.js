export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // Intentamos con la versión estable 'v1' y el modelo flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Eres el experto técnico de TallerPRO360. Responde al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();

    // Si el satélite dice "not found", intentamos con el modelo 'gemini-pro' (el más compatible del mundo)
    if (data.error && data.error.message.includes("not found")) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
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
          response: `Alerta Final: ${fallbackData.error.message}. Comandante, asegúrese de que la clave en Vercel no tenga espacios extras.` 
        });
      }
      return res.status(200).json({ response: fallbackData.candidates?.[0]?.content?.parts?.[0]?.text });
    }

    return res.status(200).json({ response: data.candidates?.[0]?.content?.parts?.[0]?.text });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
