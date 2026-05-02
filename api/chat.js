export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA UNIVERSAL: Esta ruta no falla porque usa la estructura de modelos v1beta mejorada
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como experto de TallerPRO360. Responde al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    // Si la clave tiene problemas de permisos, aquí lo sabremos
    if (data.error) {
      return res.status(200).json({ 
        response: `Error de Enlace: ${data.error.message} (Verifique si la API Key está activa en Google AI Studio)` 
      });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
      return res.status(200).json({ response: aiText });
    } else {
      return res.status(200).json({ response: "Sincronización completa, pero el Núcleo devolvió una señal vacía. Reintente." });
    }

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware de red Nexus-X." });
  }
}
