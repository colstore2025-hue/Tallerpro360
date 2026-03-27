/**
 * printService.js - TallerPRO360 PDF & Comms Engine 🛰️
 * Ubicación: app/js/services/printService.js
 */

export const generarPDFOrden = (orden) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración Estética Nexus-X (Cyan & Dark)
    const azulNexus = [0, 242, 255];
    const grisOscuro = [15, 23, 42];

    // --- HEADER ---
    doc.setFillColor(...grisOscuro);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TallerPRO360", 15, 25);
    
    doc.setFontSize(7);
    doc.setTextColor(...azulNexus);
    doc.text("CORE ENGINE: NEXUS-X STARLINK LOGISTICS", 15, 33);
    doc.text("COLOMBIAN TRUCKS LOGISTICS LLC", 15, 37);

    // --- INFO ORDEN ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`ORDEN DE SERVICIO: #${orden.placa}-${new Date().getTime().toString().slice(-4)}`, 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleString()}`, 15, 60);

    // --- TABLA CLIENTE ---
    doc.autoTable({
        startY: 70,
        head: [['CLIENTE', 'PLACA / VEHÍCULO', 'ESTADO']],
        body: [[orden.cliente, orden.placa, 'EN TALLER (ACTIVO)']],
        theme: 'grid',
        headStyles: { fillColor: grisOscuro, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 4 }
    });

    // --- DIAGNÓSTICO ---
    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE DIAGNÓSTICO TÉCNICO:", 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const splitDiag = doc.splitTextToSize(orden.diagnostico || "Sin observaciones registradas.", 180);
    doc.text(splitDiag, 15, currentY + 7);

    // --- TABLA DE ITEMS ---
    const tableRows = orden.items.map(it => [
        it.nombre,
        it.origen === 'TALLER' ? 'Taller' : 'Externo',
        it.cantidad,
        `$${new Intl.NumberFormat("es-CO").format(it.precio)}`,
        `$${new Intl.NumberFormat("es-CO").format(it.precio * it.cantidad)}`
    ]);

    doc.autoTable({
        startY: currentY + 25,
        head: [['SERVICIO / REPUESTO', 'ORIGEN', 'CANT', 'VALOR UNIT', 'SUBTOTAL']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 150, 200], fontSize: 8 },
        styles: { fontSize: 8 },
        foot: [[ { content: 'TOTAL ESTIMADO DE OPERACIÓN:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, 
                `$${new Intl.NumberFormat("es-CO").format(orden.total)}` ]],
        footStyles: { fillColor: grisOscuro, textColor: azulNexus, fontSize: 10 }
    });

    // --- QR SIMULADO / PIE DE PÁGINA ---
    const finalY = doc.internal.pageSize.height - 20;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Este es un documento digital generado por el motor Nexus-X Starlink. No requiere firma física.", 15, finalY);
    doc.text("Copyright © 2026 Colombian Trucks Logistics LLC - Charlotte, NC. USA.", 15, finalY + 4);

    // Ejecutar Acción
    doc.save(`Orden_${orden.placa}_NexusX.pdf`);
};

/**
 * Envío de resumen ejecutivo vía WhatsApp
 */
export const enviarWhatsAppOrden = (orden) => {
    const telefono = "573000000000"; // Aquí podrías jalar el tel del cliente si lo tienes en el objeto orden
    const mensaje = `*TallerPRO360 · REPORTE NEXUS-X*%0A` +
                    `------------------------------------%0A` +
                    `*VEHÍCULO:* ${orden.placa}%0A` +
                    `*CLIENTE:* ${orden.cliente}%0A` +
                    `*TOTAL ESTIMADO:* $${new Intl.NumberFormat("es-CO").format(orden.total)}%0A` +
                    `------------------------------------%0A` +
                    `*DIAGNÓSTICO:* ${orden.diagnostico}%0A%0A` +
                    `_Su servicio está siendo procesado bajo estándares Nexus-X Starlink._`;
    
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
};
