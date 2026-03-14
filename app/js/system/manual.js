import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export function generarManualPDF() {
  const doc = new jsPDF();
  let y = 20;

  // ============================
  // ENCABEZADO
  // ============================
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // verde neón
  doc.text("Manual de Usuario - TallerPRO360 ERP", 20, y);
  y += 15;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Guía paso a paso para gestión de clientes, inventario y órdenes de trabajo", 20, y);
  y += 15;

  // ============================
  // SECCIÓN 1: Dashboard
  // ============================
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("1️⃣ Dashboard", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("Al ingresar, verá un menú principal con secciones: Clientes, Inventario, Órdenes de trabajo.", 20, y, { maxWidth: 170 });
  y += 15;

  // ============================
  // SECCIÓN 2: Clientes
  // ============================
  doc.setFontSize(16);
  doc.text("2️⃣ Gestión de Clientes", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("Agregar cliente:", 20, y);
  y += 8;
  doc.text("1. Ingrese Nombre, Teléfono y Email.", 25, y);
  y += 8;
  doc.text("2. Presione 'Guardar Cliente'.", 25, y);
  y += 8;
  doc.text("3. El cliente se agrega automáticamente a la lista.", 25, y);
  y += 10;
  doc.text("Buscar cliente:", 20, y);
  y += 8;
  doc.text("Escriba cualquier dato en 'Buscar cliente...' para filtrar la lista en tiempo real.", 25, y, { maxWidth: 160 });
  y += 15;

  // ============================
  // SECCIÓN 3: Inventario
  // ============================
  doc.setFontSize(16);
  doc.text("3️⃣ Gestión de Inventario", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("Agregar producto:", 20, y);
  y += 8;
  doc.text("1. Ingrese Nombre, Costo de compra, Margen (%) y Stock inicial.", 25, y);
  y += 8;
  doc.text("2. Presione 'Guardar Producto'.", 25, y);
  y += 8;
  doc.text("El sistema calculará automáticamente el precio de venta.", 25, y, { maxWidth: 160 });
  y += 15;

  // ============================
  // SECCIÓN 4: Órdenes
  // ============================
  doc.setFontSize(16);
  doc.text("4️⃣ Crear Órdenes de Trabajo", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("Pasos:", 20, y);
  y += 8;
  doc.text("1. Ingrese Cliente, Vehículo y Diagnóstico.", 25, y);
  y += 8;
  doc.text("2. Agregue productos del inventario, cantidad y utilidad por unidad.", 25, y);
  y += 8;
  doc.text("3. Ingrese valor de Mano de obra.", 25, y);
  y += 8;
  doc.text("4. Revise la tabla de Items de la Orden y los totales.", 25, y);
  y += 8;
  doc.text("5. Presione 'Guardar Orden'. Se generará automáticamente la factura PDF.", 25, y, { maxWidth: 160 });
  y += 15;

  // ============================
  // SECCIÓN 5: Buenas Prácticas
  // ============================
  doc.setFontSize(16);
  doc.text("5️⃣ Buenas Prácticas", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("- Registrar clientes antes de crear órdenes.", 25, y);
  y += 8;
  doc.text("- Mantener inventario actualizado: cantidad, costo y margen.", 25, y);
  y += 8;
  doc.text("- Revisar utilidad y margen antes de guardar la orden.", 25, y);
  y += 8;
  doc.text("- Limpiar formularios después de guardar.", 25, y);
  y += 15;

  // ============================
  // PIE DE PÁGINA
  // ============================
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Documento generado por TALLERPRO360 ERP", 20, 280);

  // ============================
  // GUARDAR PDF
  // ============================
  doc.save("Manual_TallerPRO360.pdf");
}