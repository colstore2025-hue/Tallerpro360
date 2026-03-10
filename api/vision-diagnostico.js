/**
 * vision-diagnostico.js
 * API Serverless para análisis de motores con IA
 * TallerPRO360
 */

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Imagen no enviada" });
    }

    const prompt = `
Analiza esta imagen de un motor automotriz.

Detecta:

- fugas de aceite
- piezas desgastadas
- mangueras dañadas
- corrosión

Devuelve SOLO JSON con esta estructura:

{
  "problemas":[
    {"tipo":"","descripcion":"","gravedad":""}
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },

      body: JSON.stringify({

        model: "gpt-4.1",

        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],

        max_tokens: 500

      })

    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {

    console.error("Error en diagnóstico IA:", error);

    return res.status(500).json({
      error: "Error analizando imagen"
    });

  }

}