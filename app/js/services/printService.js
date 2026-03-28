/**
 * printService.js - TallerPRO360 PDF & Comms Engine V16.7 🛰️
 * Especializado para: Colombian Trucks Logistics LLC
 */

export const generarPDFOrden = (orden) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración de Paleta de Navegación Nexus
    const cyanNexus = [0, 242, 255];
    const darkSpace = [15, 23, 42];
    const emeraldTech = [16, 185, 129];

    // --- CABECERA AEROESPACIAL ---
    doc.setFillColor(...darkSpace);
    doc.rect(0, 0, 210, 50, 'F'); // Fondo oscuro superior
    
    // Logo / Nombre
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("NEXUS-X", 15, 25);
    
    doc.setFontSize(8);
    doc.setTextColor(...cyanNexus);
    doc.setFont("courier", "bold");
    doc.text("PRO360CORE ENGINE V16.7 · STARLINK LOGISTICS", 15, 32);
    
    // Info Empresa (Derecha)
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Nexus-XStarlink Saas", 195, 20, { align: "right" });
    doc.text("Charlotte, NC. United States", 195, 24, { align: "right" });
    doc.text("Soporte: support@tallerpro360.com", 195, 28, { align: "right" });

    // --- IDENTIFICADOR DE MISIÓN ---
    doc.setFillColor(...cyanNexus);
    doc.rect(15, 42, 180, 0.5, 'F'); // Línea decorativa neón

    doc.setTextColor(...darkSpace);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const idOrden = `${orden.placa}-${new Date().getTime().toString().slice(-4)}`;
    doc.text(`MANIFIESTO DE SERVICIO: #${idOrden}`, 15, 60);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`FECHA DE REGISTRO: ${new Date().toLocaleString()}`, 15, 65);

    // --- TABLA DE ACTORES (CLIENTE / VEHÍCULO) ---
    doc.autoTable({
        startY: 75,
        head: [['IDENTIDAD DEL COMANDANTE', 'UNIDAD / PLACA', 'ESTADO OPERATIVO']],
        body: [[
            orden.cliente.toUpperCase(), 
            orden.placa.toUpperCase(), 
            { content: (orden.estado || 'EN TALLER').replace('_', ' '), styles: { textColor: emeraldTech, fontStyle: 'bold' } }
        ]],
        theme: 'plain',
        headStyles: { textColor: [100, 100, 100], fontSize: 7, fontStyle: 'bold', cellPadding: 2 },
        styles: { fontSize: 10, cellPadding: 4, font: "helvetica" }
    });

    // --- REPORTE DE TELEMETRÍA (DIAGNÓSTICO) ---
    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkSpace);
    doc.text("INFORME DE DIAGNÓSTICO Y SÍNTOMAS:", 15, currentY);
    
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const splitDiag = doc.splitTextToSize(orden.diagnostico || "Sin observaciones críticas registradas en el ingreso.", 180);
    doc.text(splitDiag, 15, currentY + 7);

    // --- BITÁCORA DE SUMINISTROS Y LABORES ---
    const tableRows = orden.items.map(it => [
        it.nombre.toUpperCase(),
        it.cantidad,
        `$ ${new Intl.NumberFormat("es-CO").format(it.precio)}`,
        `$ ${new Intl.NumberFormat("es-CO").format(it.precio * it.cantidad)}`
    ]);

    doc.autoTable({
        startY: currentY + 25,
        head: [['DESCRIPCIÓN DE OPERACIÓN', 'CANT', 'VALOR UNIT', 'SUBTOTAL']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: darkSpace, textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
        },
        styles: { fontSize: 8 },
        foot: [[ 
            { content: 'TOTAL ESTIMADO DE MISIÓN:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, 
            `$ ${new Intl.NumberFormat("es-CO").format(orden.total)}` 
        ]],
        footStyles: { fillColor: [240, 240, 240], textColor: darkSpace, fontSize: 10 }
    });

    // --- PIE DE PÁGINA Y LEGAL ---
    const finalY = doc.internal.pageSize.height - 25;
    
    // Nota de seguridad
    doc.setFillColor(245, 245, 245);
    doc.rect(15, finalY - 10, 180, 15, 'F');
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text("NOTAS: Este presupuesto es una estimación basada en la telemetría inicial. Sujeto a cambios según hallazgos técnicos.", 20, finalY - 4);
    doc.text("Documento digital cifrado por Nexus-X. No requiere firma autógrafa para su validez legal inicial.", 20, finalY);

    // Footer de Marca
    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.text("Copyright © 2026·Nexus-X Starlink Engine", 105, finalY + 15, { align: "center" });

    // Ejecutar Acción
    doc.save(`NexusX_Orden_${orden.placa}_${new Date().getTime().toString().slice(-4)}.pdf`);
};

/**
 * Envío de resumen ejecutivo vía WhatsApp con formato PRO
 */
export const enviarWhatsAppOrden = (orden) => {
    // Si el teléfono no tiene indicativo, lo forzamos (asumiendo Colombia por el formato previo)
    let telFull = orden.telefono || "";
    if (telFull.length === 10) telFull = "57" + telFull;

    const emojiFase = {
        'EN_TALLER': '📡',
        'DIAGNOSTICO': '🧠',
        'REPARACION': '🔧',
        'LISTO': '✅'
    };

    const fase = emojiFase[orden.estado] || '⚙️';
    
    const mensaje = 
        `*TallerPRO360 · NEXUS-X REPORT* 🛰️%0A` +
        `=============================%0A` +
        `*ESTADO:* ${fase} ${ (orden.estado || 'EN TALLER').replace('_', ' ') }%0A` +
        `*VEHÍCULO:* ${orden.placa.toUpperCase()}%0A` +
        `*CLIENTE:* ${orden.cliente.toUpperCase()}%0A` +
        `=============================%0A` +
        `*DIAGNÓSTICO:*%0A_${orden.diagnostico || 'Pendiente de revisión'}_%0A%0A` +
        `*TOTAL ESTIMADO:*%0A* $ ${new Intl.NumberFormat("es-CO").format(orden.total)}*%0A` +
        `=============================%0A` +
        `_Este es un reporte automatizado de Colombian Trucks Logistics LLC via Starlink Engine._`;
    
    const url = `https://wa.me/${telFull}?text=${mensaje}`;
    window.open(url, '_blank');
};

