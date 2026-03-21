/*
=====================================
login.js
Sistema de login · TallerPRO360
=====================================
*/

import { auth } from "../core/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { bootStatus } from "../system/bootDiagnostic.js";

const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Por favor ingresa email y contraseña");
      bootStatus?.("⚠ Email o contraseña vacíos");
      return;
    }

    try {
      bootStatus?.("🔑 Intentando autenticar usuario...");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      console.log("Usuario autenticado:", user.uid);
      bootStatus?.(`✔ Usuario autenticado: ${user.uid}`);

      localStorage.setItem("uid", user.uid);

      if (!localStorage.getItem("empresaId")) {
        localStorage.setItem("empresaId", "demoEmpresa");
        bootStatus?.("⚡ Empresa demo cargada");
      }

      window.location.href = "/index.html";

    } catch (error) {
      console.error("Error login:", error);

      let mensaje = "Error de autenticación";
      switch (error.code) {
        case "auth/user-not-found": mensaje = "Usuario no encontrado"; break;
        case "auth/wrong-password": mensaje = "Contraseña incorrecta"; break;
        case "auth/invalid-email": mensaje = "Email inválido"; break;
      }

      alert(mensaje);
      bootStatus?.(`❌ ${mensaje}`);
    }
  });
}