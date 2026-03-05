export async function detectarRepuestos(descripcion){

const API_KEY = "TU_API_KEY";

const prompt = `
Eres un mecánico experto.

Analiza esta descripción de falla:

"${descripcion}"

Devuelve en JSON:

{
"diagnostico":"",
"repuestos":[
{"nombre":"","prioridad":"alta/media/baja"}
],
"acciones":[]
}

Solo responde JSON.
`;

const respuesta = await fetch(
"https://api.openai.com/v1/chat/completions",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+API_KEY
},
body:JSON.stringify({
model:"gpt-4o-mini",
messages:[
{role:"user",content:prompt}],
temperature:0.2
})
});

const data = await respuesta.json();

return JSON.parse(data.choices[0].message.content);

}