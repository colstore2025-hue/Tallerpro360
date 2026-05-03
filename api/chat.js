export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  // Pegue aquí la CLAVE NUEVA directamente para probar, o asegúrese de cambiarla en Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // Usamos la ruta más sencilla del mundo para Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Eres el experto de TallerPRO360. Responde breve: " + prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        response: `Error Final: ${data.error.message}. Comandante, la única opción es usar una clave generada en un 'Nuevo Proyecto' dentro de AI Studio.` 
      });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "El núcleo no responde." });

  } catch (error) {
    return res.status(500).json({ response: "Falla total del sistema Nexus-X." });
  }
}
