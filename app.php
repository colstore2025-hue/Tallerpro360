<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>TallerPRO360 Elite - Nexus-X Starlink SAS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0f172a">
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <style>
    :root { 
      --primary: #0f172a; --secondary: #1e293b; --success: #16a34a; 
      --accent: #3b82f6; --danger: #ef4444; --gold: #f59e0b; --gray: #f1f5f9; 
    }
    
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: var(--gray); padding-bottom: 90px; overflow-x: hidden; color: var(--primary); }
    
    /* Header Branding Nexus-X */
    header { 
      background: var(--primary); color: white; padding: 15px; text-align: center; 
      position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
      border-bottom: 3px solid var(--gold); 
    }
    header strong { font-size: 1.2rem; letter-spacing: 1px; display: block; }
    header small { font-size: 0.65rem; color: var(--gold); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }

    /* Pantalla de Seguridad Starlink */
    #auth-screen { 
      background: radial-gradient(circle at top, #1e293b, #0f172a); 
      height: 100vh; color: white; display: flex; flex-direction: column; 
      justify-content: center; position: fixed; top: 0; left: 0; z-index: 9999; width: 100%; 
    }
    .auth-card { 
      background: white; color: var(--primary); margin: 25px; padding: 35px; 
      border-radius: 28px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); 
    }
    
    /* Navegación Táctica */
    .nav-tabs { 
      display: flex; background: white; border-bottom: 1px solid #e2e8f0; 
      position: sticky; top: 72px; z-index: 99; overflow-x: auto; 
    }
    .tab { 
      flex: 1; min-width: 85px; padding: 15px 5px; text-align: center; 
      cursor: pointer; font-weight: 800; font-size: 0.65rem; color: #64748b; 
      transition: 0.3s; border-bottom: 4px solid transparent;
    }
    .tab.active { border-bottom: 4px solid var(--accent); color: var(--accent); background: #f0f9ff; }
    #tab-admin { background: #000 !important; color: var(--gold) !important; display: none; }

    .container { padding: 15px; max-width: 650px; margin: auto; }
    .card { 
      background: white; padding: 20px; border-radius: 24px; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin-bottom: 20px; 
      border: 1px solid #eef2f6; 
    }
    
    /* Inputs Estilo Premium */
    label { font-size: 0.7rem; font-weight: 900; color: var(--secondary); margin-bottom: 5px; display: block; text-transform: uppercase; }
    input, textarea, select { 
      width: 100%; padding: 14px; margin-bottom: 15px; border: 2px solid #e2e8f0; 
      border-radius: 14px; font-size: 16px; box-sizing: border-box; transition: 0.3s;
    }
    input:focus { border-color: var(--accent); outline: none; background: #f8fbff; }
    
    /* Botonera */
    .btn { 
      width: 100%; padding: 16px; border: none; border-radius: 14px; 
      font-weight: 800; cursor: pointer; color: white; font-size: 14px; 
      text-transform: uppercase; display: flex; align-items: center; 
      justify-content: center; gap: 10px; transition: 0.2s active;
    }
    .btn:active { transform: scale(0.98); }
    .btn-main { background: var(--success); box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); }
    .btn-accent { background: var(--accent); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .btn-voice { background: var(--primary); border: 2px solid var(--gold); color: var(--gold); }
    .btn-camera { background: #6366f1; }
    .btn-edit { background: var(--gold); padding: 8px 12px; font-size: 0.65rem; width: auto; border-radius: 10px; color: var(--primary); }
    
    /* Checklist */
    .checklist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
    .check-item { 
      background: var(--gray); padding: 12px; border-radius: 12px; 
      display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 700; 
    }
    .check-item input { width: auto; margin: 0; }

    /* Passport Visual */
    .passport-header { 
      background: linear-gradient(135deg, var(--primary), #1e293b); color: white; 
      padding: 20px; border-radius: 20px; text-align: center; margin-bottom: 20px; 
      border: 1px solid var(--gold); position: relative; overflow: hidden;
    }
    
    .hidden { display: none !important; }
    .list-item { 
      background: white; padding: 18px; border-radius: 18px; margin-bottom: 12px; 
      border-left: 6px solid var(--accent); display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    /* Status Badges */
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; margin-left: 5px; }
    .badge-trial { background: #fee2e2; color: #dc2626; }
    .badge-active { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>

<div id="loader-nexus" class="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500">
    <div class="relative">
        <div class="w-24 h-24 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
        <i class="fas fa-satellite-dish text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse"></i>
    </div>
    <h2 class="mt-6 text-white font-black tracking-[0.2em] text-sm uppercase">Nexus-X Starlink</h2>
    <p class="text-gold/50 text-[10px] uppercase mt-2 tracking-widest" id="loader-status">Sincronizando Red SAS...</p>
</div>

<script>
// Función para ocultar el loader cuando la red esté lista
function finalizarCargaNexus() {
    const loader = document.getElementById('loader-nexus');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
}

// Llamar al finalizar la carga de Firebase o después de 2 segundos
window.addEventListener('load', () => {
    setTimeout(finalizarCargaNexus, 2000);
});
</script>

<div id="auth-screen">
  <div class="auth-card">
    <div style="text-align:center; margin-bottom:25px;">
      <h2 style="margin:0; font-weight:900; font-size:1.8rem;">TallerPRO360</h2>
      <small style="color:var(--accent); font-weight:900;">SISTEMA LOGÍSTICO NEXUS-X STARLINK</small>
    </div>
    
    <div id="login-form">
      <label>ACCESO AUTORIZADO</label>
      <input id="auth-email" type="email" placeholder="Correo del taller">
      <input id="auth-pass" type="password" placeholder="Contraseña">
      <button class="btn btn-accent" onclick="handleAuth('login')">INICIAR SESIÓN</button>
      <p style="text-align: center; font-size: 0.85rem; margin-top:20px;" onclick="toggleAuth()">¿Nuevo taller? <b style="color:var(--accent)">Registrar en la Red</b></p>
    </div>

    <div id="register-form" class="hidden">
      <label>REGISTRO DE NUEVA FIRMA</label>
      <input id="reg-taller" type="text" placeholder="Nombre Legal del Taller">
      <input id="reg-email" type="email" placeholder="Email Administrativo">
      <input id="reg-pass" type="password" placeholder="Crear Contraseña">
      <button class="btn btn-main" onclick="handleAuth('register')">ACTIVAR LICENCIA TRIAL</button>
      <p style="text-align: center; font-size: 0.85rem; margin-top:20px;" onclick="toggleAuth()">Ya soy parte de la red, <b>Ingresar</b></p>
    </div>
  </div>
</div>

<header>
  <strong>TallerPRO360 Elite</strong>
  <small id="display-taller">Validando Nexus-X Starlink...</small>
</header>

<nav class="nav-tabs">
  <div class="tab active" onclick="showTab('ordenes')"><i class="fas fa-tools fa-lg"></i><br>ORDENES</div>
  <div class="tab" onclick="showTab('passport')"><i class="fas fa-id-card fa-lg"></i><br>PASSPORT</div>
  <div class="tab" onclick="showTab('finanzas')"><i class="fas fa-wallet fa-lg"></i><br>CAJA</div>
  <div class="tab" id="tab-admin" onclick="showTab('admin')"><i class="fas fa-crown fa-lg"></i><br>CEO</div>
</nav>

<div class="container">
  
  <section id="sec-ordenes">
    <div class="card" style="background: var(--primary); text-align: center;">
      <button id="btn-voz" class="btn btn-voice"><i class="fas fa-microphone"></i> DICTADO POR VOZ STARLINK</button>
    </div>

    <div class="card">
      <h3 style="margin:0 0 20px 0;"><i class="fas fa-file-medical"></i> Recepción de Vehículo</h3>
      <input id="o-id" type="hidden">
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div>
          <label>PLACA</label>
          <input id="o-placa" placeholder="ABC-123" style="text-transform: uppercase; font-weight:900; font-size:1.4rem; text-align:center; color:var(--accent);">
        </div>
        <div>
          <label>MODELO</label>
          <input id="o-modelo" type="number" placeholder="Ej: 2025">
        </div>
      </div>

      <label>MARCA Y REFERENCIA</label>
      <input id="o-marca" placeholder="Ej: Kenworth T800 / Toyota Hilux">

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div>
          <label>KILOMETRAJE</label>
          <input id="o-km" type="number" placeholder="KM">
        </div>
        <div>
          <label>NIVEL GASOLINA</label>
          <select id="o-gas">
            <option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option>
          </select>
        </div>
      </div>

      <label>DATOS DEL PROPIETARIO</label>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <input id="o-cliente" placeholder="Nombre Completo">
        <input id="o-tel" type="tel" placeholder="WhatsApp (Sin +57)">
      </div>

      <label>INVENTARIO DE SEGURIDAD</label>
      <div class="checklist-grid">
        <div class="check-item"><input type="checkbox" class="chk-item" value="Radio"> Radio</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Herramienta"> Gato/Hta</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Llanta"> Repuesto</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Extintor"> Extintor</div>
      </div>

      <label>DIAGNÓSTICO Y TRABAJO</label>
      <textarea id="o-trabajo" placeholder="Describa la falla o trabajo solicitado..." rows="5"></textarea>
      
      <button class="btn btn-main" onclick="saveOrder()"><i class="fas fa-cloud-upload-alt"></i> PROCESAR Y ENVIAR WHATSAPP</button>
    </div>
    
    <div id="lista-ordenes"></div>
  </section>

  <section id="sec-passport" class="hidden">
    <div class="passport-header">
      <i class="fas fa-satellite fa-3x" style="color:var(--gold); margin-bottom:10px;"></i>
      <h3>VEHICLE PASSPORT HISTORY</h3>
      <p style="font-size:0.75rem; font-weight:bold; opacity:0.8;">CONSULTA GLOBAL NEXUS-X STARLINK</p>
    </div>
    <div class="card">
      <label>AUDITORÍA DE PLACA</label>
      <input id="search-placa" placeholder="BUSCAR HISTORIAL..." style="text-align:center; font-weight:bold;">
      <button class="btn btn-accent" onclick="searchHistory()">VER HOJA DE VIDA</button>
    </div>
    <div id="history-result"></div>
  </section>

  <section id="sec-finanzas" class="hidden">
    <div class="card">
      <h3><i class="fas fa-cash-register"></i> Control de Caja / Repuestos</h3>
      <label>CATEGORÍA</label>
      <select id="g-tipo">
        <option value="Repuestos">Compra de Repuestos</option>
        <option value="Nomina">Pago Mecánicos</option>
        <option value="Gastos">Servicios / Arriendo</option>
        <option value="Insumos">Insumos Locales</option>
      </select>
      <label>MONTO ($)</label>
      <input id="g-valor" type="number" placeholder="0.00">
      <label>DESCRIPCIÓN DEL GASTO</label>
      <input id="g-desc" placeholder="Ej: Kit Distribución Placa ABC-123">
      <button class="btn btn-accent" onclick="saveGasto()">REGISTRAR MOVIMIENTO</button>
    </div>
    <div id="lista-gastos"></div>
  </section>

  <section id="sec-admin" class="hidden">
    <div class="card" style="border: 2px solid var(--gold); background: #fffdf2;">
      <h3 style="color:var(--primary);"><i class="fas fa-user-shield"></i> NEXUS-X MASTER CONTROL</h3>
      <p style="font-size:0.7rem; font-weight:bold;">Jurisdicción: Charlotte NC, USA & Colombia</p>
      <hr>
      <div id="admin-users-list"></div>
    </div>
  </section>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, addDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
    authDomain: "tallerpro360.firebaseapp.com",
    projectId: "tallerpro360",
    storageBucket: "tallerpro360.appspot.com",
    messagingSenderId: "636224778184",
    appId: "1:636224778184:web:9bd7351b6458a1ef625afd"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // --- Sistema de Autenticación Nexus-X ---
  window.handleAuth = async (mode) => {
    const email = mode === 'login' ? document.getElementById('auth-email').value : document.getElementById('reg-email').value;
    const pass = mode === 'login' ? document.getElementById('auth-pass').value : document.getElementById('reg-pass').value;
    
    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "usuarios", res.user.uid), {
          nombreTaller: document.getElementById('reg-taller').value,
          email: email,
          fechaRegistro: serverTimestamp(),
          estado: "TRIAL",
          plan: "STARLINK-BASIC"
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      location.reload();
    } catch (e) { alert("ERROR NEXUS-X: " + e.message); }
  };

  // --- Monitoreo de Sesión y Roles ---
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (uDoc.exists()) {
        const data = uDoc.data();
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('display-taller').innerText = data.nombreTaller + " | 🛰️ STARLINK ACTIVE";
        
        // Verificación de Rango CEO (William)
        if(user.email === 'william@nexus-x.com') {
          document.getElementById('tab-admin').style.display = 'block';
          loadAdminPanel();
        }
        renderOrders();
        renderGastos();
      }
    }
  });

  // --- Motor de Ordenes ---
  window.saveOrder = async () => {
    const id = document.getElementById('o-id').value;
    const checks = Array.from(document.querySelectorAll('.chk-item:checked')).map(el => el.value);
    
    const orden = {
      placa: document.getElementById('o-placa').value.toUpperCase(),
      marca: document.getElementById('o-marca').value,
      modelo: document.getElementById('o-modelo').value,
      km: document.getElementById('o-km').value,
      gas: document.getElementById('o-gas').value,
      cliente: document.getElementById('o-cliente').value,
      tel: document.getElementById('o-tel').value,
      trabajo: document.getElementById('o-trabajo').value,
      inventario: checks,
      tallerId: auth.currentUser.uid,
      fecha: new Date().toISOString(),
      estado: 'PROCESO'
    };

    try {
      if (id) {
        await updateDoc(doc(db, "ordenes", id), orden);
        alert("Orden Actualizada en la Red Nexus-X");
      } else {
        await addDoc(collection(db, "ordenes"), orden);
        // Notificación WhatsApp Nexus-X
        const texto = `🚀 *REPORTE TALLERPRO360*\n\nHola *${orden.cliente}*, su vehículo *${orden.placa}* ha ingresado a nuestra red.\n\n📍 *Taller:* ${document.getElementById('display-taller').innerText}\n🛠️ *Trabajo:* ${orden.trabajo}\n📈 *Kilometraje:* ${orden.km}\n\n_Seguimiento vía Nexus-X Starlink SAS_`;
        window.open(`https://wa.me/57${orden.tel.replace(/\D/g,'')}?text=${encodeURIComponent(texto)}`, '_blank');
      }
      location.reload();
    } catch(e) { alert("Error al guardar: " + e.message); }
  };

  // --- Renderización en Tiempo Real ---
  async function renderOrders() {
    const q = query(collection(db, "ordenes"), where("tallerId", "==", auth.currentUser.uid), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const list = document.getElementById('lista-ordenes');
    list.innerHTML = "<h4 style='margin-top:20px;'><i class='fas fa-stream'></i> VEHÍCULOS EN PATIO</h4>";
    
    snap.forEach(d => {
      const o = d.data();
      list.innerHTML += `
        <div class="list-item">
          <div>
            <b>${o.placa}</b> <span class="badge badge-active">${o.estado}</span><br>
            <small>${o.marca} | ${o.cliente}</small>
          </div>
          <button class="btn-edit" onclick='editOrder("${d.id}", ${JSON.stringify(o)})'>EDITAR</button>
        </div>`;
    });
  }

  window.editOrder = (id, d) => {
    document.getElementById('o-id').value = id;
    document.getElementById('o-placa').value = d.placa;
    document.getElementById('o-marca').value = d.marca;
    document.getElementById('o-modelo').value = d.modelo;
    document.getElementById('o-km').value = d.km;
    document.getElementById('o-cliente').value = d.cliente;
    document.getElementById('o-tel').value = d.tel;
    document.getElementById('o-trabajo').value = d.trabajo;
    window.showTab('ordenes');
    window.scrollTo(0,0);
  };

  // --- Motor Passport Starlink ---
  window.searchHistory = async () => {
    const placa = document.getElementById('search-placa').value.toUpperCase();
    if(!placa) return;
    
    const q = query(collection(db, "ordenes"), where("placa", "==", placa), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const res = document.getElementById('history-result');
    res.innerHTML = "";
    
    if(snap.empty) {
      res.innerHTML = "<div class='card' style='text-align:center;'>❌ Placa sin historial en la red Nexus-X.</div>";
      return;
    }

    snap.forEach(d => {
      const o = d.data();
      res.innerHTML += `
        <div class="card" style="border-left:8px solid var(--gold)">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:10px;">
            <span>📅 ${new Date(o.fecha).toLocaleDateString()}</span>
            <span>📍 TALLER ID: ${o.tallerId.substring(0,6)}</span>
          </div>
          <strong style="color:var(--primary);">${o.trabajo}</strong><br>
          <small>🛠️ Recorrido: ${o.km} KM</small>
        </div>`;
    });
  };

  // --- Gestión de Caja ---
  window.saveGasto = async () => {
    const valor = document.getElementById('g-valor').value;
    if(!valor) return;
    
    await addDoc(collection(db, "gastos"), {
      tipo: document.getElementById('g-tipo').value,
      valor: valor,
      desc: document.getElementById('g-desc').value,
      tallerId: auth.currentUser.uid,
      fecha: serverTimestamp()
    });
    alert("Movimiento Registrado");
    location.reload();
  };

  async function renderGastos() {
    const q = query(collection(db, "gastos"), where("tallerId", "==", auth.currentUser.uid), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const list = document.getElementById('lista-gastos');
    list.innerHTML = "<h4 style='margin-top:20px;'>ÚLTIMOS MOVIMIENTOS</h4>";
    snap.forEach(d => {
      const g = d.data();
      list.innerHTML += `
        <div class="list-item" style="border-left-color: var(--danger)">
          <div><b>$${g.valor}</b><br><small>${g.tipo}: ${g.desc}</small></div>
        </div>`;
    });
  }

  // --- Panel Admin CEO Master ---
  async function loadAdminPanel() {
    const snap = await getDocs(collection(db, "usuarios"));
    const list = document.getElementById('admin-users-list');
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.data();
      list.innerHTML += `
        <div class="list-item" style="border-left-color: var(--gold)">
          <div>
            <b>${d.nombreTaller}</b><br>
            <small>${d.email}</small> <span class="badge ${d.estado === 'PAGADO' ? 'badge-active' : 'badge-trial'}">${d.estado}</span>
          </div>
          ${d.estado !== 'PAGADO' ? `<button onclick="activateUser('${u.id}')" style="background:var(--success); color:white; border:none; padding:10px; border-radius:12px; font-weight:bold;">ACTIVAR</button>` : ''}
        </div>`;
    });
  }

  window.activateUser = async (id) => {
    await updateDoc(doc(db, "usuarios", id), { estado: "PAGADO" });
    alert("FIRMA ACTIVADA CORRECTAMENTE");
    location.reload();
  };

  window.showTab = (tab) => {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`sec-${tab}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
  };
</script>

<script>
  // --- Motor de Voz Avanzado ---
  const btnVoz = document.getElementById('btn-voz');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    
    btnVoz.onclick = () => {
      recognition.start();
      btnVoz.style.background = "var(--danger)";
      btnVoz.innerHTML = "<i class='fas fa-satellite-dish fa-spin'></i> ESCUCHANDO DIAGNÓSTICO...";
    };

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      document.getElementById('o-trabajo').value += (document.getElementById('o-trabajo').value ? " " : "") + text;
      resetVozBtn();
    };

    recognition.onerror = () => resetVozBtn();
    recognition.onend = () => resetVozBtn();
  }

  function resetVozBtn() {
    btnVoz.style.background = "var(--primary)";
    btnVoz.innerHTML = "<i class='fas fa-microphone'></i> DICTADO POR VOZ STARLINK";
  }

  function toggleAuth() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
  }
</script>
// --- COPIAR DESDE AQUÍ PARA ANEXAR A app.php ---

// 1. Función para cargar prospectos (Solo para William / CEO)
async function cargarLeadsCEO() {
    const leadsContainer = document.getElementById('ceo_leads_display');
    if(!leadsContainer) return; // Evita errores si no estás en la vista CEO

    try {
        const querySnapshot = await getDocs(collection(db, "leads_interesados"));
        let htmlLeads = `
            <div class="bg-slate-900 p-6 rounded-3xl border border-gold/30 mb-8">
                <h3 class="text-gold font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i class="fas fa-users-viewfinder"></i> Prospectos de Red Nexus-X
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-300">
                        <thead>
                            <tr class="border-b border-white/10 uppercase tracking-tighter">
                                <th class="pb-2">Fecha</th>
                                <th class="pb-2">Plan Interés</th>
                                <th class="pb-2">Origen</th>
                            </tr>
                        </thead>
                        <tbody>`;

        querySnapshot.forEach((doc) => {
            const lead = doc.data();
            const fecha = lead.fecha ? new Date(lead.fecha.seconds * 1000).toLocaleDateString() : 'Pendiente';
            htmlLeads += `
                <tr class="border-b border-white/5">
                    <td class="py-2 text-white font-bold">${fecha}</td>
                    <td class="py-2">
                        <span class="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-[9px] font-black italic">
                            ${lead.plan_clicado}
                        </span>
                    </td>
                    <td class="py-2 opacity-60">${lead.agente}</td>
                </tr>`;
        });

        htmlLeads += `</tbody></table></div></div>`;
        leadsContainer.innerHTML = htmlLeads;

    } catch (error) {
        console.error("Error al cargar leads: ", error);
    }
}

// 2. Anexar el Dashboard al inicio de la App si el usuario es el CEO
// (Aquí puedes filtrar por el correo de William para que nadie más lo vea)
function renderizarDashboardCEO(userEmail) {
    if(userEmail === "william@nexus-x.com") { // <-- CAMBIA ESTO POR TU CORREO
        const mainContainer = document.querySelector('main') || document.body;
        const ceoDiv = document.createElement('div');
        ceoDiv.id = "ceo_leads_display";
        ceoDiv.className = "max-w-4xl mx-auto px-4 mt-4";
        mainContainer.prepend(ceoDiv);
        cargarLeadsCEO();
    }
}

// Llamar a esta función dentro de tu onAuthStateChanged (al iniciar sesión)
 renderizarDashboardCEO(user.email);

// --- FIN DEL ANEXO ---
</body>
</html>
