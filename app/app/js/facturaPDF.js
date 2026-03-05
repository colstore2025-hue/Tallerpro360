import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export function generarFactura(orden){

const doc = new jsPDF();

doc.setFontSize(20);
doc.text(orden.tallerNombre,20,20);

doc.setFontSize(10);
doc.text("Sistema creado con TallerPro360",20,27);

doc.setFontSize(12);

doc.text(`Cliente: ${orden.cliente}`,20,40);
doc.text(`Vehículo: ${orden.vehiculo}`,20,50);
doc.text(`Placa: ${orden.placa}`,20,60);

doc.text(`Fecha: ${new Date().toLocaleDateString()}`,150,40);

let y = 80;

doc.text("Detalle del servicio:",20,70);

orden.acciones.forEach(a=>{

doc.text(
`${a.descripcion}  -  $${a.costo}`,
20,
y
);

y+=10;

});

doc.setFontSize(14);

doc.text(
`TOTAL: $${orden.total}`,
20,
y+20
);

doc.save(`factura_${orden.placa}.pdf`);

}