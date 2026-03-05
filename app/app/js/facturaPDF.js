import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export function generarFactura(orden, tallerNombre = "Taller del Cliente") {

const doc = new jsPDF();

let y = 20;

/* --------------------------
ENCABEZADO
---------------------------*/

doc.setFont("helvetica","bold");
doc.setFontSize(18);
doc.text(tallerNombre,20,y);

y += 8;

doc.setFontSize(10);
doc.setFont("helvetica","normal");
doc.text("Sistema de gestión automotriz",20,y);

y += 6;

doc.setFontSize(9);
doc.text("Generado con TallerPRO360",20,y);

y += 10;

doc.line(20,y,190,y);

y += 10;


/* --------------------------
DATOS DEL CLIENTE
---------------------------*/

doc.setFontSize(12);

doc.text(`Cliente: ${orden.cliente || "N/A"}`,20,y);
y += 8;

doc.text(`Vehículo: ${orden.vehiculo || "N/A"}`,20,y);
y += 8;

doc.text(`Placa: ${orden.placa || "N/A"}`,20,y);
y += 8;

doc.text(`Fecha: ${new Date().toLocaleDateString("es-CO")}`,20,y);

y += 12;

doc.line(20,y,190,y);

y += 10;


/* --------------------------
TABLA DE SERVICIOS
---------------------------*/

doc.setFont("helvetica","bold");
doc.text("Descripción",20,y);
doc.text("Valor",170,y,{align:"right"});

y += 6;

doc.line(20,y,190,y);

y += 8;

doc.setFont("helvetica","normal");

let total = 0;

if(orden.acciones && orden.acciones.length){

orden.acciones.forEach(a=>{

const descripcion = a.descripcion || "Servicio";
const costo = Number(a.costo || 0);

doc.text(descripcion,20,y);

doc.text(
`$${costo.toLocaleString("es-CO")}`,
170,
y,
{align:"right"}
);

total += costo;

y += 8;

});

}else{

doc.text("Sin acciones registradas",20,y);
y += 8;

}


/* --------------------------
TOTAL
---------------------------*/

y += 6;

doc.line(20,y,190,y);

y += 10;

doc.setFont("helvetica","bold");

doc.text("TOTAL",20,y);

doc.text(
`$${total.toLocaleString("es-CO")}`,
170,
y,
{align:"right"}
);

y += 20;


/* --------------------------
FOOTER
---------------------------*/

doc.setFontSize(9);
doc.setFont("helvetica","normal");

doc.text(
"Factura generada digitalmente por TallerPRO360",
20,
280
);

doc.text(
"ERP Automotriz Inteligente",
20,
285
);


/* --------------------------
GUARDAR PDF
---------------------------*/

const placa = orden.placa || "vehiculo";

doc.save(`factura_${placa}.pdf`);

}