/**
 * inventario.js - TallerPRO360 V16.0 📦
 * Motor de Almacén Nexus-X Starlink
 */
import { collection, query, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function inventario(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let filtroActual = "PROPIO"; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            <header class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h1 class="orbitron text-2xl font-black text-white italic uppercase tracking-tighter">
                        ALMACÉN / <span class="text-cyan-400">STOCK</span>
                    </h1>
                    <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1">Control de Activos Nexus-X Starlink</p>
                </div>
                <div class="flex bg-black/60 p-1.5 rounded-[2rem] border border-white/10 w-full md:w-auto backdrop-blur-xl">
                    <button id="tabPropio" class="flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all duration-500 orbitron">Taller</button>
                    <button id="tabCliente" class="flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all duration-500 orbitron">Externos</button>
                </div>
            </header>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                </div>

            <button id="btnMainAdd" class="fixed bottom-28 right-8 w-20 h-20 bg-cyan-500 rounded-[2.5rem] text-black shadow-[0_20px_50px_rgba(0,242,255,0.3)] flex items-center justify-center z-50 active:scale-90 hover:rotate-90 transition-all duration-500">
                <i class="fas fa-plus text-2xl"></i>
            </button>
        </div>
        `;

        // Asignación de Eventos Blindada
        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = () => filtroActual === "PROPIO" ? abrirModalPropio() : abrirModalCliente();
        
        switchTab("PROPIO");
    };

    const switchTab = (tipo) => {
        filtroActual = tipo;
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        
        const activeClass = "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20";
        const inactiveClass = "text-slate-500 hover:text-white";

        if(tipo === "PROPIO") {
            btnP.className = `flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all orbitron ${activeClass}`;
            btnC.className = `flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all orbitron ${inactiveClass}`;
        } else {
            btnC.className = `flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all orbitron bg-yellow-500 text-black shadow-lg shadow-yellow-500/20`;
            btnP.className = `flex-1 px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all orbitron ${inactiveClass}`;
        }
        cargarData();
    };

    const cargarData = async () => {
        const grid = document.getElementById("gridStock");
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center py-20 opacity-40"><div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full mb-4"></div><p class="text-[8px] orbitron tracking-[0.4em]">SYNCING...</p></div>`;
        
        const path = filtroActual === "PROPIO" ? "inventario" : "repuestos_externos";
        const snap = await getDocs(collection(db, "empresas", empresaId, path));
        
        if (snap.empty) {
            grid.innerHTML = `<div class="col-span-full text-center py-20 border border-dashed border-white/5 rounded-[3rem]"><p class="text-slate-600 font-black uppercase text-[9px] tracking-widest orbitron italic">Base de datos vacía en este sector</p></div>`;
            return;
        }

        grid.innerHTML = snap.docs.map(doc => {
            const item = doc.data();
            const color = filtroActual === 'PROPIO' ? 'cyan-500' : 'yellow-500';
            return `
            <div class="bg-white/5 backdrop-blur-sm p-8 rounded-[3rem] border border-white/5 relative group hover:border-${color}/30 transition-all duration-500">
                <div class="flex justify-between items-start mb-6">
                    <div class="space-y-1">
                        <p class="text-[7px] text-${color} font-black uppercase tracking-widest orbitron italic">${filtroActual}</p>
                        <h3 class="text-white text-sm font-black uppercase tracking-tighter">${item.nombre || item.item}</h3>
                    </div>
                    <div class="w-10 h-10 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5">
                        <i class="fas ${filtroActual === 'PROPIO' ? 'fa-box' : 'fa-car-side'} text-${color} text-xs"></i>
                    </div>
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[6px] text-slate-500 font-black uppercase tracking-widest mb-1">Unidades</p>
                        <p class="text-3xl font-black text-white orbitron leading-none">${item.cantidad || 1}</p>
                    </div>
                    ${item.precioVenta ? 
                        `<div class="text-right"><p class="text-[6px] text-slate-500 font-black uppercase mb-1">Precio Venta</p><p class="text-sm font-black text-emerald-400 orbitron">$${new Intl.NumberFormat().format(item.precioVenta)}</p></div>` : 
                        `<div class="text-right"><p class="text-[6px] text-slate-500 font-black uppercase mb-1">Referencia</p><p class="text-[10px] text-yellow-500 font-black orbitron uppercase italic">${item.placa}</p></div>`}
                </div>
            </div>`;
        }).join("");
    };

    async function abrirModalPropio() {
        // Asegúrate de que Swal esté disponible globalmente o impórtalo
        const { value: f } = await window.Swal.fire({
            title: 'NUEVO ACTIVO TALLER',
            background: '#020617', color: '#fff',
            customClass: { popup: 'rounded-[2rem] border border-white/10' },
            html: `
                <div class="space-y-3 p-4">
                    <input id="sw-nom" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-cyan-500" placeholder="NOMBRE DEL REPUESTO">
                    <div class="grid grid-cols-2 gap-3">
                        <input id="sw-can" type="number" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-cyan-500" placeholder="CANTIDAD">
                        <input id="sw-pre" type="number" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-cyan-500" placeholder="PRECIO">
                    </div>
                </div>`,
            preConfirm: () => {
                const n = document.getElementById('sw-nom').value;
                if(!n) return window.Swal.showValidationMessage("Nombre requerido");
                return {
                    nombre: n.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value),
                    precioVenta: Number(document.getElementById('sw-pre').value),
                    creadoEn: serverTimestamp()
                }
            }
        });
        if(f) { 
            await addDoc(collection(db, "empresas", empresaId, "inventario"), f); 
            window.Swal.fire({ icon: 'success', title: 'ACTUALIZADO', background: '#020617', color: '#fff' });
            switchTab("PROPIO"); 
        }
    }

    async function abrirModalCliente() {
        const { value: f } = await window.Swal.fire({
            title: 'INGRESO EXTERNO',
            background: '#020617', color: '#fff',
            customClass: { popup: 'rounded-[2rem] border border-white/10' },
            html: `
                <div class="space-y-3 p-4">
                    <input id="sw-pla" class="w-full bg-black/60 p-5 rounded-2xl text-yellow-400 font-black border border-white/5 outline-none focus:border-yellow-500" placeholder="PLACA DEL VEHÍCULO">
                    <input id="sw-ite" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-yellow-500" placeholder="¿QUÉ REPUESTO TRAJO EL CLIENTE?">
                </div>`,
            preConfirm: () => ({
                placa: document.getElementById('sw-pla').value.toUpperCase(),
                item: document.getElementById('sw-ite').value.toUpperCase(),
                fechaIngreso: serverTimestamp()
            })
        });
        if(f) { 
            await addDoc(collection(db, "empresas", empresaId, "repuestos_externos"), f); 
            switchTab("CLIENTE"); 
        }
    }

    renderLayout();
}
