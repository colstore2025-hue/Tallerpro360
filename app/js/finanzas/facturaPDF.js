import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

/**
 * Genera una factura en PDF para un taller
 * TallerPRO360 ERP
 */

export function generarFactura(orden, configTaller = {}) {

const doc = new jsPDF()

/* =====================================
ENCABEZADO
===================================== */

const nombreTaller = configTaller.nombre || "Taller Automotriz"
const logo = configTaller.logo || null
const direccion = configTaller.direccion || ""
const telefono = configTaller.telefono || ""

if(logo){

doc.addImage(logo,"PNG",150,10,40,20)

}

doc.setFontSize(16)
doc.text(nombreTaller,20,20)

doc.setFontSize(10)

if(direccion) doc.text(direccion,20,26)
if(telefono) doc.text(`Tel: ${telefono}`,20,32)

doc.setFontSize(9)
doc.setTextColor(120)
doc.text("Generado por TALLERPRO360",20,40)



/* =====================================
DATOS ORDEN
===================================== */

doc.setFontSize(12)
doc.setTextColor(0)

doc.text(`Cliente: ${orden.cliente || ""}`,20,55)
doc.text(`Vehículo: ${orden.vehiculo || ""}`,20,63)

if(orden.placa)
doc.text(`Placa: ${orden.placa}`,20,71)

if(orden.fecha){

const fecha = new Date(orden.fecha).toLocaleDateString()

doc.text(`Fecha: ${fecha}`,20,79)

}



/* =====================================
CABECERA TABLA
===================================== */

let y = 95

doc.setFontSize(11)

doc.text("Descripción",20,y)
doc.text("Cant",120,y)
doc.text("Precio",145,y)
doc.text("Total",175,y)

y += 8



/* =====================================
ITEMS INVENTARIO
===================================== */

let total = 0

if(orden.items){

orden.items.forEach(item=>{

const cantidad = Number(item.cantidad || 1)
const precio = Number(item.precio || 0)

const subtotal = cantidad * precio

doc.text(item.nombre || "",20,y)

doc.text(String(cantidad),120,y)

doc.text(`$${precio}`,145,y)

doc.text(`$${subtotal}`,175,y)

total += subtotal

y += 8

})

}



/* =====================================
ACCIONES (compatibilidad antigua)
===================================== */

if(orden.acciones){

orden.acciones.forEach(a=>{

const precio = Number(a.costo || 0)

doc.text(a.descripcion || "Servicio",20,y)

doc.text("1",120,y)

doc.text(`$${precio}`,145,y)

doc.text(`$${precio}`,175,y)

total += precio

y += 8

})

}



/* =====================================
MANO DE OBRA
===================================== */

if(orden.manoObra){

doc.text("Mano de obra",20,y)

doc.text("",120,y)

doc.text("",145,y)

doc.text(`$${orden.manoObra}`,175,y)

total += Number(orden.manoObra)

y += 10

}



/* =====================================
TOTAL
===================================== */

doc.setFontSize(14)

doc.text(`TOTAL: $${total}`,20,y+10)



/* =====================================
GUARDAR PDF
===================================== */

const nombreArchivo =
`factura_${orden.placa || "orden"}.pdf`

doc.save(nombreArchivo)

}