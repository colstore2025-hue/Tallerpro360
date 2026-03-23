/**
 * app/js/services/selectorRepuestos.js
 * Interactor para selección de stock TallerPRO360
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export async function mostrarSelectorRepuesto(empresaId) {
    let origenSeleccionado = 'TALLER'; // Por defecto

    const { value: repuesto } = await Swal.fire({
        title: 'AGREGAR AL VEHÍCULO',
        background: '#050a14',
        color: '#fff',
        html: `
            <div class="space-y-4 text-left font-sans">
                <div class="grid grid-cols-2 gap-2">
                    <button id="btnStockPropio" type="button" class="p-4 bg-cyan-500 text-black border border-cyan-500 rounded-2xl font-black text-[10px] uppercase transition-all">
                        📦 STOCK TALLER
                    </button>
                    <button id="btnStockCliente" type="button" class="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase hover:bg-white/20 transition-all">
                        👤 DEL CLIENTE
                    </button>
                </div>
                <div id="areaSeleccion" class="mt-4 min-h-[100px]">
                    <p class="text-[9px] text-slate-500 text-center py-4 uppercase animate-pulse">Cargando inventario...</p>
                </div>
            </div>
        `,
        didOpen: async () => {
            const area = document.getElementById('areaSeleccion');
            
            // Función para cargar Stock Propio
            const cargarStockPropio = async () => {
                origenSeleccionado = 'TALLER';
                area.innerHTML = `<div class="text-center py-4"><i class="fas fa-sync fa-spin text-cyan-500"></i></div>`;
                
                const q = query(collection(db, `empresas/${empresaId}/inventario`), where("cantidad", ">", 0));
                const snap = await getDocs(q);
                
                if(snap.empty) {
                    area.innerHTML = `<p class="text-[10px] text-red-400 text-center font-black uppercase">Sin stock disponible</p>`;
                    return;
                }

                area.innerHTML = `
                    <label class="text-[8px] text-slate-500 uppercase font-black mb-1 block">Seleccionar Producto</label>
                    <select id="itemElegido" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold mb-3 outline-none focus:border-cyan-500">
                        ${snap.docs.map(d => {
                            const data = d.data();
                            return `<option value="${d.id}" data-precio="${data.precioVenta}" data-nombre="${data.nombre}">${data.nombre} (${data.cantidad} disp.)</option>`;
                        }).join("")}
                    </select>
                    <label class="text-[8px] text-slate-500 uppercase font-black mb-1 block">Cantidad</label>
                    <input id="cantElegida" type="number" value="1" min="1" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-cyan-500">
                `;
            };

            // Iniciar por defecto con stock propio
            await cargarStockPropio();

            document.getElementById('btnStockPropio').onclick = cargarStockPropio;

            document.getElementById('btnStockCliente').onclick = () => {
                origenSeleccionado = 'CLIENTE';
                area.innerHTML = `
                    <label class="text-[8px] text-yellow-500 uppercase font-black mb-1 block">Descripción del Repuesto</label>
                    <input id="nombreManual" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-yellow-500" placeholder="Ej: Kit de Frenos Bosch">
                    <p class="text-[8px] text-slate-500 p-2 italic leading-tight mt-2">Este ítem se registrará con valor $0 para el cliente y sin afectar tu inventario.</p>
                `;
            };
        },
        preConfirm: () => {
            if (origenSeleccionado === 'TALLER') {
                const el = document.getElementById('itemElegido');
                const opt = el.options[el.selectedIndex];
                return {
                    idInventario: el.value,
                    nombre: opt.dataset.nombre,
                    precio: parseFloat(opt.dataset.precio),
                    cantidad: parseInt(document.getElementById('cantElegida').value),
                    origen: 'TALLER'
                };
            } else {
                const nombre = document.getElementById('nombreManual').value.trim();
                if (!nombre) return Swal.showValidationMessage('Escribe el nombre del repuesto');
                return {
                    nombre: nombre,
                    precio: 0,
                    cantidad: 1,
                    origen: 'CLIENTE'
                };
            }
        },
        confirmButtonText: 'VINCULAR A ORDEN',
        confirmButtonColor: '#06b6d4'
    });
    
    return repuesto;
}