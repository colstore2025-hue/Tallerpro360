export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // Usamos el modelo estable para evitar el error 404/403
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Responde como experto de TallerPRO360 al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ response: "Error de enlace: " + data.error.message });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin señal de datos.";
    return res.status(200).json({ response: aiText });

  } catch (error) {
    return res.status(500).json({ response: "Falla en el hardware Nexus-X." });
  }
}
