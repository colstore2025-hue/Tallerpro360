/*
=====================================
login.js
Sistema de login · TallerPRO360
Versión robusta y enfocada
=====================================
*/

import { auth } from "../core/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { bootStatus } from "../system/bootDiagnostic.js"; // Opcional, para mensajes de boot

const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // ===============================
    // Validaciones básicas
    // ===============================
    if (!email || !password) {
      alert("Por favor ingresa email y contraseña");
      bootStatus?.("⚠ Email o contraseña vacíos");
      return;
    }

    try {
      bootStatus?.("🔑 Intentando autenticar usuario...");

      // ===============================
      // Autenticación Firebase
      // ===============================
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      console.log("Usuario autenticado:", user.uid);
      bootStatus?.(`✔ Usuario autenticado: ${user.uid}`);

      // ===============================
      // Guardar sesión en localStorage
      // ===============================
      localStorage.setItem("uid", user.uid);

      // Empresa demo temporal (si no existe)
      if (!localStorage.getItem("empresaId")) {
        localStorage.setItem("empresaId", "demoEmpresa");
        bootStatus?.("⚡ Empresa demo cargada");
      }

      // ===============================
      // Redirigir al ERP
      // ===============================
      window.location.href = "/index.html";

    } catch (error) {
      console.error("Error login:", error);

      let mensaje = "Error de autenticación";
      if (error.code === "auth/user-not-found") mensaje = "Usuario no encontrado";
      if (error.code === "auth/wrong-password") mensaje = "Contraseña incorrecta";
      if (error.code === "auth/invalid-email") mensaje = "Email inválido";

      alert(mensaje);
      bootStatus?.(`❌ ${mensaje}`);
    }
  });
}