// ... (tus imports de Firebase)
try {
  bootStatus?.("🔑 Autenticando...");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // NUEVO: Obtener el perfil global para saber su empresaId y Rol
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const { db } = await import("../core/firebase-config.js");
  
  const userDoc = await getDoc(doc(db, "usuariosGlobal", uid));

  if (userDoc.exists()) {
    const userData = userDoc.data();
    localStorage.setItem("uid", uid);
    localStorage.setItem("empresaId", userData.empresaId); // <--- El de verdad
    localStorage.setItem("rol", userData.rolGlobal || "usuario");
    localStorage.setItem("plan", userData.plan || "Basico"); // Para el Sidebar
    
    window.location.href = "/index.html";
  } else {
    throw new Error("El usuario no tiene un perfil configurado.");
  }

} catch (error) { /* ... manejo de errores */ }
