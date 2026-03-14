/**
 * app/js/system/manual.js
 * Genera el Manual de Usuario en PDF
 * TallerPRO360 ERP
 */

import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export function generarManualPDF() {

  const doc = new jsPDF();
  let y = 20;

  // ===========================
  // Portada
  // ===========================
  doc.setFontSize(22);
  doc.text("TallerPRO360 ERP", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(16);
  doc.text("Manual de Usuario", 105, y, { align: "center" });
  y += 20;

  doc.setFontSize(12);
  doc.text("Este manual explica cómo utilizar las funciones principales del ERP TallerPRO360.", 20, y);
  y += 8;
  doc.text("Incluye gestión de clientes, inventario, órdenes de trabajo y generación de facturas.", 20, y);
  y += 20;

  // ===========================
  // Sección 1: Clientes
  // ===========================
  doc.setFontSize(16);
  doc.text("1. Gestión de Clientes", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("• Para agregar un cliente, ve al módulo 'Clientes'.", 25, y);
  y += 8;
  doc.text("• Ingresa nombre, teléfono y email, luego presiona 'Guardar Cliente'.", 25, y);
  y += 8;
  doc.text("• Puedes buscar clientes usando la barra de búsqueda.", 25, y);
  y += 12;

  // ===========================
  // Sección 2: Inventario
  // ===========================
  doc.setFontSize(16);
  doc.text("2. Gestión de Inventario", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("• Agrega nuevos productos definiendo nombre, costo, margen de utilidad y stock inicial.", 25, y);
  y += 8;
  doc.text("• El sistema calcula automáticamente el precio de venta según el margen definido.", 25, y);
  y += 12;

  // ===========================
  // Sección 3: Órdenes de trabajo
  // ===========================
  doc.setFontSize(16);
  doc.text("3. Órdenes de Trabajo", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("• Completa datos de cliente, vehículo y diagnóstico.", 25, y);
  y += 8;
  doc.text("• Agrega repuestos con cantidad y utilidad por unidad.", 25, y);
  y += 8;
  doc.text("• Ingresa el valor de la mano de obra.", 25, y);
  y += 8;
  doc.text("• El sistema calcula total, costo, utilidad y margen automáticamente.", 25, y);
  y += 8;
  doc.text("• Guarda la orden y se generará automáticamente la factura PDF.", 25, y);
  y += 12;

  // ===========================
  // Sección 4: Facturas
  // ===========================
  doc.setFontSize(16);
  doc.text("4. Facturación", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("• Cada orden guardada permite generar una factura PDF.", 25, y);
  y += 8;
  doc.text("• Puedes imprimir o enviar la factura al cliente.", 25, y);
  y += 12;

  // ===========================
  // Pie de página
  // ===========================
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("TallerPRO360 ERP - Manual de Usuario", 105, 290, { align: "center" });

  // ===========================
  // Guardar PDF
  // ===========================
  doc.save("Manual_TallerPRO360.pdf");

}