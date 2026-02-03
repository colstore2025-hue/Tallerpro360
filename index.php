<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>TallerPRO360 Elite - Nexus-X Starlink SAS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0f172a">
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <style>
    :root { --primary: #0f172a; --secondary: #1e293b; --success: #16a34a; --accent: #3b82f6; --danger: #ef4444; --gold: #f59e0b; --gray: #f1f5f9; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: var(--gray); padding-bottom: 80px; overflow-x: hidden; }
    
    /* Branding */
    header { background: var(--primary); color: white; padding: 15px; text-align: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-bottom: 2px solid var(--gold); }
    header strong { font-size: 1.1rem; letter-spacing: 1px; display: block; }
    header small { font-size: 0.6rem; color: var(--gold); font-weight: bold; text-transform: uppercase; }

    /* Auth */
    #auth-screen { background: radial-gradient(circle at top, #1e293b, #0f172a); height: 100vh; color: white; display: flex; flex-direction: column; justify-content: center; position: fixed; top: 0; left: 0; z-index: 9999; width: 100%; }
    .auth-card { background: white; color: var(--primary); margin: 20px; padding: 30px; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    
    /* Tabs Navegación */
    .nav-tabs { display: flex; background: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 68px; z-index: 99; overflow-x: auto; scrollbar-width: none; }
    .tab { flex: 1; min-width: 100px; padding: 15px 5px; text-align: center; cursor: pointer; font-weight: 700; font-size: 0.65rem; color: #64748b; border-bottom: 3px solid transparent; }
    .tab.active { border-bottom: 3px solid var(--accent); color: var(--accent); background: #f0f9ff; }
    #tab-admin { background: #000 !important; color: var(--gold) !important; display: none; }

    .container { padding: 12px; max-width: 600px; margin: auto; }
    .card { background: white; padding: 18px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 15px; border: 1px solid #eef2f6; }
    
    /* Inputs Estilo TuulApp */
    label { font-size: 0.75rem; font-weight: 800; color: var(--secondary); margin-bottom: 4px; display: block; }
    input, textarea, select { width: 100%; padding: 12px; margin-bottom: 12px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 15px; box-sizing: border-box; background: #fff; }
    input:focus { border-color: var(--accent); outline: none; background: #f8fbff; }
    
    .btn { width: 100%; padding: 15px; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; color: white; font-size: 14px; text-transform: uppercase; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-main { background: var(--success); }
    .btn-accent { background: var(--accent); }
    .btn-voice { background: var(--primary); border: 2px solid var(--gold); }
    .btn-camera { background: #6366f1; }
    .btn-edit { background: var(--gold); padding: 8px 12px; font-size: 0.6rem; width: auto; border-radius: 8px; }
    
    /* Checklist UI */
    .checklist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
    .check-item { background: var(--gray); padding: 10px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: bold; }
    .check-item input { width: auto; margin: 0; }

    /* Passport Style */
    .passport-header { background: linear-gradient(45deg, var(--primary), var(--secondary)); color: white; padding: 15px; border-radius: 15px; text-align: center; margin-bottom: 15px; border: 1px solid var(--gold); }
    
    .hidden { display: none !important; }
    .list-item { background: white; padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 5px solid var(--accent); display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>

<div id="auth-screen">
  <div class="auth-card">
    <div style="text-align:center; margin-bottom:20px;">
      <h2 style="margin:0; font-weight:900;">TallerPRO360</h2>
      <small style="color:var(--accent); font-weight:900;">NEXUS-X STARLINK SAS</small>
    </div>
    <div id="login-form">
      <input id="auth-email" type="email" placeholder="Correo del taller">
      <input id="auth-pass" type="password" placeholder="Contraseña">
      <button class="btn btn-accent" onclick="handleAuth('login')">ENTRAR AL SISTEMA</button>
      <p style="text-align: center; font-size: 0.8rem; margin-top:15px;" onclick="toggleAuth()">¿Nuevo taller? <b style="color:var(--accent)">Regístrate aquí</b></p>
    </div>
    <div id="register-form" class="hidden">
      <input id="reg-taller" type="text" placeholder="Nombre de su Taller">
      <input id="reg-email" type="email" placeholder="Correo electrónico">
      <input id="reg-pass" type="password" placeholder="Crea tu contraseña">
      <button class="btn btn-main" onclick="handleAuth('register')">ACTIVAR 7 DÍAS GRATIS</button>
      <p style="text-align: center; font-size: 0.8rem; margin-top:15px;" onclick="toggleAuth()">Ya tengo cuenta, <b>ingresar</b></p>
    </div>
  </div>
</div>

<header>
  <strong>TallerPRO360 Elite</strong>
  <small id="display-taller">Cargando Sistema...</small>
</header>

<div class="nav-tabs">
  <div class="tab active" onclick="showTab('ordenes')"><i class="fas fa-tools"></i><br>ORDENES</div>
  <div class="tab" onclick="showTab('passport')"><i class="fas fa-id-card"></i><br>PASSPORT</div>
  <div class="tab" onclick="showTab('finanzas')"><i class="fas fa-wallet"></i><br>CAJA</div>
  <div class="tab" id="tab-admin" onclick="showTab('admin')"><i class="fas fa-crown"></i><br>CEO</div>
</div>

<div class="container">
  
  <section id="sec-ordenes">
    <div class="card" style="background: var(--primary);">
      <button id="btn-voz" class="btn btn-voice"><i class="fas fa-microphone"></i> DICTAR DIAGNÓSTICO (TOUCH)</button>
    </div>

    <div class="card">
      <h3 style="margin:0 0 15px 0; color:var(--primary);"><i class="fas fa-file-invoice"></i> Recepción Técnica</h3>
      <input id="o-id" type="hidden">
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <label>PLACA</label>
          <input id="o-placa" placeholder="ABC-123" style="text-transform: uppercase; font-weight:bold; font-size:1.2rem; text-align:center;">
        </div>
        <div>
          <label>MODELO/AÑO</label>
          <input id="o-modelo" placeholder="Ej: 2024">
        </div>
      </div>

      <label>MARCA Y LÍNEA</label>
      <input id="o-marca" placeholder="Ej: Toyota Hilux">

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <label>KILOMETRAJE</label>
          <input id="o-km" type="number" placeholder="KM actuales">
        </div>
        <div>
          <label>GASOLINA</label>
          <select id="o-gas">
            <option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option>
          </select>
        </div>
      </div>

      <label>CLIENTE Y WHATSAPP</label>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <input id="o-cliente" placeholder="Nombre">
        <input id="o-tel" type="tel" placeholder="310...">
      </div>

      <label>ESTADO DE RECEPCIÓN (CHECKLIST)</label>
      <div class="checklist-grid">
        <div class="check-item"><input type="checkbox" class="chk-item" value="Radio"> Radio</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Gato"> Gato/Hta</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Repuesto"> Llanta Rep.</div>
        <div class="check-item"><input type="checkbox" class="chk-item" value="Extintor"> Extintor</div>
      </div>

      <label>TRABAJO A REALIZAR</label>
      <textarea id="o-trabajo" placeholder="Escriba o use el dictado por voz..." rows="4"></textarea>
      
      <button class="btn btn-camera" style="margin-bottom:10px;"><i class="fas fa-camera"></i> REGISTRAR EVIDENCIA FOTO</button>
      <button class="btn btn-main" onclick="saveOrder()"><i class="fas fa-save"></i> GUARDAR Y ENVIAR WHATSAPP</button>
    </div>
    <div id="lista-ordenes"></div>
  </section>

  <section id="sec-passport" class="hidden">
    <div class="passport-header">
      <i class="fas fa-shield-alt fa-2x"></i>
      <h3>NEXUS-X VEHICLE PASSPORT</h3>
      <p style="font-size:0.7rem;">Historial de confianza Starlink</p>
    </div>
    <div class="card">
      <input id="search-placa" placeholder="BUSCAR PLACA (HISTORIAL)" style="text-align:center;">
      <button class="btn btn-accent" onclick="searchHistory()">CONSULTAR HOJA DE VIDA</button>
    </div>
    <div id="history-result"></div>
  </section>

  <section id="sec-finanzas" class="hidden">
    <div class="card">
      <h3>💸 Caja Menor / Repuestos</h3>
      <label>TIPO DE MOVIMIENTO</label>
      <select id="g-tipo">
        <option value="Repuestos">Compra de Repuestos</option>
        <option value="Insumos">Insumos (Aceites/Líquidos)</option>
        <option value="Gasto">Gasto Local / Servicios</option>
      </select>
      <input id="g-valor" type="number" placeholder="Monto en Pesos ($)">
      <input id="g-desc" placeholder="¿Para qué placa o qué repuesto?">
      <button class="btn btn-accent" onclick="saveGasto()">REGISTRAR EN LIBRO</button>
    </div>
    <div id="lista-gastos"></div>
  </section>

  <section id="sec-admin" class="hidden">
    <div class="card" style="border: 2px solid var(--gold); background: #fffcf0;">
      <h3 style="color:var(--gold);"><i class="fas fa-user-shield"></i> CEO Master Dashboard</h3>
      <p style="font-size:0.7rem;">Nexus-X Starlink SAS & Colombian Trucks Logistics LLC</p>
      <hr>
      <div id="admin-users-list"></div>
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

  // --- AUTH NEXUS-X ---
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
    } catch (e) { alert("Acceso Denegado: " + e.message); }
  };

  // --- CONTROL DE ACCESO CEO ---
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (uDoc.exists()) {
        const data = uDoc.data();
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('display-taller').innerText = data.nombreTaller + " | 🛰️ Starlink Active";
        
        // El CEO es William
        if(user.email === 'william@nexus-x.com') {
          document.getElementById('tab-admin').style.display = 'block';
          loadAdminPanel();
        }
        renderOrders();
        renderGastos();
      }
    }
  });

  // --- GESTIÓN DE ORDENES (ALTA ESCALA) ---
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
      estado: 'INGRESADO'
    };

    if (id) {
      await updateDoc(doc(db, "ordenes", id), orden);
      alert("Orden Actualizada en la Red Nexus-X");
    } else {
      await addDoc(collection(db, "ordenes"), orden);
      const msj = encodeURIComponent(`🚗 *TallerPRO360 - NEXUS-X*\n\nHola ${orden.cliente}, recibimos su vehículo *${orden.placa}* (${orden.marca}).\n\n*KM:* ${orden.km}\n*Nivel Gas:* ${orden.gas}\n*Diagnóstico:* ${orden.trabajo}\n\n_Reporte generado por Nexus-X Starlink SAS._`);
      window.open(`https://wa.me/57${orden.tel.replace(/\D/g,'')}?text=${msj}`, '_blank');
    }
    location.reload();
  };

  window.editOrder = (id, d) => {
    document.getElementById('o-id').value = id;
    document.getElementById('o-placa').value = d.placa;
    document.getElementById('o-marca').value = d.marca;
    document.getElementById('o-km').value = d.km;
    document.getElementById('o-cliente').value = d.cliente;
    document.getElementById('o-tel').value = d.tel;
    document.getElementById('o-trabajo').value = d.trabajo;
    window.showTab('ordenes');
    window.scrollTo(0,0);
  };

  async function renderOrders() {
    const q = query(collection(db, "ordenes"), where("tallerId", "==", auth.currentUser.uid), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const list = document.getElementById('lista-ordenes');
    list.innerHTML = "<h4><i class='fas fa-clipboard-list'></i> Vehículos en Patio</h4>";
    snap.forEach(d => {
      const o = d.data();
      list.innerHTML += `<div class="list-item">
        <div><b>${o.placa}</b><br><small>${o.marca} - ${o.cliente}</small></div>
        <button class="btn-edit" onclick='editOrder("${d.id}", ${JSON.stringify(o)})'>GESTIONAR</button>
      </div>`;
    });
  }

  // --- NEXUS-X PASSPORT ENGINE ---
  window.searchHistory = async () => {
    const placa = document.getElementById('search-placa').value.toUpperCase();
    const q = query(collection(db, "ordenes"), where("placa", "==", placa), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    const res = document.getElementById('history-result');
    res.innerHTML = "";
    
    if(snap.empty) {
      res.innerHTML = "<div class='card'>❌ Placa no registrada en la red Nexus-X</div>";
      return;
    }

    snap.forEach(d => {
      const o = d.data();
      res.innerHTML += `<div class="card" style="border-left:5px solid var(--success)">
        <small>${new Date(o.fecha).toLocaleDateString()}</small><br>
        <strong>Servicio: ${o.trabajo}</strong><br>
        <small>KM: ${o.km} | Taller: ${o.tallerId.substring(0,5)}</small>
      </div>`;
    });
  };

  // --- CAJA Y GASTOS ---
  window.saveGasto = async () => {
    await addDoc(collection(db, "gastos"), {
      tipo: document.getElementById('g-tipo').value,
      valor: document.getElementById('g-valor').value,
      desc: document.getElementById('g-desc').value,
      tallerId: auth.currentUser.uid,
      fecha: serverTimestamp()
    });
    alert("Movimiento Registrado");
    location.reload();
  };

  // --- ADMIN PANEL CEO ---
  async function loadAdminPanel() {
    const snap = await getDocs(collection(db, "usuarios"));
    const list = document.getElementById('admin-users-list');
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.data();
      list.innerHTML += `<div class="list-item">
        <div><b>${d.nombreTaller}</b><br><small>${d.email} | ${d.estado}</small></div>
        <button onclick="activateUser('${u.id}')" style="background:var(--success); color:white; border:none; padding:8px; border-radius:10px;">PAGÓ</button>
      </div>`;
    });
  }

  window.activateUser = async (id) => {
    await updateDoc(doc(db, "usuarios", id), { estado: "PAGADO" });
    alert("Taller Activado por Nexus-X Master Control");
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
  // SISTEMA DE VOZ STARLINK
  const btnVoz = document.getElementById('btn-voz');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;

    btnVoz.onclick = () => {
      recognition.start();
      btnVoz.style.background = "var(--danger)";
      btnVoz.innerHTML = "<i class='fas fa-microphone-alt'></i> ESCUCHANDO DIAGNÓSTICO...";
    };

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      document.getElementById('o-trabajo').value += (document.getElementById('o-trabajo').value ? " " : "") + text;
      btnVoz.style.background = "var(--primary)";
      btnVoz.innerHTML = "<i class='fas fa-microphone'></i> DICTAR TRABAJO (TOUCH)";
    };

    recognition.onerror = () => {
      btnVoz.style.background = "var(--primary)";
      btnVoz.innerHTML = "<i class='fas fa-microphone'></i> REINTENTAR DICTADO";
    };
  }

  function toggleAuth() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
  }
</script>
</body>
</html>
