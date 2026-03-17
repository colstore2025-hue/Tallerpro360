export async function generarSugerencias(contexto={}){ 
  return [
    {tipo:"gerencial", mensaje:"Revisar inventario", accion:"ver_inventario"}
  ];
}
export function renderSugerencias(containerId,sugerencias=[]){
  const container=document.getElementById(containerId);
  if(!container) return;
  if(!sugerencias.length){container.innerHTML="<div>✅ Sin sugerencias</div>";return;}
  container.innerHTML=sugerencias.map(s=>`<div style="background:#111;padding:10px;margin:10px 0;border-radius:8px;">
    <p>${s.mensaje}</p>
    <button onclick="alert('Aplicar')">✔ Aplicar</button>
  </div>`).join("");
}
export async function init(){console.log("AI Advisor listo");}