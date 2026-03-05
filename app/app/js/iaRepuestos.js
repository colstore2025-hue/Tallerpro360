export async function detectarRepuestos(descripcion){

  const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

  const prompt = `
Eres un mecánico experto en diagnóstico automotriz.

Analiza la siguiente descripción de falla:

"${descripcion}"

Devuelve SOLO JSON válido con esta estructura:

{
  "diagnostico": "explicación corta del problema",
  "repuestos": [
    {"nombre":"", "prioridad":"alta"},
    {"nombre":"", "prioridad":"media"}
  ],
  "acciones": [
    "acción recomendada 1",
    "acción recomendada 2"
  ]
}

No agregues texto fuera del JSON.
`;

  try {

    const respuesta = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      }
    );

    if(!respuesta.ok){
      throw new Error("Error en API OpenAI");
    }

    const data = await respuesta.json();

    if(!data.choices || !data.choices.length){
      throw new Error("Respuesta IA inválida");
    }

    let contenido = data.choices[0].message.content;

    // limpiar posibles bloques ```json
    contenido = contenido
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim();

    const resultado = JSON.parse(contenido);

    return resultado;

  } catch(error){

    console.error("Error IA repuestos:", error);

    return {
      diagnostico: "No se pudo generar diagnóstico IA",
      repuestos: [],
      acciones: []
    };

  }

}