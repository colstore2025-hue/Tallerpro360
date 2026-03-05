export async function diagnosticoIA(texto){

const API_KEY = "TU_API_KEY";

const prompt = `
Eres un mecánico experto.

Analiza este problema:

"${texto}"

Devuelve posibles causas mecánicas en lista corta.
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
{role:"user",content:prompt}
],
temperature:0.3
})
});

const data = await respuesta.json();

return data.choices[0].message.content;

}