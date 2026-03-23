/**
 * inventario.js - TallerPRO360 V5.2 📦
 * Edición "Nexus-Shield": Protección contra NaN/Undefined
 */
import { collection, query, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventario(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 animate-fade-in font-sans pb-32">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-left">
                <div>
                    <h1 class="text-2xl font-black text-white italic tracking-tighter uppercase">
                        ALMACÉN / <span class="text-cyan-400">STOCK</span>
                    </h1>
                    <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic leading-tight">Control de Activos e Insumos Externos</p>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button id="btnNuevoInsumo" class="flex-1 md:flex-none bg-cyan-500 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase active:scale-95 shadow-lg shadow-cyan-500/20 transition-all">
                        + Stock Propio
                    </button>
                    <button id="btnRepuestoCliente" class="flex-1 md:flex-none bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">
                        <i class="fas fa-user-tag mr-2 text-cyan-400"></i> Del Cliente
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
                <div class="bg-slate-900/50 p-5 rounded-[2rem] border border-white/5">
                    <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Inversión Total</p>
                    <p id="totalInversion" class="text-xl font-black text-white">$ 0</p>
                </div>
                <div id="criticoAlerta" class="bg-red-500/5 p-5 rounded-[2rem] border border-red-500/10 hidden animate-pulse">
                    <p class="text-[7px] text-red-500 font-black uppercase tracking-widest mb-1 italic">Stock Crítico</p>
                    <p id="itemsCriticos" class="text-xl font-black text-red-500">0 Items</p>
                </div>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="col-span-full py-20 text-center animate-pulse opacity-20">
                    <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-[9px] font-black text-white uppercase tracking-[0.5em]">Sincronizando Almacén...</p>
                </div>
            </div>
        </div>
        `;

        document.getElementById("btnNuevoInsumo").onclick = abrirModalNuevoStock;
        document.getElementById("btnRepuestoCliente").onclick = abrirModalRepuestoCliente;
        cargarInventario();
    };

    // --- MODAL: AGREGAR STOCK PROPIO ---
    async function abrirModalNuevoStock() {
        const { value: formValues } = await Swal.fire({
            title: 'REGISTRAR NUEVO INSUMO',
            background: '#0a0f1d',
            color: '#fff',
            html: `
                <div class="space-y-3 text-left font-sans">
                    <input id="n-nombre" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold uppercase" placeholder="Nombre del Repuesto">
                    <div class="grid grid-cols-2 gap-2">
                        <input id="n-cantidad" type="number" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold" placeholder="Cantidad">
                        <input id="n-minimo" type="number" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold" placeholder="Stock Mínimo">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input id="n-costo" type="number" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold" placeholder="Costo Compra">
                        <input id="n-venta" type="number" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold" placeholder="Precio Venta">
                    </div>
                </div>
            `,
            confirmButtonText: 'GUARDAR EN NEXUS',
            preConfirm: () => {
                const data = {
                    nombre: document.getElementById('n-nombre').value.toUpperCase(),
                    cantidad: Number(document.getElementById('n-cantidad').value) || 0,
                    stockMinimo: Number(document.getElementById('n-minimo').value) || 0,
                    costo: Number(document.getElementById('n-costo').value) || 0,
                    precioVenta: Number(document.getElementById('n-venta').value) || 0,
                    creadoEn: serverTimestamp()
                };
                if (!data.nombre || data.cantidad <= 0) return Swal.showValidationMessage('Nombre y cantidad obligatorios');
                return data;
            }
        });

        if (formValues) {
            try {
                await addDoc(collection(db, `empresas/${empresaId}/inventario`), formValues);
                hablar("Insumo ingresado al almacén.");
                cargarInventario();
            } catch (e) { console.error(e); }
        }
    }

    // --- MODAL: REPUESTO CLIENTE ---
    async function abrirModalRepuestoCliente() {
        const { value: formValues } = await Swal.fire({
            title: 'RECEPCIÓN EXTERNA',
            background: '#0a0f1d',
            color: '#fff',
            html: `<input id="sw-placa" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-cyan-400 font-black mb-3" placeholder="PLACA">
                   <input id="sw-item" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-bold" placeholder="¿Qué trajo el cliente?">`,
            preConfirm: () => {
                const placa = document.getElementById('sw-placa').value.trim().toUpperCase();
                const item = document.getElementById('sw-item').value.trim().toUpperCase();
                if(!placa || !item) return Swal.showValidationMessage('Faltan datos');
                return { placa, item };
            }
        });

        if (formValues) {
            await addDoc(collection(db, `empresas/${empresaId}/repuestos_externos`), { ...formValues, fechaIngreso: serverTimestamp() });
            hablar("Recibido sin garantía.");
        }
    }

    async function cargarInventario() {
        const grid = document.getElementById("gridStock");
        let inversionAcumulada = 0;
        let criticos = 0;

        try {
            const snap = await getDocs(collection(db, `empresas/${empresaId}/inventario`));
            
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-30 italic text-[10px] uppercase font-black">Almacén vacío</div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(docSnap => {
                const item = docSnap.data();
                
                // --- FIX: Validación para evitar Undefined/NaN ---
                const cantidad = Number(item.cantidad || 0);
                const minimo = Number(item.stockMinimo || 0);
                const costo = Number(item.costo || 0);
                const precio = Number(item.precioVenta || 0);
                const esBajo = cantidad <= minimo;

                if (esBajo) criticos++;
                inversionAcumulada += (cantidad * costo);

                return `
                <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 group hover:border-cyan-500/30 transition-all text-left">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <p class="text-[7px] text-cyan-500 font-black uppercase tracking-widest mb-1">${item.categoria || 'REPUESTO'}</p>
                            <h3 class="text-white text-xs font-black uppercase leading-tight">${item.nombre || 'SIN NOMBRE'}</h3>
                        </div>
                        <div class="${esBajo ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'} w-2 h-2 rounded-full"></div>
                    </div>
                    <div class="flex justify-between items-end mt-6">
                        <div>
                            <p class="text-[7px] text-slate-500 font-black uppercase mb-1">Disponible</p>
                            <span class="text-3xl font-black ${esBajo ? 'text-red-500' : 'text-white'}">${cantidad}</span>
                            <span class="text-[8px] text-slate-500 font-bold ml-1 uppercase">unid</span>
                        </div>
                        <div class="text-right">
                            <p class="text-[7px] text-slate-500 font-black uppercase mb-1">P. Venta</p>
                            <p class="text-sm font-black text-emerald-400">$${new Intl.NumberFormat("es-CO").format(precio)}</p>
                        </div>
                    </div>
                </div>`;
            }).join("");

            document.getElementById("totalInversion").innerText = `$${new Intl.NumberFormat("es-CO").format(inversionAcumulada)}`;
            const alerta = document.getElementById("criticoAlerta");
            if(criticos > 0) {
                alerta.classList.remove("hidden");
                document.getElementById("itemsCriticos").innerText = `${criticos} Items`;
            } else {
                alerta.classList.add("hidden");
            }

        } catch (e) { console.error(e); }
    }

    renderLayout();
}
