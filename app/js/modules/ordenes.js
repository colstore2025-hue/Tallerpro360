/**
 * ordenes.js - NEXUS-X COMMAND CENTER V8.0 "PRO-EVO" 🛰️
 * MISIÓN: AUTOMATIZACIÓN TOTAL TALLERPRO360 + ESTRUCTURA SAP BI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- MOTOR DE DOCUMENTACIÓN ---
// Importación mediante window para evitar conflictos de módulos en la carga quirúrgica
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- 🖥️ RENDER CORE UI ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 selection:bg-cyan-500 selection:text-black">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/10 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-5 w-5 bg-red-600 rounded-full animate-pulse shadow-[0_0_25px_#ff0000]"></div>
                        <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">NEXUS_<span class="text-cyan-400">V8</span></h1>
                    </div>
                    <p class="text-[12px] orbitron text-cyan-500/70 tracking-[0.6em] uppercase italic font-bold">Logistics Neural Interface // TALLER-PRO-EVO</p>
                </div>
                <button id="btnNewMission" class="group relative px-12 py-7 bg-cyan-500 text-black rounded-full orbitron text-sm font-black hover:bg-white hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span class="relative z-10">INICIAR MISIÓN +</span>
                </button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(fase => `
                    <button class="fase-tab relative overflow-hidden p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[10px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-500'} group-hover:text-cyan-400 mb-3 block font-black tracking-widest">${fase}</span>
                        <h3 id="count-${fase}" class="text-5xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto border-4 border-cyan-500/20 m-2 rounded-[3rem]"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    // --- 📡 REAL-TIME ENGINE (REFORMADO PARA KPI BI) ---
    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0, ENTREGADO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });

            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-10 rounded-[3.5rem] border-2 border-white/5 hover:border-cyan-400 transition-all cursor-pointer group animate-in zoom-in relative overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                         <span class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-3 w-3 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}"></div>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-[11px] text-cyan-500/50 orbitron font-black uppercase">${o.cliente || 'NO_NAME'}</p>
                        <span class="text-[8px] orbitron border border-white/10 px-2 py-1 rounded text-slate-500 font-bold">${o.clase_vehiculo || 'LIVIANO'}</span>
                    </div>
                    <div class="flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <span class="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Utilidad Estimada</span>
                            <span class="text-xl font-black ${Number(o.costos_totales?.utilidad || 0) > 0 ? 'text-emerald-400' : 'text-white'} orbitron">$ ${Number(o.costos_totales?.utilidad || 0).toLocaleString()}</span>
                        </div>
                        <div class="text-right">
                             <span class="text-[8px] text-slate-600 block orbitron uppercase font-black">${o.tipo_orden || 'MECANICA'}</span>
                        </div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 🧮 AUDITORÍA FINANCIERA FORENSE V8.0 (NEXUS BI INTEGRATED) ---
    const recalcularFinanzas = () => {
        let subtotalConIVA = 0;
        let costoTotalTaller = 0;

        ordenActiva.items.forEach(i => {
            const valorVenta = Number(i.venta || 0);
            subtotalConIVA += valorVenta;
            if (i.origen === "TALLER") costoTotalTaller += Number(i.costo || 0);
        });

        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const pago_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const granTotal = subtotalConIVA; 
        const baseGravable = granTotal / 1.19;
        const totalIVA = granTotal - baseGravable;

        const utilidadNeta = baseGravable - (costoTotalTaller + pago_tecnico + g_insumos);
        const saldoPendiente = granTotal - anticipo;

        ordenActiva.costos_totales = {
            base_gravable: baseGravable,
            iva_19: totalIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente,
            adelanto_tecnico: pago_tecnico,
            gastos_operativos: g_insumos
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-widest font-black mb-1">Saldo a Pagar</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'} animate-pulse font-black text-xl">$ ${saldoPendiente.toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- 📄 NEXUS-X DOCUMENT ENGINE (ESTILO TALLERPRO360) ---
    window.generarDocumentoNexus = (tipo) => {
        const doc = new jspdf.jsPDF();
        const config = {
            empresa: "TALLER PRO 360",
            nit: "901.XXX.XXX-X",
            colorNexus: [6, 182, 212], // Cyan
            colorDark: [13, 17, 23]
        };

        // Header Estilo SAP BI
        doc.setFillColor(config.colorDark[0], config.colorDark[1], config.colorDark[2]);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text(tipo === 'MANIFIESTO' ? "ORDEN DE TRABAJO" : "FACTURA DE SERVICIO", 15, 25);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${config.empresa} | LOGISTICS NEURAL INTERFACE`, 15, 33);
        doc.text(`ID OPERACIÓN: ${ordenActiva.id}`, 15, 38);

        // Bloque Datos Cliente & Vehículo
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(230, 230, 230);
        doc.line(15, 50, 195, 50);
        
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL SERVICIO", 15, 60);
        doc.setFont("helvetica", "normal");
        doc.text(`CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 68);
        doc.text(`TELÉFONO: ${ordenActiva.telefono}`, 15, 74);
        doc.text(`PLACA: ${ordenActiva.placa}`, 110, 68);
        doc.text(`FECHA: ${new Date().toLocaleString()}`, 110, 74);

        // Tabla de Items (Insumos y Mano de Obra)
        const rows = ordenActiva.items.map(i => [
            i.desc.toUpperCase(),
            i.tipo,
            `$ ${Number(i.venta).toLocaleString()}`
        ]);

        doc.autoTable({
            startY: 85,
            head: [['DESCRIPCIÓN DEL SERVICIO / REPUESTO', 'TIPO', 'SUBTOTAL']],
            body: rows,
            headStyles: { fillColor: config.colorNexus, textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 4 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const finalY = doc.lastAutoTable.finalY + 10;

        // Desglose Financiero SAP
        doc.setFontSize(10);
        doc.text(`BASE GRAVABLE:`, 130, finalY);
        doc.text(`$ ${Math.round(ordenActiva.costos_totales.base_gravable).toLocaleString()}`, 170, finalY, { align: 'right' });
        
        doc.text(`IVA (19%):`, 130, finalY + 7);
        doc.text(`$ ${Math.round(ordenActiva.costos_totales.iva_19).toLocaleString()}`, 170, finalY + 7, { align: 'right' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL A PAGAR:`, 130, finalY + 16);
        doc.text(`$ ${Math.round(ordenActiva.costos_totales.gran_total).toLocaleString()}`, 170, finalY + 16, { align: 'right' });

        if(tipo === 'MANIFIESTO' && ordenActiva.costos_totales.saldo_pendiente > 0) {
            doc.setTextColor(220, 38, 38);
            doc.text(`SALDO PENDIENTE:`, 130, finalY + 24);
            doc.text(`$ ${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}`, 170, finalY + 24, { align: 'right' });
        }

        // Pie de Página & QR Simbolico
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("Este documento es un soporte digital generado por NEXUS-X V8 PRO-EVO. No representa una factura cambiaria hasta su validación DIAN.", 15, 285);

        doc.save(`${tipo}_${ordenActiva.placa}_${Date.now()}.pdf`);
        hablar(`Documento ${tipo} generado`);
    };

    // --- 🔗 ACTION LINKS & SECURITY V8.0 ---
    const vincularAccionesTerminal = () => {
        const safeClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

        safeClick("btnSincronizar", ejecutarSincronizacionNexus);
        safeClick("btnCloseTerminal", () => document.getElementById("nexus-terminal").classList.add("hidden"));
        safeClick("btnCaptureVisual", () => gestionarMultimedia('INICIAR'));
        safeClick("btnShutter", () => gestionarMultimedia('CAPTURAR'));
        safeClick("btnCancelCam", () => gestionarMultimedia('CANCELAR'));

        safeClick("btnDictar", () => {
            if(!isRecording) { 
                recognition?.start(); isRecording = true; 
                document.getElementById("rec-indicator")?.classList.remove("hidden");
                hablar("Nexus escuchando");
            } else { 
                recognition?.stop(); isRecording = false; 
                document.getElementById("rec-indicator")?.classList.add("hidden"); 
            }
        });

        if(recognition) {
            recognition.onresult = (e) => { 
                const log = document.getElementById("ai-log-display");
                if(log) log.value += " " + e.results[0][0].transcript; 
            };
        }

        safeClick("btnWppDirect", () => {
            const nombre = document.getElementById("f-cliente").value;
            const tel = document.getElementById("f-telefono").value.replace(/\D/g, '');
            const placa = document.getElementById("f-placa").value;
            const estado = document.getElementById("f-estado").value;
            const saldo = Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString();
            
            const msg = `*NEXUS-X REPORT: ${placa}*\n\nHola ${nombre}, su vehículo ha pasado a estado: *${estado}*.\n\n💰 *Saldo pendiente:* $${saldo}\n\n📄 _Se adjunta soporte técnico digital._`;
            if(tel) window.open(`https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        });

        safeClick("btnAddRepuesto", () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO INSUMO', costo: 0, venta: 0, origen: 'TALLER', sku: '' }); 
            recalcularFinanzas(); 
        });
        
        safeClick("btnAddMano", async () => { 
            const { value: tecnico } = await Swal.fire({
                title: 'ASIGNAR ESPECIALISTA',
                background: '#0d1117', color: '#fff',
                input: 'text', inputPlaceholder: 'Nombre del Técnico...',
                showCancelButton: true
            });
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: `LABOR: ${tecnico || 'GENERAL'}`, costo: 0, venta: 0, origen: 'TALLER', tecnico: tecnico || 'GENERAL' }); 
            recalcularFinanzas(); 
        });
    };

    // --- 💾 DATABASE SYNC (SAP BI INTEGRATED) ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> TRANSMITIENDO...`;
        btn.disabled = true;
        
        try {
            const placa = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placa) throw new Error("IDENTIFICADOR REQUERIDO");

            const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            const finalData = {
                ...ordenActiva,
                id: docId, empresaId,
                placa,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                tipo_orden: document.getElementById("f-tipo-orden").value,
                clase_vehiculo: document.getElementById("f-clase-vehiculo").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "ordenes", docId), finalData);

            // Registro en Contabilidad si hay flujo de caja
            if(finalData.finanzas.gastos_varios > 0 || finalData.finanzas.adelanto_tecnico > 0) {
                await setDoc(doc(db, "contabilidad", `MOV_${docId}`), {
                    tipo: 'EGRESO_ORDEN',
                    monto: finalData.finanzas.gastos_varios + finalData.finanzas.adelanto_tecnico,
                    ordenId: docId,
                    fecha: serverTimestamp(),
                    descripcion: `EGRESO OT: ${placa} | ${finalData.tipo_orden}`
                });
            }

            Swal.fire({ icon: 'success', title: 'MISSION SYNCED', background: '#010409', color: '#06b6d4', timer: 2000 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'FAILURE', text: err.message, background: '#0d1117', color: '#fff' });
        } finally { 
            btn.innerHTML = `🛰️ SYNC NEXUS`;
            btn.disabled = false; 
        }
    };

    // --- 📹 MULTIMEDIA ENGINE ---
    const gestionarMultimedia = async (accion) => {
        const video = document.getElementById('video-feed');
        const viewport = document.getElementById('camera-viewport');
        const canvas = document.createElement('canvas');

        if (accion === 'INICIAR') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                viewport.classList.remove('hidden');
            } catch (err) { Swal.fire("Error de cámara", err.message, "error"); }
        } else if (accion === 'CAPTURAR') {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const link = document.createElement('a');
            link.download = `NEXUS_EV_${ordenActiva.placa}_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            link.click();
            gestionarMultimedia('CANCELAR');
        } else {
            if(video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
            viewport.classList.add('hidden');
        }
    };

    // --- 🧩 WINDOW GLOBALS ---
    window.buscarEnInventario = async (idx) => {
        const snap = await getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)));
        const { value: res } = await Swal.fire({
            title: 'BÓVEDA DE REPUESTOS',
            background: '#0d1117', color: '#fff',
            input: 'select',
            inputOptions: Object.fromEntries(snap.docs.map(d => [JSON.stringify({id: d.id, n: d.data().nombre, c: d.data().costo, v: d.data().precioVenta}), `${d.data().nombre} ($${d.data().precioVenta})`])),
            showCancelButton: true
        });
        if (res) {
            const data = JSON.parse(res);
            ordenActiva.items[idx] = { ...ordenActiva.items[idx], desc: data.n, costo: data.c, venta: data.v, sku: data.id };
            recalcularFinanzas();
        }
    };

    window.abrirTerminalNexus = (id) => {
        document.getElementById("nexus-terminal").classList.remove("hidden");
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { 
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', 
                tipo_orden: 'MECANICA', clase_vehiculo: 'LIVIANO', 
                items: [], bitacora_ia: '', 
                finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0 },
                costos_totales: { base_gravable: 0, iva_19: 0, gran_total: 0, utilidad: 0, saldo_pendiente: 0 }
            };
            renderTerminal();
        }
    };

    window.toggleOrigenItem = (idx) => { 
        ordenActiva.items[idx].origen = ordenActiva.items[idx].origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(ordenActiva.items[idx].origen === 'CLIENTE') ordenActiva.items[idx].costo = 0;
        recalcularFinanzas(); 
    };

    window.editItemNexus = (idx, campo, val) => { 
        ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val; 
        recalcularFinanzas(); 
    };

    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}

    // --- 📄 NEXUS-X DOCUMENT ENGINE (SAP BI STYLE) ---
    window.generarDocumentoNexus = (tipo) => {
        const doc = new jspdf.jsPDF();
        const config = {
            empresa: "TALLER LOS MOTORES",
            nit: "41532245",
            colorPrincipal: [6, 182, 212] // Cyan Nexus
        };

        // Header Estilo SAP BI
        doc.setFillColor(13, 17, 23);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(tipo === 'MANIFIESTO' ? "MANIFIESTO DE SERVICIO" : "REPORTE DE SALIDA SAP", 15, 25);
        
        doc.setFontSize(10);
        doc.text(`LOGÍSTICA NEXUS-X | ${config.empresa}`, 15, 32);

        // Datos del Cliente/Vehículo
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 50);
        doc.text(`VEHÍCULO (PLACA): ${ordenActiva.placa}`, 15, 55);
        doc.text(`FECHA: ${new Date().toLocaleString()}`, 140, 50);

        // Tabla de Items (Nexus AutoTable)
        const tableRows = ordenActiva.items.map(i => [
            i.desc.toUpperCase(),
            i.tipo,
            `$ ${Number(i.venta).toLocaleString()}`
        ]);

        doc.autoTable({
            startY: 65,
            head: [['DESCRIPCIÓN', 'TIPO', 'VALOR']],
            body: tableRows,
            headStyles: { fillColor: config.colorPrincipal, textColor: 0 },
            styles: { fontSize: 8, cellPadding: 3 },
            theme: 'striped'
        });

        const finalY = doc.lastAutoTable.finalY + 10;

        // Resumen Financiero Forense
        doc.setFontSize(11);
        doc.text(`SUBTOTAL: $ ${Math.round(ordenActiva.costos_totales.base_gravable).toLocaleString()}`, 140, finalY);
        doc.text(`IVA (19%): $ ${Math.round(ordenActiva.costos_totales.iva_19).toLocaleString()}`, 140, finalY + 7);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`TOTAL: $ ${Math.round(ordenActiva.costos_totales.gran_total).toLocaleString()}`, 140, finalY + 15);
        
        if(tipo === 'MANIFIESTO' && ordenActiva.costos_totales.saldo_pendiente > 0) {
            doc.setTextColor(220, 38, 38);
            doc.text(`SALDO A PAGAR: $ ${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}`, 140, finalY + 23);
        }

        // Pie de página Legal
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.setFont("helvetica", "italic");
        doc.text("Este documento es una representación digital del sistema Nexus-X Starlink V8.0. Su validez legal depende de la factura electrónica correspondiente.", 15, 285);

        doc.save(`${tipo}_${ordenActiva.placa}_${Date.now()}.pdf`);
        hablar(`Documento ${tipo} generado con éxito`);
    };

    // --- 🔗 ACTION LINKS & SECURITY V8.0 ---
    const vincularAccionesTerminal = () => {
        const safeClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

        safeClick("btnSincronizar", ejecutarSincronizacionNexus);
        safeClick("btnCloseTerminal", () => document.getElementById("nexus-terminal").classList.add("hidden"));
        safeClick("btnCaptureVisual", () => gestionarMultimedia('INICIAR'));
        safeClick("btnShutter", () => gestionarMultimedia('CAPTURAR'));
        safeClick("btnCancelCam", () => gestionarMultimedia('CANCELAR'));

        safeClick("btnDictar", () => {
            if(!isRecording) { 
                recognition?.start(); isRecording = true; 
                document.getElementById("rec-indicator")?.classList.remove("hidden");
                hablar("Nexus escuchando");
            } else { 
                recognition?.stop(); isRecording = false; 
                document.getElementById("rec-indicator")?.classList.add("hidden"); 
            }
        });

        if(recognition) {
            recognition.onresult = (e) => { 
                const log = document.getElementById("ai-log-display");
                if(log) log.value += " " + e.results[0][0].transcript; 
            };
        }

        safeClick("btnWppDirect", () => {
            const nombre = document.getElementById("f-cliente").value;
            const tel = document.getElementById("f-telefono").value.replace(/\D/g, '');
            const placa = document.getElementById("f-placa").value;
            const msg = `*TALLER PRO 360 REPORT*\nVehículo: ${placa}\nHola ${nombre}, su vehículo se encuentra en estado: ${document.getElementById("f-estado").value}.\n\n*Saldo:* $${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}\n\nReporte Técnico:\n${document.getElementById("ai-log-display").value}`;
            if(tel) window.open(`https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        });

        safeClick("btnAddRepuesto", () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'REPUESTO NUEVO', costo: 0, venta: 0, origen: 'TALLER', sku: '' }); 
            recalcularFinanzas(); 
        });
        
        safeClick("btnAddMano", async () => { 
            const { value: tecnico } = await Swal.fire({
                title: 'ASIGNAR ESPECIALISTA',
                background: '#0d1117', color: '#fff',
                input: 'text', inputLabel: 'Nombre del Técnico',
                inputPlaceholder: 'Escriba o busque...',
                showCancelButton: true
            });
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: `LABOR: ${tecnico || 'GENERAL'}`, costo: 0, venta: 0, origen: 'TALLER', tecnico: tecnico || 'GENERAL' }); 
            recalcularFinanzas(); 
        });
    };

    // --- 📹 MULTIMEDIA ENGINE (OFF-CLOUD) ---
    const gestionarMultimedia = async (accion) => {
        const video = document.getElementById('video-feed');
        const viewport = document.getElementById('camera-viewport');
        const canvas = document.createElement('canvas');

        if (accion === 'INICIAR') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                viewport.classList.remove('hidden');
            } catch (err) { Swal.fire("Error", "Cámara no disponible", "error"); }
        } else if (accion === 'CAPTURAR') {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const link = document.createElement('a');
            link.download = `PRO360_EV_${ordenActiva.placa}_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            link.click();
            gestionarMultimedia('CANCELAR');
        } else {
            if(video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
            viewport.classList.add('hidden');
        }
    };

    // --- 💾 DATABASE SYNC (CONTABILIDAD + SAP BI) ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> SYNCING...`;
        
        try {
            const placa = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placa) throw new Error("IDENTIFICADOR REQUERIDO");

            const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            const finalData = {
                ...ordenActiva,
                id: docId, empresaId,
                placa,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                tipo_orden: document.getElementById("f-tipo-orden").value,
                clase_vehiculo: document.getElementById("f-clase-vehiculo").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                finanzas: {
                    anticipo_cliente: Number(document.getElementById("f-anticipo-cliente").value),
                    gastos_varios: Number(document.getElementById("f-gastos-varios").value),
                    adelanto_tecnico: Number(document.getElementById("f-adelanto-tecnico").value)
                },
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "ordenes", docId), finalData);

            if(finalData.finanzas.gastos_varios > 0 || finalData.finanzas.adelanto_tecnico > 0) {
                await setDoc(doc(db, "contabilidad", `MOV_${docId}`), {
                    tipo: 'EGRESO_ORDEN',
                    monto: finalData.finanzas.gastos_varios + finalData.finanzas.adelanto_tecnico,
                    ordenId: docId,
                    fecha: serverTimestamp(),
                    descripcion: `Gastos/Nómina Orden ${placa} (${finalData.tipo_orden})`
                });
            }

            Swal.fire({ icon: 'success', title: 'MISSION SYNCED', background: '#010409', color: '#06b6d4', timer: 1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'FAILURE', text: err.message });
        } finally { 
            btn.disabled = false; 
            btn.innerHTML = `🛰️ SYNC NEXUS`;
        }
    };

    window.abrirTerminalNexus = (id) => {
        document.getElementById("nexus-terminal").classList.remove("hidden");
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { 
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', 
                tipo_orden: 'MECANICA', clase_vehiculo: 'LIVIANO', 
                items: [], bitacora_ia: '', 
                finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0 },
                costos_totales: { base_gravable: 0, iva_19: 0, gran_total: 0, utilidad: 0, saldo_pendiente: 0 }
            };
            renderTerminal();
        }
    };

    window.toggleOrigenItem = (idx) => { 
        ordenActiva.items[idx].origen = ordenActiva.items[idx].origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(ordenActiva.items[idx].origen === 'CLIENTE') ordenActiva.items[idx].costo = 0;
        recalcularFinanzas(); 
    };

    window.editItemNexus = (idx, campo, val) => { 
        ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val; 
        recalcularFinanzas(); 
    };

    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
