import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export function generarFactura(orden){
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("FACTURA TALLERPRO360",20,20);
  doc.setFontSize(12);
  doc.text(`Cliente: ${orden.cliente}`,20,40);
  doc.text(`Vehículo: ${orden.vehiculo}`,20,50);
  doc.text(`Placa: ${orden.placa}`,20,60);

  let y = 80;
  orden.acciones.forEach(a=>{
    doc.text(`${a.descripcion} - $${a.costo}`,20,y);
    y+=10;
  });

  doc.text(`TOTAL: $${orden.total}`,20,y+20);
  doc.save(`factura_${orden.placa}.pdf`);
}