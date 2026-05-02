export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Denegado" });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // Usamos el modelo flash si el pro está bloqueado por la clave default
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Responde como el sistema TallerPRO360 al Comandante: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    // Si hay un error de cuota o clave, Google lo dirá aquí
    if (data.error) {
      return res.status(200).json({ response: `Sincronización fallida: ${data.error.message}` });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta del núcleo.";
    return res.status(200).json({ response: aiText });

  } catch (error) {
    return res.status(500).json({ response: "Falla total de enlace Nexus-X." });
  }
}
