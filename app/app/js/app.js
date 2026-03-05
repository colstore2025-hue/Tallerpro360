// =============================
// IMPORTS PRINCIPALES
// =============================
import { ordenes } from "./ordenes.js";
import { crearRepuesto } from "./crearRepuesto.js";
import { generarFactura } from "./generarFactura.js";
import { notificarCliente } from "./whatsappService.js";
import { cambiarEstadoOrden } from "./cambiarEstadoOrden.js";
import { panelFinanciero } from "./panelFinanciero.js";
import { detectarRepuestos } from "./detectarRepuestos.js";

// =============================
// ELEMENTOS DEL DOM
// =============================
const mainContainer = document.getElementById("app");

// =============================
// INICIALIZAR APP
// =============================
async function initApp() {
  // Cargar gestión de órdenes
  await ordenes(mainContainer);

  // Cargar dashboard financiero
  await panelFinanciero(document.getElementById("dashboardFinanciero"));

  console.log("TallerPRO360 cargado correctamente");
}

initApp();

// =============================
// EJEMPLOS DE USO
// =============================

// 1️⃣ Crear repuesto
/*
crearRepuesto({
  nombre: "Filtro de aceite",
  marca: "Bosch",
  categoria: "Motor",
  costoCompra: 15000,
  margen: 40,
  stock: 10,
  proveedor: "Proveedor A"
}).then(id=>{
  console.log("Repuesto creado con ID:", id);
});
*/

// 2️⃣ Generar factura
/*
generarFactura({
  cliente: "Juan Pérez",
  vehiculo: "Toyota Corolla",
  placa: "ABC123",
  acciones: [
    {descripcion:"Cambio aceite", costo:50000},
    {descripcion:"Filtro aceite", costo:15000}
  ],
  total: 65000
});
*/

// 3️⃣ Notificar cliente por WhatsApp
/*
notificarCliente("3115709730","Juan Pérez","En proceso","Toyota Corolla");
*/

// 4️⃣ Cambiar estado de orden y notificar
/*
cambiarEstadoOrden("ordenId123","Listo para entregar","3115709730");
*/

// 5️⃣ Detectar repuestos por IA
/*
detectarRepuestos("El vehículo hace ruido al arrancar").then(res=>{
  console.log(res);
});
*/