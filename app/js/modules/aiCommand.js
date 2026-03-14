/**
 * aiCommand.js
 * AI Command Center
 * Control del ERP mediante comandos
 */

import AICommandCenter from "../ai/aiCommandCenter.js"

const ai = new AICommandCenter()

export function aiCommand(container){

container.innerHTML = `

<h1 style="font-size:26px;margin-bottom:20px;">
🤖 AI Command Center
</h1>

<div class="card">

<p style="color:#94a3b8;">
Controla el ERP escribiendo comandos.
</p>

<input
id="aiInput"
placeholder="Ej: ver inventario"
style="
width:100%;
padding:12px;
margin-top:10px;
border-radius:8px;
border:1px solid #334155;
background:#020617;
color:white;
"
/>

<button
id="aiRun"
style="
margin-top:10px;
padding:10px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
"
>
Ejecutar
</button>

</div>

<div id="aiResponse" style="margin-top:20px;"></div>

`

initAICommand()

}


function initAICommand(){

const btn = document.getElementById("aiRun")

if(!btn) return

btn.onclick = ()=>{

const input = document.getElementById("aiInput")

const text = input.value.trim()

if(!text){

alert("Escribe un comando")
return

}

const module = ai.processCommand(text)

const response = document.getElementById("aiResponse")

if(!module){

response.innerHTML = `
<div class="card">
❌ Comando no reconocido
</div>
`
return

}

response.innerHTML = `
<div class="card">
🧠 Ejecutando comando...
</div>
`

ai.execute(text)

}

}