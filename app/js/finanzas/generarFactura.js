import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

/**
 * Genera una factura en PDF para una orden.
 * @param {Object} orden - Orden con información de cliente, vehículo, placa y acciones.
 * @param {Object} [configTaller] - Opcional: información del taller (nombre, logo, dirección)
 */
export function generarFactura(orden, configTaller = {}) {
  const doc = new jsPDF();

  // ENCABEZADO
  doc.setFontSize(18);
  const nombreTaller = configTaller.nombre || "TallerPRO360";
  doc.text(`FACTURA - ${nombreTaller}`, 20, 20);

  if(configTaller.logo) {
    // Logo opcional del taller (asume URL o base64)
    doc.addImage(configTaller.logo, "PNG", 150, 10, 40, 20);
  }

  doc.setFontSize(12);
  if(configTaller.direccion) doc.text(`Dirección: ${configTaller.direccion}`, 20, 30);

  // DATOS DE LA ORDEN
  doc.text(`Cliente: ${orden.cliente}`, 20, 50);
  doc.text(`Vehículo: ${orden.vehiculo}`, 20, 60);
  doc.text(`Placa: ${orden.placa}`, 20, 70);

  // DETALLE DE ACCIONES
  let y = 90;
  orden.acciones.forEach(a => {
    doc.text(`${a.descripcion} - $${a.costo}`, 20, y);
    y += 10;
  });

  // TOTAL
  doc.setFontSize(14);
  doc.text(`TOTAL: $${orden.total}`, 20, y + 20);

  // PIE DE PÁGINA
  doc.setFontSize(10);
  doc.text("Documento generado por TALLERPRO360", 20, 280);

  // GUARDAR PDF
  const nombreArchivo = `factura_${orden.placa}.pdf`;
  doc.save(nombreArchivo);
}