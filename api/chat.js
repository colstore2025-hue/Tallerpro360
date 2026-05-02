export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA QUIRÚRGICA: gemini-1.5-flash es el estándar actual para v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como el experto de TallerPRO360. Responde al Comandante sobre: " + prompt }] }]
      })
    });

    const data = await response.json();

    // Captura de errores de Google
    if (data.error) {
      return res.status(200).json({ 
        response: `Aviso del Núcleo: ${data.error.message} (Por favor, verifique la clave en Vercel).` 
      });
    }

    // Extracción segura del texto
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ response: aiResponse });
    } else {
      return res.status(200).json({ response: "Conexión exitosa, pero el Núcleo no envió texto. Intente de nuevo, Comandante." });
    }

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
