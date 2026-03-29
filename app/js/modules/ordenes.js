/**
 * ordenes.js - TallerPRO360 NEXUS-X V23.0 🛰️
 * SISTEMA TITAN-SENTINEL: CONTROL TOTAL POR VOZ Y ESTADOS VIVOS
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, addDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let itemsOrden = [];
    let gastosAnexos = [];
    let fotosRecepcion = [];
    let ordenEdicionId = null;
    let unsubscribe = null;
    let faseActual = 'EN_TALLER';

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 animate-in fade-in duration-1000 pb-40 bg-[#010409] min-h-screen text-slate-100">
            
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/5 pb-10">
                <div class="relative group">
                    <h1 class="orbitron text-6xl font-black text-white italic tracking-tighter uppercase">
                        TITAN<span class="text-orange-500">SENTINEL</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 orbitron tracking-[0.5em] mt-2">V23.0 • LOGISTICS HUB ACTIVO</p>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnNuevaCotizacion" class="px-8 py-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl orbitron text-[10px] font-black text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
                        <i class="fas fa-file-invoice-dollar mr-2"></i> PRE-VUELO (COTIZAR)
                    </button>
                    <button id="btnNuevaOrden" class="px-10 py-5 bg-orange-600 rounded-2xl orbitron text-[10px] font-black text-black hover:bg-orange-400 transition-all shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                        <i class="fas fa-plus-circle mr-2"></i> NUEVO DESPLIEGUE
                    </button>
                </div>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-12">
                ${['COTIZACION', 'EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `
                    <button class="nav-fase-nexus shrink-0 px-8 py-5 rounded-2xl border border-white/5 bg-[#0d1117] transition-all" data-fase="${f}">
                        <span class="orbitron text-[10px] font-black tracking-widest text-slate-500 uppercase">${f.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>
        `;

        document.getElementById("btnNuevaOrden").onclick = () => abrirConsola('EN_TALLER');
        document.getElementById("btnNuevaCotizacion").onclick = () => abrirConsola('COTIZACION');
        vincularNavFases();
    };

    const abrirConsola = (fase, data = null) => {
        ordenEdicionId = data?.id || null;
        itemsOrden = data?.items || [];
        gastosAnexos = data?.gastosAnexos || [];
        fotosRecepcion = data?.fotos || [];
        
        const ws = document.getElementById("workspace");
        ws.classList.remove("hidden");
        ws.innerHTML = `
        <div class="bg-[#0d1117] border-2 border-orange-500/20 rounded-[3rem] p-8 lg:p-14 shadow-2xl relative animate-in slide-in-from-top-10">
            
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-5 space-y-8">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="orbitron text-sm font-black text-orange-500 tracking-widest">RECEPCIÓN & VOZ</h2>
                        <button id="btnOmniVoice" class="w-16 h-16 bg-orange-600 text-black rounded-full text-2xl animate-pulse shadow-lg"><i class="fas fa-microphone"></i></button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black p-4 rounded-2xl border border-white/10">
                            <label class="text-[8px] orbitron text-slate-500 block mb-2">IDENTIFICADOR_PLACA</label>
                            <input id="f-placa" value="${data?.placa || ''}" class="bg-transparent border-none text-2xl font-black text-white orbitron w-full outline-none uppercase" placeholder="---">
                        </div>
                        <div class="bg-black p-4 rounded-2xl border border-white/10">
                            <label class="text-[8px] orbitron text-slate-500 block mb-2">ENLACE_WHATSAPP</label>
                            <input id="f-tel" value="${data?.telefono || ''}" class="bg-transparent border-none text-xl font-bold text-white w-full outline-none" placeholder="300...">
                        </div>
                    </div>

                    <div class="bg-black p-4 rounded-2xl border border-white/10">
                        <label class="text-[8px] orbitron text-slate-500 block mb-2">NOMBRE_CLIENTE</label>
                        <input id="f-cliente" value="${data?.cliente || ''}" class="bg-transparent border-none text-xl font-bold text-white w-full outline-none uppercase" placeholder="NOMBRE COMPLETO">
                    </div>

                    <div class="space-y-4">
                        <p class="text-[9px] orbitron text-slate-500">REPORTE FOTOGRÁFICO DE INGRESO</p>
                        <div class="grid grid-cols-4 gap-2" id="boxFotos">
                            ${[1,2,3,4].map(i => `
                                <div class="aspect-square bg-black border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-500 overflow-hidden" onclick="document.getElementById('file-${i}').click()">
                                    <input type="file" id="file-${i}" hidden onchange="window.nexusPreview(this, ${i-1})">
                                    <img id="img-p-${i-1}" src="${fotosRecepcion[i-1] || ''}" class="${fotosRecepcion[i-1] ? '' : 'hidden'} object-cover w-full h-full">
                                    <i id="icon-p-${i-1}" class="fas fa-camera text-slate-700 ${fotosRecepcion[i-1] ? 'hidden' : ''}"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-7">
                    <div class="bg-black/40 rounded-[2.5rem] p-8 border border-white/5 h-full flex flex-col">
                        <div class="flex justify-between items-start mb-10">
                            <div>
                                <span class="orbitron text-[9px] text-emerald-500 block mb-2">CARGA TOTAL</span>
                                <h3 id="txtTotal" class="orbitron text-5xl font-black text-white tracking-tighter">$ 0</h3>
                            </div>
                            <div class="text-right">
                                <span class="orbitron text-[9px] text-red-500 block mb-2">GASTOS ANEXOS</span>
                                <h4 id="txtGastos" class="orbitron text-2xl font-black text-red-500">$ 0</h4>
                            </div>
                        </div>

                        <div id="listaItems" class="flex-grow space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar"></div>

                        <div class="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                            <button id="btnSave" class="py-6 bg-white text-black rounded-2xl orbitron font-black text-xs hover:bg-orange-500 transition-all">
                                ${ordenEdicionId ? 'SINCRONIZAR' : 'DESPLEGAR'} MISIÓN
                            </button>
                            <button onclick="document.getElementById('workspace').classList.add('hidden')" class="py-6 text-slate-500 orbitron text-[10px] font-black uppercase">
                                ABORTAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        window.nexusPreview = (input, idx) => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById(`img-p-${idx}`).src = e.target.result;
                    document.getElementById(`img-p-${idx}`).classList.remove('hidden');
                    document.getElementById(`icon-p-${idx}`).classList.add('hidden');
                    fotosRecepcion[idx] = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        document.getElementById("btnOmniVoice").onclick = () => iniciarEscucha();
        document.getElementById("btnSave").onclick = () => procesarOrden(fase);
        actualizarUIFinanciera();
        ws.scrollIntoView({ behavior: 'smooth' });
    };

    const iniciarEscucha = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return hablar("No disponible");
        const rec = new SpeechRecognition();
        rec.lang = 'es-CO';
        rec.onstart = () => { hablar("Dime los cargos"); document.getElementById("btnOmniVoice").classList.add("ring-4", "ring-orange-500"); };
        rec.onresult = (e) => { procesarComandoVoz(e.results[0][0].transcript.toLowerCase()); };
        rec.onend = () => document.getElementById("btnOmniVoice").classList.remove("ring-4", "ring-orange-500");
        rec.start();
    };

    const procesarComandoVoz = (frase) => {
        const numMatch = frase.match(/\d+/g);
        if (!numMatch) return hablar("No escuché el valor");
        const precio = parseInt(numMatch[0]) * (frase.includes("mil") ? 1000 : 1);
        const nombre = frase.replace(numMatch[0], "").replace("mil", "").replace("pesos", "").trim().toUpperCase();

        if (frase.includes("gasto") || frase.includes("cafetería")) {
            gastosAnexos.push({ nombre, monto: precio });
        } else if (frase.includes("oro") || frase.includes("mano de obra")) {
            itemsOrden.push({ tipo: 'MANO_OBRA', nombre, precio, cantidad: 1, total: precio });
        } else {
            itemsOrden.push({ tipo: 'REPUESTO', nombre, precio, cantidad: 1, total: precio });
        }
        actualizarUIFinanciera();
        hablar("Cargado correctamente");
    };

    const actualizarUIFinanciera = () => {
        const cont = document.getElementById("listaItems");
        const totalTxt = document.getElementById("txtTotal");
        const gastosTxt = document.getElementById("txtGastos");

        let t = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        let g = gastosAnexos.reduce((acc, i) => acc + i.monto, 0);

        cont.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center p-4 rounded-xl border-l-4 ${it.tipo === 'REPUESTO' ? 'border-emerald-500 bg-emerald-500/5' : 'border-amber-500 bg-amber-500/5'}">
                <div>
                    <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                    <span class="text-[8px] orbitron opacity-60">${it.tipo}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="orbitron font-black text-white">$${it.total.toLocaleString()}</span>
                    <button onclick="window.delNexusV23(${idx}, 'item')" class="text-red-500/20 hover:text-red-500 transition-all"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join("");

        totalTxt.innerText = `$ ${t.toLocaleString()}`;
        gastosTxt.innerText = `$ ${g.toLocaleString()}`;

        window.delNexusV23 = (i, type) => {
            if(type === 'item') itemsOrden.splice(i, 1);
            else gastosAnexos.splice(i, 1);
            actualizarUIFinanciera();
        };
    };

    const procesarOrden = async (fase) => {
        const payload = {
            placa: document.getElementById("f-placa").value.trim().toUpperCase(),
            cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
            telefono: document.getElementById("f-tel").value.trim(),
            items: itemsOrden,
            gastosAnexos,
            fotos: fotosRecepcion,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: fase,
            empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        try {
            if (ordenEdicionId) await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
            else {
                payload.creadoEn = serverTimestamp();
                await addDoc(collection(db, "ordenes"), payload);
            }
            document.getElementById("workspace").classList.add("hidden");
            Swal.fire({ icon: 'success', title: 'DATOS SINCRONIZADOS', background: '#0d1117', color: '#fff' });
        } catch (e) { console.error(e); }
    };

    function vincularNavFases() {
        document.querySelectorAll('.nav-fase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.nav-fase-nexus').forEach(b => b.classList.remove('border-orange-500', 'bg-orange-500/10'));
                btn.classList.add('border-orange-500', 'bg-orange-500/10');
                faseActual = btn.dataset.fase;
                escucharMisiones(faseActual);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    }

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 orbitron tracking-[0.5em]">SECTOR VACÍO</div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-[#0d1117] border-2 border-white/5 p-8 rounded-[2.5rem] hover:border-orange-500 transition-all group">
                    <div class="flex justify-between items-center mb-6">
                        <span class="orbitron text-2xl font-black text-white italic">${o.placa}</span>
                        <div class="flex gap-2">
                             <button onclick="window.borrarV23('${id}')" class="text-red-500/40 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                             <button onclick="window.abrirV23('${id}')" class="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-black shadow-lg"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                    <p class="text-xs font-bold text-slate-400 mb-6 uppercase">${o.cliente}</p>
                    <div class="bg-black p-5 rounded-2xl flex justify-between orbitron mb-6 shadow-inner">
                        <span class="text-[9px] text-orange-500">TOTAL CARGA</span>
                        <span class="text-xl font-black text-white">$${o.total.toLocaleString()}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick='window.waV23("${id}")' class="py-4 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] orbitron font-black hover:bg-emerald-500 hover:text-white transition-all">WHATSAPP</button>
                        <button onclick='window.printV23("${id}")' class="py-4 bg-white/5 text-white rounded-xl text-[9px] orbitron font-black hover:bg-white hover:text-black transition-all">PDF REPORT</button>
                    </div>
                    <select onchange="window.cambiarFaseV23('${id}', this.value)" class="w-full mt-4 bg-transparent border border-white/10 text-slate-500 p-3 rounded-xl text-[9px] orbitron font-black outline-none">
                        <option value="" disabled selected>TRASLADAR A...</option>
                        <option value="COTIZACION">COTIZACIÓN</option>
                        <option value="EN_TALLER">EN TALLER</option>
                        <option value="DIAGNOSTICO">DIAGNÓSTICO</option>
                        <option value="REPARACION">REPARACIÓN</option>
                        <option value="LISTO">LISTO / ENTREGAR</option>
                    </select>
                </div>`;
            }).join("");
        });

        window.abrirV23 = async (id) => {
            const s = await getDoc(doc(db, "ordenes", id));
            if(s.exists()) abrirConsola(s.data().estado, {...s.data(), id});
        };

        window.cambiarFaseV23 = async (id, nueva) => {
            await updateDoc(doc(db, "ordenes", id), { estado: nueva, ultimaActualizacion: serverTimestamp() });
            hablar(`Vehículo movido a ${nueva}`);
        };

        window.borrarV23 = async (id) => {
            const r = await Swal.fire({ title: '¿ELIMINAR?', icon: 'warning', showCancelButton: true, background: '#0d1117', color: '#fff' });
            if(r.isConfirmed) await deleteDoc(doc(db, "ordenes", id));
        };
    }

    renderBase();
}
