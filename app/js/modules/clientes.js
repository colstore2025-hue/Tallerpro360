/**
 * clientes.js - TallerPRO360 CRM ELITE V4.1 👥
 * Reingeniería: Registro Rápido y Vinculación Automática
 */
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  const renderBase = () => {
    container.innerHTML = `
      <div class="p-4 lg:p-8 animate-fade-in pb-32">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-black text-white italic uppercase">CRM / <span class="text-cyan-400">CLIENTES</span></h1>
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Base de Datos de Fidelización</p>
            </div>
            <button id="btnNuevoCliente" class="w-14 h-14 bg-cyan-500 rounded-2xl text-black flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-90 transition-all">
                <i class="fas fa-plus"></i>
            </button>
        </div>

        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>
    `;
    document.getElementById("btnNuevoCliente").onclick = abrirModalCliente;
    cargarClientes();
  };

  const abrirModalCliente = async () => {
    const { value: f } = await Swal.fire({
        title: 'REGISTRO NEXUS-X',
        background: '#0a0f1d', color: '#fff',
        html: `
            <input id="c-nom" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="NOMBRE">
            <input id="c-tel" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-white" placeholder="TELÉFONO / WHATSAPP">
            <input id="c-pla" class="w-full bg-black/40 p-4 rounded-xl mb-2 text-cyan-400 font-black" placeholder="PLACA VEHÍCULO">
        `,
        preConfirm: () => ({
            nombre: document.getElementById('c-nom').value.toUpperCase(),
            telefono: document.getElementById('c-tel').value,
            placaPrincipal: document.getElementById('c-pla').value.toUpperCase(),
            creadoEn: serverTimestamp()
        })
    });

    if(f) {
        await addDoc(collection(db, `empresas/${empresaId}/clientes`), f);
        hablar(`Bienvenido ${f.nombre} al ecosistema.`);
        cargarClientes();
    }
  };

  async function cargarClientes() {
    const list = document.getElementById("listaClientes");
    list.innerHTML = `<p class="col-span-full text-center text-[10px] font-black opacity-20 uppercase tracking-widest">Sincronizando Clientes...</p>`;
    
    const snap = await getDocs(query(collection(db, `empresas/${empresaId}/clientes`), orderBy("creadoEn", "desc")));
    
    list.innerHTML = snap.docs.map(doc => {
        const c = doc.data();
        return `
        <div class="bg-[#0f172a] p-5 rounded-[2.5rem] border border-white/5 flex items-center gap-4 group hover:border-cyan-500/30 transition-all">
            <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/5 text-cyan-400 font-black">
                ${c.nombre.charAt(0)}
            </div>
            <div class="flex-1">
                <h4 class="text-xs font-black text-white uppercase">${c.nombre}</h4>
                <p class="text-[8px] text-slate-500 font-black uppercase">Placa: ${c.placaPrincipal || '---'}</p>
            </div>
            <a href="https://wa.me/57${c.telefono}" target="_blank" class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <i class="fab fa-whatsapp text-xs"></i>
            </a>
        </div>`;
    }).join("");
  }

  renderBase();
}
