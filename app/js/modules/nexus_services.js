import { db } from "../core/firebase-config.js";
import { 
    collection, query, onSnapshot, orderBy, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- SERVICIO 1: MARKETPLACE ---
export async function renderMarket(container) {
    container.innerHTML = `
    <div class="p-6 lg:p-10 animate-in fade-in">
        <div class="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
            <h1 class="orbitron text-4xl font-black italic text-white">MARKET<span class="text-cyan-400">X</span></h1>
            <button onclick="location.hash='#publish_mision'" class="px-6 py-4 bg-white text-black orbitron text-[9px] font-black rounded-xl hover:bg-cyan-500 hover:text-white transition-all">NUEVA MISIÓN</button>
        </div>
        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
    </div>`;

    const grid = document.getElementById('grid-market');
    const q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"));

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        grid.innerHTML = items.map(p => `
            <div class="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 transition-all">
                <div class="aspect-square bg-black rounded-[1.5rem] mb-4 overflow-hidden">
                    <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover opacity-80">
                </div>
                <h3 class="text-xs font-black text-white uppercase truncate mb-3">${p.nombre}</h3>
                <p class="text-cyan-400 font-black orbitron text-sm">${p.precio}</p>
            </div>`).join('');
    });
}

// --- SERVICIO 2: PUBLISH ---
export async function renderPublish(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    container.innerHTML = `
    <div class="p-6 lg:p-12 max-w-2xl mx-auto animate-in slide-in-from-bottom">
        <h1 class="orbitron text-3xl font-black italic text-white mb-10 uppercase">PUBLISH<span class="text-white/20">CENTER</span></h1>
        <form id="f-pub" class="space-y-6 bg-[#0d1117] p-10 rounded-[3rem] border border-white/5">
            <input type="text" id="m_nom" required class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-cyan-500" placeholder="NOMBRE DEL ACTIVO">
            <input type="text" id="m_pre" required class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-cyan-400 font-black outline-none focus:border-cyan-500" placeholder="PRECIO">
            <select id="m_log" class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-white font-black">
                <option value="heavy">COLOMBIAN TRUCKS</option>
                <option value="usa">CHARLOTTE HUB (USA)</option>
            </select>
            <button type="submit" class="w-full py-6 bg-white text-black orbitron font-black text-[10px] rounded-[2rem] hover:bg-cyan-500 hover:text-white transition-all">EJECUTAR LANZAMIENTO</button>
        </form>
    </div>`;

    document.getElementById('f-pub').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('m_nom').value.toUpperCase(),
                precio: document.getElementById('m_pre').value,
                logisticaType: document.getElementById('m_log').value,
                empresaId: empresaId,
                creadoEn: serverTimestamp()
            });
            location.hash = "#marketplace_bridge";
        } catch (err) { alert("Error en conexión satelital"); }
    };
}
