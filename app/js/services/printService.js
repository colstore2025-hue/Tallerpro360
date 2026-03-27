/**
 * printService.js - TallerPRO360 PDF Engine 🛰️
 * Generación de Documentos de Misión Nexus-X
 */

export const generarPDFOrden = (orden) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración de Estética (Tesla Dark Mode Adaptado a Papel)
    const azulNexus = [0, 242, 255];
    const grisOscuro = [30, 41, 59];

    // 1. Encabezado / Logo
    doc.setFillColor(...grisOscuro);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TallerPRO360", 15, 20);
    
    doc.setFontSize(8);
    doc.setTextColor(...azulNexus);
    doc.text("SISTEMA LOGÍSTICO NEXUS-X STARLINK", 15, 28);

    // 2. Información de la Orden
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`ORDEN DE SERVICIO: #${orden.placa}-${new Date().getTime().toString().slice(-4)}`, 15, 50);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 15, 55);

    // 3. Cuadro de Datos (Cliente / Vehículo)
    doc.autoTable({
        startY: 65,
        head: [['CLIENTE', 'PLACA / VEHÍCULO', 'ESTADO']],
        body: [[orden.cliente, orden.placa, 'EN PROCESO']],
        theme: 'grid',
        headStyles: { fillColor: grisOscuro, textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    // 4. Detalle de Diagnóstico
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNÓSTICO TÉCNICO:", 15, doc.lastAutoTable.finalY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitDiag = doc.splitTextToSize(orden.diagnostico || "Sin diagnóstico registrado.", 180);
    doc.text(splitDiag, 15, doc.lastAutoTable.finalY + 15);

    // 5. Tabla de Repuestos y Servicios
    const tableRows = orden.items.map(it => [
        it.nombre,
        it.origen === 'TALLER' ? 'Taller' : 'Cliente',
        it.cantidad,
        `$${new Intl.NumberFormat("es-CO").format(it.precio)}`,
        `$${new Intl.NumberFormat("es-CO").format(it.precio * it.cantidad)}`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['ÍTEM/SERVICIO', 'ORIGEN', 'CANT', 'UNITARIO', 'SUBTOTAL']],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 150, 200] }
    });

    // 6. Totales
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: $${new Intl.NumberFormat("es-CO").format(orden.total)}`, 140, finalY);

    // 7. Pie de página Legal
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Este documento es un comprobante de servicio digital generado por Nexus-X Starlink.", 15, 285);
    doc.text("Colombian Trucks Logistics LLC - Charlotte, NC / Colombia.", 15, 290);

    // --- ACCIÓN FINAL ---
    // Guardar archivo
    doc.save(`Orden_${orden.placa}.pdf`);
    
    // Retornar blob para WhatsApp si es necesario
    return doc.output('blob');
};
