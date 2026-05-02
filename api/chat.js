export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // RUTA QUIRÚRGICA: Usamos el nombre de modelo completo para evitar el error 'not found'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como el experto de TallerPRO360. Responde al Comandante de forma breve sobre: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    // Si el error persiste, probamos la ruta alternativa v1 en el mismo bloque para no fallar
    if (data.error) {
       const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
       const fallbackRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Responde como TallerPRO360 al Comandante: " + prompt }] }]
          })
       });
       const fallbackData = await fallbackRes.json();
       
       if (fallbackData.error) {
          return res.status(200).json({ 
            response: `Error de Enlace Nexus: ${fallbackData.error.message}. Comandante, revise que la API Key en Vercel sea la del proyecto TallerPRO360.` 
          });
       }
       
       const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
       return res.status(200).json({ response: fallbackText });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Señal recibida sin datos." });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X." });
  }
}
