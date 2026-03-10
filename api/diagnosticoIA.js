// /api/diagnosticoIA.js
// Endpoint seguro para diagnóstico IA TallerPRO360

export default async function handler(req, res){

if(req.method !== "POST"){
return res.status(405).json({ error:"Método no permitido" });
}

try{

const { prompt } = req.body;

if(!prompt){
return res.status(400).json({ error:"Prompt requerido" });
}

const response = await fetch(
"https://api.openai.com/v1/chat/completions",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
},
body:JSON.stringify({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:"Eres un mecánico automotriz experto con más de 25 años de experiencia en diagnóstico."
},
{
role:"user",
content:prompt
}
],

temperature:0.2

})

}
);

const data = await response.json();

if(!data.choices || !data.choices.length){
throw new Error("Respuesta OpenAI inválida");
}

let contenido = data.choices[0].message.content || "";

/* limpiar posibles bloques ```json */

contenido = contenido
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();

const resultado = JSON.parse(contenido);

return res.status(200).json(resultado);

}
catch(error){

console.error("Error diagnóstico IA:",error);

return res.status(500).json({

diagnostico:"No se pudo generar diagnóstico automático",
repuestos:[],
acciones:[]

});

}

}