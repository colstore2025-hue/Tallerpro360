/**
 * inventario.js - TallerPRO360 V5.2 📦
 * Gestión de Stock Propio vs. Repuestos de Cliente (Corregido)
 */
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventario(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");

    container.innerHTML = `
    <div class="p-4 lg:p-8 animate-fade-in font-sans pb-32">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-black text-white italic tracking-tighter uppercase">
                    ALMACÉN / <span class="text-cyan-400">STOCK</span>
                </h1>
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Control de Activos e Insumos Externos</p>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
                <button id="btnNuevoInsumo" class="flex-1 md:flex-none bg-cyan-500 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase active:scale-95 shadow-lg shadow-cyan-500/20">
                    + Stock Propio
                </button>
                <button id="btnRepuestoCliente" class="flex-1 md:flex-none bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl font-black text-[10px] uppercase active:scale-95">
                    <i class="fas fa-user-tag mr-2 text-cyan-400"></i> Del Cliente
                </button>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Inversión Total</p>
                <p id="totalInversion" class="text-lg font-black text-white">$ 0</p>
            </div>
            <div id="criticoAlerta" class="bg-red-500/5 p-4 rounded-3xl border border-red-500/10 hidden animate-pulse">
                <p class="text-[7px] text-red-500 font-black uppercase tracking-widest mb-1">Stock Crítico</p>
                <p id="itemsCriticos" class="text-lg font-black text-red-500">0 Items</p>
            </div>
        </div>

        <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full py-20 text-center animate-pulse">
                <i class="fas fa-spinner fa-spin text-cyan-500 text-2xl mb-4"></i>
                <p class="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Sincronizando Almacén...</p>
            </div>
        </div>
    </div>
    `;

    // --- LÓGICA PARA REPUESTOS DE CLIENTE (Fuera del render del grid) ---
    document.getElementById("btnRepuestoCliente").onclick = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'RECEPCIÓN DE REPUESTO EXTERNO',
            background: '#0a0f1d',
            color: '#fff',
            html: `
                <div class="space-y-3 text-left">
                    <div>
                        <label class="text-[8px] uppercase font-black text-slate-500 tracking-widest">Placa del Vehículo</label>
                        <input id="swal-placa" class="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-cyan-400 font-black uppercase" placeholder="ABC-123">
                    </div>
                    <div>
                        <label class="text-[8px] uppercase font-black text-slate-500 tracking-widest">Descripción del Repuesto</label>
                        <input id="swal-item" class="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white" placeholder="Ej: Kit de Distribución Gates">
                    </div>
                    <div class="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <p class="text-[8px] text-yellow-500/80 italic leading-tight">
                            Exención de garantía: El taller no se hace responsable por fallas en repuestos suministrados por el cliente.
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'REGISTRAR INGRESO',
            confirmButtonColor: '#06b6d4',
            preConfirm: () => {
                const placa = document.getElementById('swal-placa').value.trim();
                const item = document.getElementById('swal-item').value.trim();
                if (!placa || !item) return Swal.showValidationMessage('Todos los campos son obligatorios');
                return { placa, item };
            }
        });

        if (formValues) {
            try {
                await addDoc(collection(db, `empresas/${empresaId}/repuestos_externos`), {
                    ...formValues,
                    fechaIngreso: serverTimestamp(),
                    estado: 'POR_INSTALAR'
                });
                hablar(`Repuesto para la placa ${formValues.placa} registrado satisfactoriamente.`);
                Swal.fire({ icon: 'success', title: 'Recibido', background: '#0a0f1d', color: '#fff' });
            } catch (e) { console.error(e); }
        }
    };

    async function cargarInventario() {
        const grid = document.getElementById("gridStock");
        let inversionAcumulada = 0;
        let criticos = 0;

        try {
            const q = query(collection(db, `empresas/${empresaId}/inventario`));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full p-20 text-center text-slate-700 font-black uppercase text-[10px] italic tracking-widest border-2 border-dashed border-white/5 rounded-[3rem]">No hay repuestos registrados</div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(docSnap => {
                const item = docSnap.data();
                const esBajo = Number(item.cantidad) <= Number(item.stockMinimo);
                if (esBajo) criticos++;
                inversionAcumulada += (Number(item.cantidad) * Number(item.costo || 0));

                return `
                <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div class="absolute -right-4 -top-4 opacity-[0.03] text-6xl text-white group-hover:rotate-12 transition-transform">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-[7px] text-cyan-500 font-black uppercase tracking-[0.2em] mb-1">${item.categoria || 'REPUESTO'}</p>
                            <h3 class="text-white text-xs font-black uppercase tracking-tighter leading-tight">${item.nombre}</h3>
                        </div>
                        <div class="${esBajo ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'} w-2 h-2 rounded-full"></div>
                    </div>
                    <div class="flex justify-between items-end mt-6">
                        <div>
                            <p class="text-[7px] text-slate-500 font-black uppercase mb-1">Disponible</p>
                            <span class="text-3xl font-black ${esBajo ? 'text-red-500' : 'text-white'}">${item.cantidad}</span>
                            <span class="text-[8px] text-slate-500 font-bold ml-1 uppercase">unid</span>
                        </div>
                        <div class="text-right">
                            <p class="text-[7px] text-slate-500 font-black uppercase mb-1">P. Venta</p>
                            <p class="text-sm font-black text-emerald-400">$${new Intl.NumberFormat("es-CO").format(item.precioVenta || 0)}</p>
                        </div>
                    </div>
                </div>`;
            }).join("");

            document.getElementById("totalInversion").innerText = `$${new Intl.NumberFormat("es-CO").format(inversionAcumulada)}`;
            if(criticos > 0) {
                document.getElementById("criticoAlerta").classList.remove("hidden");
                document.getElementById("itemsCriticos").innerText = `${criticos} Items`;
            }

        } catch (e) {
            grid.innerHTML = `<p class="text-red-500 text-[10px] font-black uppercase text-center py-10">Error de Conexión</p>`;
        }
    }

    cargarInventario();
}
