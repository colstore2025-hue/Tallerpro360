/**
 * ordenPDF.js
 * Generación de PDF de orden de servicio
 * TallerPRO360 ERP
 */

import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";


export function generarOrdenPDF(orden, empresa){

  try{

    const doc = new jsPDF();

    const cliente = orden?.cliente ?? "Cliente";
    const telefono = orden?.telefono ?? "";
    const vehiculo = orden?.vehiculo ?? "Vehículo";
    const placa = orden?.placa ?? "";

    const nombreEmpresa = empresa?.nombre ?? "Taller Automotriz";
    const direccion = empresa?.direccion ?? "";
    const telefonoEmpresa = empresa?.telefono ?? "";



    /* =========================
       ENCABEZADO EMPRESA
    ========================= */

    doc.setFontSize(18);
    doc.text(nombreEmpresa,20,20);

    doc.setFontSize(10);
    doc.text(direccion,20,28);
    doc.text(telefonoEmpresa,20,34);



    /* =========================
       TITULO DOCUMENTO
    ========================= */

    doc.setFontSize(16);
    doc.text("ORDEN DE SERVICIO",140,20);



    /* =========================
       DATOS CLIENTE
    ========================= */

    doc.setFontSize(12);

    doc.text(`Cliente: ${cliente}`,20,60);
    doc.text(`Teléfono: ${telefono}`,20,70);
    doc.text(`Vehículo: ${vehiculo}`,20,80);
    doc.text(`Placa: ${placa}`,20,90);



    /* =========================
       TABLA ACCIONES
    ========================= */

    let y = 110;

    doc.text("Detalle del servicio:",20,y);

    y += 10;

    let total = 0;

    if(Array.isArray(orden?.acciones)){

      orden.acciones.forEach(a => {

        const descripcion = a?.descripcion ?? "Servicio";
        const costo = Number(a?.costo ?? 0);

        doc.text(
          `${descripcion}  -  $${costo.toLocaleString()}`,
          20,
          y
        );

        total += costo;

        y += 10;

        // salto de página si se llena
        if(y > 260){
          doc.addPage();
          y = 20;
        }

      });

    }



    /* =========================
       TOTAL
    ========================= */

    y += 10;

    doc.setFontSize(14);

    doc.text(
      `TOTAL: $${total.toLocaleString()}`,
      20,
      y
    );



    /* =========================
       PIE DOCUMENTO
    ========================= */

    doc.setFontSize(9);

    doc.text(
      "Documento generado por TallerPRO360",
      20,
      280
    );



    /* =========================
       DESCARGAR PDF
    ========================= */

    const nombreArchivo =
      `orden_${placa || "vehiculo"}.pdf`;

    doc.save(nombreArchivo);


  }catch(error){

    console.error(
      "Error generando PDF de orden:",
      error
    );

  }

}