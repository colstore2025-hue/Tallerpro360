/**
 * inventario.js - TallerPRO360 V5.3 📦
 * Reingeniería: Filtros Dinámicos y Recepción Externa Profesional
 */
import { collection, query, getDocs, addDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventario(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let filtroActual = "PROPIO"; // PROPIO o CLIENTE

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 animate-fade-in pb-32">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 class="text-2xl font-black text-white italic uppercase">ALMACÉN / <span class="text-cyan-400">STOCK</span></h1>
                    <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Control de Activos Nexus-X</p>
                </div>
                <div class="flex bg-black/40 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                    <button id="tabPropio" class="flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all">Taller</button>
                    <button id="tabCliente" class="flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all">Clientes</button>
                </div>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>

            <button id="btnMainAdd" class="fixed bottom-24 right-6 w-16 h-16 bg-cyan-500 rounded-[2rem] text-black shadow-2xl shadow-cyan-500/40 flex items-center justify-center z-50 active:scale-90 transition-all">
                <i class="fas fa-plus text-xl"></i>
            </button>
        </div>
        `;

        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = () => filtroActual === "PROPIO" ? abrirModalPropio() : abrirModalCliente();
        
        switchTab("PROPIO");
    };

    const switchTab = (tipo) => {
        filtroActual = tipo;
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        
        if(tipo === "PROPIO") {
            btnP.className = "flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase bg-cyan-500 text-black";
            btnC.className = "flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-slate-500";
        } else {
            btnC.className = "flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase bg-yellow-500 text-black";
            btnP.className = "flex-1 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-slate-500";
        }
        cargarData();
    };

    const cargarData = async () => {
        const grid = document.getElementById("gridStock");
        grid.innerHTML = `<p class="col-span-full text-center text-[10px] uppercase font-black opacity-20">Sincronizando...</p>`;
        
        const path = filtroActual === "PROPIO" ? "inventario" : "repuestos_externos";
        const snap = await getDocs(collection(db, `empresas/${empresaId}/${path}`));
        
        if (snap.empty) {
            grid.innerHTML = `<p class="col-span-full text-center py-20 text-slate-600 font-black uppercase text-[10px]">Sin existencias en esta categoría</p>`;
            return;
        }

        grid.innerHTML = snap.docs.map(doc => {
            const item = doc.data();
            return `
            <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-[7px] text-cyan-500 font-black uppercase mb-1">${filtroActual}</p>
                        <h3 class="text-white text-xs font-black uppercase">${item.nombre || item.item}</h3>
                    </div>
                    <div class="w-2 h-2 rounded-full ${filtroActual === 'PROPIO' ? 'bg-cyan-500' : 'bg-yellow-500'}"></div>
                </div>
                <div class="mt-6 flex justify-between items-end">
                    <div>
                        <p class="text-[6px] text-slate-500 font-black uppercase">Cantidad</p>
                        <p class="text-2xl font-black text-white">${item.cantidad || 1}</p>
                    </div>
                    ${item.precioVenta ? `<p class="text-xs font-black text-emerald-400">$${new Intl.NumberFormat().format(item.precioVenta)}</p>` : `<p class="text-[8px] text-slate-500 font-black uppercase">Placa: ${item.placa}</p>`}
                </div>
            </div>`;
        }).join("");
    };

    async function abrirModalPropio() {
        const { value: f } = await Swal.fire({
            title: 'NUEVO STOCK PROPIO',
            background: '#0a0f1d', color: '#fff',
            html: `
                <input id="sw-nom" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="NOMBRE">
                <input id="sw-can" type="number" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="CANTIDAD">
                <input id="sw-pre" type="number" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="PRECIO VENTA">
            `,
            preConfirm: () => ({
                nombre: document.getElementById('sw-nom').value.toUpperCase(),
                cantidad: Number(document.getElementById('sw-can').value),
                precioVenta: Number(document.getElementById('sw-pre').value),
                creadoEn: serverTimestamp()
            })
        });
        if(f) { await addDoc(collection(db, `empresas/${empresaId}/inventario`), f); switchTab("PROPIO"); }
    }

    async function abrirModalCliente() {
        const { value: f } = await Swal.fire({
            title: 'REPUESTO EXTERNO',
            background: '#0a0f1d', color: '#fff',
            html: `
                <input id="sw-pla" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-cyan-400 font-black" placeholder="PLACA">
                <input id="sw-ite" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="DESCRIPCIÓN">
            `,
            preConfirm: () => ({
                placa: document.getElementById('sw-pla').value.toUpperCase(),
                item: document.getElementById('sw-ite').value.toUpperCase(),
                fechaIngreso: serverTimestamp()
            })
        });
        if(f) { await addDoc(collection(db, `empresas/${empresaId}/repuestos_externos`), f); switchTab("CLIENTE"); }
    }

    renderLayout();
}
