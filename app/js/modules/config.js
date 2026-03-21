/**
 * config.js - CRM PRO360
 * Configuración de Empresa y Perfil
 */
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; min-height:100vh; color:white;">
      <h1 style="color:#6366f1; font-size:28px; font-weight:900;">⚙️ Configuración</h1>
      
      <div id="perfilEmpresa" style="background:#0f172a; padding:20px; border-radius:16px; border:1px solid #1e293b;">
        <p>Cargando datos de la empresa...</p>
      </div>

      <div style="margin-top:30px; padding:15px; background:#ef444422; border-radius:12px; border:1px solid #ef444444;">
        <h4 style="color:#ef4444; margin:0;">Zona Peligrosa</h4>
        <button onclick="localStorage.clear(); location.reload();" style="margin-top:10px; width:100%; background:#ef4444; color:white; border:none; padding:10px; border-radius:8px; font-weight:bold;">
          CERRAR SESIÓN Y LIMPIAR CACHÉ
        </button>
      </div>
    </div>
  `;

  async function cargarPerfil() {
    const perfilWrap = document.getElementById("perfilEmpresa");
    try {
      const docRef = doc(db, "empresas", empresaId);
      const res = await getDoc(docRef);
      
      if (res.exists()) {
        const data = res.data();
        perfilWrap.innerHTML = `
          <div style="text-align:center; margin-bottom:20px;">
            <div style="width:80px; height:80px; background:#6366f1; border-radius:50%; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:30px;">🏢</div>
            <h2 style="margin:10px 0 0 0;">${data.nombre || 'Mi Taller'}</h2>
            <span style="color:#64748b; font-size:12px;">ID: ${empresaId}</span>
          </div>
          <div style="border-top:1px solid #1e293b; padding-top:15px;">
            <label style="font-size:12px; color:#94a3b8;">NIT / Identificación</label>
            <div style="padding:10px; background:#050a14; border-radius:8px; margin-bottom:10px;">${data.nit || 'No configurado'}</div>
            
            <label style="font-size:12px; color:#94a3b8;">Plan Actual</label>
            <div style="padding:10px; background:#050a14; border-radius:8px; color:#facc15;">Enterprise Cloud</div>
          </div>
        `;
      }
    } catch (e) {
      perfilWrap.innerHTML = "❌ No se pudo cargar el perfil.";
    }
  }

  cargarPerfil();
}
