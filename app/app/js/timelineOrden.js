import { db } from "./firebase.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function cargarTimeline(ordenId, container){

const ref = doc(db,"ordenes",ordenId);

const snap = await getDoc(ref);

if(!snap.exists()){
container.innerHTML = "Orden no encontrada";
return;
}

const data = snap.data();

if(!data.acciones || data.acciones.length === 0){
container.innerHTML = "Sin acciones registradas";
return;
}

let html = `<div class="timeline">`;

data.acciones.forEach(a=>{

const fecha = new Date(a.fecha.seconds*1000).toLocaleString();

html+=`
<div class="border-l-4 border-blue-500 pl-4 mb-4">

<div class="text-sm text-gray-500">
${fecha}
</div>

<div class="font-semibold">
${a.descripcion}
</div>

<div class="text-xs text-gray-400">
Estado: ${a.estado}
</div>

</div>
`;

});

html+=`</div>`;

container.innerHTML = html;

}