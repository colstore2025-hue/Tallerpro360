import { diagnosticarProblema } from "../js/iaMecanica.js";

export function ia(container){

container.innerHTML = `

<h1 class="text-2xl font-bold mb-6">
IA Mecánica
</h1>

<input
id="inputProblema"
class="border p-2 w-full mb-4"
placeholder="Ej: ruido en motor Toyota Hilux"
/>

<button
id="btnDiagnosticar"
class="bg-blue-600 text-white px-4 py-2 rounded">
Diagnosticar
</button>

<div
id="resultadoIA"
class="mt-6 bg-white p-4 rounded shadow">
Esperando diagnóstico...
</div>

`;

document.getElementById("btnDiagnosticar")
.onclick = async ()=>{

const texto = document.getElementById("inputProblema").value;

const respuesta = await diagnosticarProblema(texto);

document.getElementById("resultadoIA").innerText = respuesta;

};

}