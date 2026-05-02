export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA MAESTRA: gemini-1.5-flash es el modelo más compatible y veloz actualmente
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como el Núcleo IA de TallerPRO360. Responde al Comandante de forma técnica y profesional sobre: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ 
        response: `Error de Sincronización: ${data.error.message}. Comandante, verifique que la nueva clave esté activa.` 
      });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
      return res.status(200).json({ response: aiText });
    } else {
      return res.status(200).json({ response: "Enlace establecido, pero la señal de datos es nula. Reintente el comando." });
    }

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X. Reinicie el sistema." });
  }
}
