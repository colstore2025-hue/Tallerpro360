import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";


export function generarOrdenPDF(orden, empresa){

const doc = new jsPDF();


/* =========================
ENCABEZADO EMPRESA
========================= */

doc.setFontSize(18);

doc.text(empresa.nombre || "Taller Automotriz",20,20);

doc.setFontSize(10);

doc.text(empresa.direccion || "",20,28);

doc.text(empresa.telefono || "",20,34);


/* =========================
TITULO DOCUMENTO
========================= */

doc.setFontSize(16);

doc.text("ORDEN DE SERVICIO",140,20);


/* =========================
DATOS CLIENTE
========================= */

doc.setFontSize(12);

doc.text(`Cliente: ${orden.cliente}`,20,60);

doc.text(`Teléfono: ${orden.telefono || ""}`,20,70);

doc.text(`Vehículo: ${orden.vehiculo}`,20,80);

doc.text(`Placa: ${orden.placa}`,20,90);


/* =========================
TABLA ACCIONES
========================= */

let y = 110;

doc.text("Detalle del servicio:",20,y);

y+=10;

let total=0;

if(orden.acciones){

orden.acciones.forEach(a=>{

doc.text(
`${a.descripcion}  -  $${Number(a.costo).toLocaleString()}`,
20,
y
);

total+=Number(a.costo||0);

y+=10;

});

}


/* =========================
TOTAL
========================= */

y+=10;

doc.setFontSize(14);

doc.text(
`TOTAL: $${total.toLocaleString()}`,
20,
y
);


/* =========================
PIE
========================= */

doc.setFontSize(9);

doc.text(
"Documento generado por TallerPRO360",
20,
280
);


doc.save(`orden_${orden.placa}.pdf`);

}