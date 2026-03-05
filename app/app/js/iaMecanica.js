export async function diagnosticoIA(texto){

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

try{

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
{
role:"system",
content:"Eres un mecánico experto en diagnóstico automotriz."
},
{
role:"user",
content:prompt
}
],
temperature:0.3
})
});

const data = await respuesta.json();

return data.choices[0].message.content;

}catch(error){

console.error(error);

return "No se pudo obtener diagnóstico de IA.";

}

}