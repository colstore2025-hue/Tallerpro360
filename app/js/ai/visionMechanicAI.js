/**
 * visionMechanicAI.js
 * IA de visión para diagnóstico mecánico
 * TallerPRO360
 */

/* ===============================
   ANALIZAR MOTOR CON IA
=============================== */

export async function analizarMotor(base64Image, apiKey){

  if(!base64Image){
    console.warn("Imagen no enviada");
    return null;
  }

  if(!apiKey){
    console.error("API Key de OpenAI no definida");
    return null;
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

  try{

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer " + apiKey
        },

        body:JSON.stringify({

          model:"gpt-4.1",

          messages:[
            {
              role:"user",
              content:[
                { type:"text", text: prompt },
                { type:"image_url", image_url:{ url: base64Image } }
              ]
            }
          ],

          max_tokens:500

        })
      }
    );

    const data = await response.json();

    if(!data.choices){
      console.error("Respuesta inesperada IA:", data);
      return null;
    }

    const content = data.choices[0].message.content;

    try{
      return JSON.parse(content);
    }
    catch(e){
      console.warn("Respuesta no es JSON puro:", content);
      return { raw: content };
    }

  }
  catch(error){

    console.error("Error analizando motor:", error);
    return null;

  }

}