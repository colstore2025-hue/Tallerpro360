// partsFraudDetector.js

export function detectarFraudeRepuestos(lista){

const alertas=[];

lista.forEach(p=>{

if(p.precio > 500000){

alertas.push({
tipo:"precio_alto",
repuesto:p.nombre
});

}

if(!p.compatible){

alertas.push({
tipo:"incompatible",
repuesto:p.nombre
});

}

});

return alertas;

}