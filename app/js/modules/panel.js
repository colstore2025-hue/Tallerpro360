/* ===============================
REGISTRAR MÓDULOS
=============================== */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagosTaller);
moduleLoader.register("ceo",ceo);

moduleLoader.register("aiassistant",aiAssistant);
moduleLoader.register("aiadvisor",aiAdvisor);

moduleLoader.register("configuracion",configuracion);
moduleLoader.register("reportes",reportes);

modulosPermitidos.forEach(nombre=>{

const key = nombre.toLowerCase();

const btn=document.createElement("button");

btn.textContent = key
.replace(/([A-Z])/g," $1")
.replace(/^./,c=>c.toUpperCase());

btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";
btn.style.padding="10px";
btn.style.background="#0f172a";
btn.style.border="1px solid #1e293b";
btn.style.color="white";
btn.style.cursor="pointer";
btn.style.borderRadius="6px";

btn.onclick=()=>moduleLoader.load(key,main,userId);

menu.appendChild(btn);

});