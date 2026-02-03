<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>TallerPRO360 Elite - Nexus-X Starlink SAS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0f172a">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <style>
    :root { 
      --primary: #0f172a; --secondary: #1e293b; --success: #16a34a; 
      --accent: #3b82f6; --danger: #ef4444; --gold: #f59e0b; --gray: #f1f5f9; 
    }
    
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: var(--gray); padding-bottom: 90px; overflow-x: hidden; color: var(--primary); }
    
    header { 
      background: var(--primary); color: white; padding: 15px; text-align: center; 
      position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
      border-bottom: 3px solid var(--gold); 
    }
    header strong { font-size: 1.2rem; letter-spacing: 1px; display: block; }
    header small { font-size: 0.65rem; color: var(--gold); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }

    #auth-screen { 
      background: radial-gradient(circle at top, #1e293b, #0f172a); 
      height: 100vh; color: white; display: flex; flex-direction: column; 
      justify-content: center; position: fixed; top: 0; left: 0; z-index: 9999; width: 100%; 
    }
    .auth-card { 
      background: white; color: var(--primary); margin: 25px; padding: 35px; 
      border-radius: 28px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); 
    }
    
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
    
    input, textarea, select { 
      width: 100%; padding: 14px; margin-bottom: 15px; border: 2px solid #e2e8f0; 
      border-radius: 14px; font-size: 16px; box-sizing: border-box; transition: 0.3s;
    }
    
    .btn { 
      width: 100%; padding: 16px; border: none; border-radius: 14px; 
      font-weight: 800; cursor: pointer; color: white; font-size: 14px; 
      text-transform: uppercase; display: flex; align-items: center; 
      justify-content: center; gap: 10px;
    }
    .btn-main { background: var(--success); }
    .btn-accent { background: var(--accent); }
    .btn-voice { background: var(--primary); border: 2px solid var(--gold); color: var(--gold); }
    
    .list-item { 
      background: white; padding: 18px; border-radius: 18px; margin-bottom: 12px; 
      border-left: 6px solid var(--accent); display: flex; justify-content: space-between; align-items: center;
    }

    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; }
    .badge-trial { background: #fee2e2; color: #dc2626; }
    .badge-active { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>

<div id="loader-nexus" class="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-700">
    <div class="relative">
        <div class="w-24 h-24 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
        <i class="fas fa-satellite-dish text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse"></i>
    </div>
    <h2 class="mt-6 text-white font-black tracking-[0.2em] text-sm uppercase">Nexus-X Starlink</h2>
    <p class="text-gold/50 text-[10px] uppercase mt-2 tracking-widest">Sincronizando Red SAS...</p>
</div>

<div id="auth-screen">
  <div class="auth-card">
    <div style="text-align:center; margin-bottom:25px;">
      <h2 style="margin:0; font-weight:900; font-size:1.8rem;">TallerPRO360</h2>
      <small style="color:var(--accent); font-weight:900;">SISTEMA LOGÍSTICO NEXUS-X STARLINK</small>
    </div>
    
    <div id="login-form">
      <input id="auth-email" type="email" placeholder="Correo del taller">
      <input id="auth-pass" type="password" placeholder="Contraseña">
      <button class="btn btn-accent" onclick="handleAuth('login')">INICIAR SESIÓN</button>
      <p style="text-align: center; font-size: 0.85rem; margin-top:20px;" onclick="toggleAuth()">¿Nuevo taller? <b style="color:var(--accent)">Registrar en la Red</b></p>
    </div>

    <div id="register-form" class="hidden">
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

<div class="container" id="main-content">
  <section id="sec-ordenes">
    <div class="card" style="background: var(--primary); text-align: center;">
      <button id="btn-voz" class="btn btn-voice"><i class="fas fa-microphone"></i> DICTADO POR VOZ STARLINK</button>
    </div>

    <div class="card">
      <h3 class="font-bold mb-4"><i class="fas fa-file-medical"></i> Recepción de Vehículo</h3>
      <input id="o-id" type="hidden">
      <div class="grid grid-cols-2 gap-3">
        <input id="o-placa" placeholder="PLACA" class="text-center font-black text-blue-600">
        <input id="o-modelo" type="number" placeholder="MODELO">
      </div>
      <input id="o-marca" placeholder="MARCA Y REFERENCIA">
      <div class="grid grid-cols-2 gap-3">
        <input id="o-km" type="number" placeholder="KILOMETRAJE">
        <select id="o-gas"><option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option></select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <input id="o-cliente" placeholder="CLIENTE">
        <input id="o-tel" type="tel" placeholder="WHATSAPP">
      </div>
      <textarea id="o-trabajo" placeholder="DIAGNÓSTICO..." rows="4"></textarea>
      <button class="btn btn-main" onclick="saveOrder()"><i class="fas fa-cloud-upload-alt"></i> PROCESAR ORDEN</button>
    </div>
    <div id="lista-ordenes"></div>
  </section>

  <section id="sec-passport" class="hidden">
    <div class="passport-header text-white p-6 rounded-3xl bg-slate-900 mb-4 border border-gold text-center">
        <i class="fas fa-satellite fa-2x text-gold mb-2"></i>
        <h3 class="font-black">PASSPORT HISTORY</h3>
    </div>
    <input id="search-placa" placeholder="BUSCAR PLACA..." class="text-center font-bold">
    <button class="btn btn-accent" onclick="searchHistory()">CONSULTAR RED GLOBAL</button>
    <div id="history-result" class="mt-4"></div>
  </section>

  <section id="sec-finanzas" class="hidden">
    <div class="card">
        <h3 class="font-bold mb-4">CAJA Y GASTOS</h3>
        <select id="g-tipo"><option>Repuestos</option><option>Nomina</option><option>Gastos</option></select>
        <input id="g-valor" type="number" placeholder="VALOR $">
        <input id="g-desc" placeholder="DESCRIPCIÓN">
        <button class="btn btn-accent" onclick="saveGasto()">REGISTRAR</button>
    </div>
    <div id="lista-gastos"></div>
  </section>

  <section id="sec-admin" class="hidden">
    <div class="card border-2 border-gold">
      <h3 class="font-black text-slate-800 uppercase text-sm">Nexus-X Master Control</h3>
      <div id="admin-users-list" class="mt-4"></div>
    </div>
  </section>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

  // --- DASHBOARD CEO (INTEGRADO) ---
  async function cargarLeadsCEO() {
    const container = document.getElementById('ceo_leads_display');
    if(!container) return;
    try {
        const snap = await getDocs(query(collection(db, "leads_interesados"), orderBy("fecha", "desc")));
        let html = `<div class="bg-slate-900 p-5 rounded-3xl border border-gold/30 mb-6 mt-2 shadow-2xl">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-gold font-black text-xs tracking-widest uppercase">Prospectos Nexus-X</h3>
                <span class="text-[9px] bg-gold text-black px-2 py-0.5 rounded-full font-bold">CEO MODE</span>
            </div>
            <div class="space-y-2">`;
        snap.forEach(d => {
            const l = d.data();
            const f = l.fecha ? new Date(l.fecha.seconds * 1000).toLocaleDateString() : 'Hoy';
            html += `<div class="flex justify-between text-[10px] border-b border-white/5 pb-2">
                <span class="text-white font-bold">${f}</span>
                <span class="text-blue-400 font-black italic">${l.plan_clicado}</span>
            </div>`;
        });
        html += `</div></div>`;
        container.innerHTML = html;
    } catch(e) { console.error(e); }
  }

  function renderizarDashboardCEO(email) {
    if(email === "william@nexus-x.com") {
        document.getElementById('tab-admin').style.display = 'block';
        if(!document.getElementById('ceo_leads_display')) {
            const div = document.createElement('div');
            div.id = "ceo_leads_display";
            document.getElementById('main-content').prepend(div);
            cargarLeadsCEO();
        }
    }
  }

  // --- GESTIÓN SESIÓN ---
  onAuthStateChanged(auth, async (user) => {
    // Quitar loader después de 1.5s
    setTimeout(() => {
        const l = document.getElementById('loader-nexus');
        if(l) { l.style.opacity = '0'; setTimeout(() => l.remove(), 600); }
    }, 1500);

    if (user) {
      const uDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (uDoc.exists()) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('display-taller').innerText = uDoc.data().nombreTaller + " | 🛰️ ACTIVE";
        renderizarDashboardCEO(user.email);
        renderOrders();
        renderGastos();
      }
    }
  });

  // --- FUNCIONES GLOBALES ---
  window.handleAuth = async (mode) => {
    const email = mode === 'login' ? document.getElementById('auth-email').value : document.getElementById('reg-email').value;
    const pass = mode === 'login' ? document.getElementById('auth-pass').value : document.getElementById('reg-pass').value;
    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "usuarios", res.user.uid), {
          nombreTaller: document.getElementById('reg-taller').value,
          email: email, fechaRegistro: serverTimestamp(), estado: "TRIAL"
        });
      } else { await signInWithEmailAndPassword(auth, email, pass); }
      location.reload();
    } catch (e) { alert("Error: " + e.message); }
  };

  window.saveOrder = async () => {
    const orden = {
      placa: document.getElementById('o-placa').value.toUpperCase(),
      cliente: document.getElementById('o-cliente').value,
      tel: document.getElementById('o-tel').value,
      trabajo: document.getElementById('o-trabajo').value,
      tallerId: auth.currentUser.uid,
      fecha: new Date().toISOString(),
      estado: 'PROCESO'
    };
    await addDoc(collection(db, "ordenes"), orden);
    const msg = `🚀 *NEXUS-X REPORT*\n\nVehículo: *${orden.placa}*\nEstado: Recibido en Taller\nTrabajo: ${orden.trabajo}`;
    window.open(`https://wa.me/57${orden.tel}?text=${encodeURIComponent(msg)}`, '_blank');
    location.reload();
  };

  async function renderOrders() {
    const q = query(collection(db, "ordenes"), where("tallerId", "==", auth.currentUser.uid), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const list = document.getElementById('lista-ordenes');
    list.innerHTML = "<h4 class='text-xs font-black mt-6 mb-3 uppercase opacity-50 italic'>Vehículos en Red</h4>";
    snap.forEach(d => {
      const o = d.data();
      list.innerHTML += `<div class="list-item">
        <div><b>${o.placa}</b> <span class="badge badge-active">EN CURSO</span><br><small>${o.cliente}</small></div>
      </div>`;
    });
  }

  window.showTab = (tab) => {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`sec-${tab}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
  };

  // --- MOTOR VOZ ---
  const btnVoz = document.getElementById('btn-voz');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    const rec = new Recognition(); rec.lang = 'es-CO';
    btnVoz.onclick = () => { rec.start(); btnVoz.classList.add('animate-pulse'); btnVoz.innerText = "ESCUCHANDO..."; };
    rec.onresult = (e) => { 
        document.getElementById('o-trabajo').value += e.results[0][0].transcript; 
        btnVoz.classList.remove('animate-pulse'); btnVoz.innerHTML = "<i class='fas fa-microphone'></i> DICTADO POR VOZ STARLINK";
    };
  }
</script>

<script>
  function toggleAuth() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
  }
</script>
</body>
</html>
