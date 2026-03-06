import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

/**
 * Genera una factura en PDF para un taller.
 * @param {Object} orden - La información de la orden.
 * @param {Object} configTaller - Opcional. Configuración del taller para encabezado personalizado.
 *                                Debe incluir nombre, logo (URL o base64), dirección, teléfono.
 */
export function generarFactura(orden, configTaller = {}) {
  const doc = new jsPDF();

  // ============================
  // ENCABEZADO PERSONALIZADO
  // ============================
  const nombreTaller = configTaller.nombre || "Taller Automotriz";
  const logo = configTaller.logo || null; // URL o base64
  const direccion = configTaller.direccion || "";
  const telefono = configTaller.telefono || "";

  // Logo (si existe)
  if (logo) {
    doc.addImage(logo, "PNG", 150, 10, 40, 20); // x, y, width, height
  }

  doc.setFontSize(16);
  doc.text(nombreTaller, 20, 20);
  doc.setFontSize(10);
  if (direccion) doc.text(direccion, 20, 26);
  if (telefono) doc.text(`Tel: ${telefono}`, 20, 32);

  // Indicar que fue generado por TALLERPRO360
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Generado por TALLERPRO360", 20, 40);

  // ============================
  // DATOS DE LA ORDEN
  // ============================
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Cliente: ${orden.cliente}`, 20, 50);
  doc.text(`Vehículo: ${orden.vehiculo}`, 20, 60);
  doc.text(`Placa: ${orden.placa}`, 20, 70);

  // ============================
  // DETALLE DE ACCIONES
  // ============================
  let y = 80;
  orden.acciones.forEach(a => {
    doc.text(`${a.descripcion} - $${a.costo}`, 20, y);
    y += 10;
  });

  // TOTAL
  doc.setFontSize(14);
  doc.text(`TOTAL: $${orden.total}`, 20, y + 10);

  // Guardar PDF
  doc.save(`factura_${orden.placa}.pdf`);
}