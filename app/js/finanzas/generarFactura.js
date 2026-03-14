import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

/**
 * Genera una factura PDF para una orden del taller
 * TallerPRO360 ERP
 */

export function generarFactura(orden, configTaller = {}) {

const doc = new jsPDF()

/* ======================================
ENCABEZADO
====================================== */

doc.setFontSize(18)

const nombreTaller = configTaller.nombre || "TallerPRO360"

doc.text(`FACTURA - ${nombreTaller}`,20,20)


if(configTaller.logo){

doc.addImage(configTaller.logo,"PNG",150,10,40,20)

}

doc.setFontSize(11)

if(configTaller.direccion)
doc.text(`Dirección: ${configTaller.direccion}`,20,30)

if(configTaller.telefono)
doc.text(`Tel: ${configTaller.telefono}`,20,36)



/* ======================================
DATOS CLIENTE
====================================== */

doc.setFontSize(12)

doc.text(`Cliente: ${orden.cliente}`,20,55)

doc.text(`Vehículo: ${orden.vehiculo}`,20,63)

if(orden.placa)
doc.text(`Placa: ${orden.placa}`,20,71)

if(orden.fecha){

const fecha = new Date(orden.fecha).toLocaleDateString()

doc.text(`Fecha: ${fecha}`,20,79)

}


/* ======================================
TABLA ITEMS
====================================== */

let y = 100

doc.setFontSize(12)

doc.text("Descripción",20,y)
doc.text("Cant",120,y)
doc.text("Precio",140,y)
doc.text("Total",170,y)

y += 10

doc.setFontSize(10)


let total = 0

if(orden.items){

orden.items.forEach(item=>{

const subtotal = item.precio * item.cantidad

doc.text(item.nombre,20,y)

doc.text(String(item.cantidad),120,y)

doc.text(`$${item.precio}`,140,y)

doc.text(`$${subtotal}`,170,y)

total += subtotal

y += 8

})

}


/* ======================================
MANO DE OBRA
====================================== */

if(orden.manoObra){

doc.text("Mano de obra",20,y)

doc.text("",120,y)

doc.text("",140,y)

doc.text(`$${orden.manoObra}`,170,y)

total += Number(orden.manoObra)

y += 10

}


/* ======================================
TOTAL
====================================== */

doc.setFontSize(14)

doc.text(`TOTAL: $${total}`,20,y+10)


/* ======================================
PIE
====================================== */

doc.setFontSize(10)

doc.text(
"Documento generado por TallerPRO360 ERP",
20,
280
)


/* ======================================
GUARDAR
====================================== */

const nombreArchivo =
`factura_${orden.cliente || "orden"}.pdf`

doc.save(nombreArchivo)

}