<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TallerPRO360 - Nexus-X Starlink | Gestión Élite para Talleres</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .gradient-starlink { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .text-gold { color: #f59e0b; }
        .border-gold { border-color: #f59e0b; }
        .bg-gold { background-color: #f59e0b; }
        .btn-nexus { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-nexus:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    </style>
</head>
<body class="bg-slate-50 font-sans">

    <nav class="bg-[#0f172a] py-4 px-6 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <i class="fas fa-satellite text-gold text-2xl animate-pulse"></i>
                <span class="text-white font-black text-xl tracking-tighter uppercase">TallerPRO360 <span class="text-gold">ELITE</span></span>
            </div>
            <div class="hidden md:flex gap-8 text-white text-[10px] font-black uppercase tracking-[2px]">
                <a href="#soluciones" class="hover:text-gold transition">Soluciones</a>
                <a href="#precios" class="hover:text-gold transition">Planes</a>
                <a href="app.php" class="bg-blue-600 px-6 py-2 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-900/40">Acceso Red</a>
            </div>
        </div>
    </nav>

    <header class="gradient-starlink text-white py-24 px-6 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <i class="fas fa-microchip text-[25rem] absolute -top-20 -left-20"></i>
            <i class="fas fa-truck-monster text-[20rem] absolute -bottom-10 -right-10"></i>
        </div>
        
        <div class="max-w-4xl mx-auto relative z-10">
            <div class="inline-block bg-gold/10 text-gold px-4 py-1 rounded-full text-[10px] font-black mb-8 border border-gold/30 tracking-[3px] uppercase">
                Sistema Logístico Nexus-X Starlink USA/COL
            </div>
            <h1 class="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                La secretaria que <span class="text-gold">no tienes que pagar.</span>
            </h1>
            <p class="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Tecnología de **Colombian Trucks Logistics LLC** diseñada para mecánicos que buscan orden, velocidad y el respaldo de la red Nexus-X.
            </p>
            
            <div class="flex flex-col md:flex-row gap-5 justify-center">
                <button onclick="registrarInteres('PLAN_TRIAL_14_DIAS')" class="btn-nexus bg-green-600 hover:bg-green-700 text-white font-black py-5 px-12 rounded-2xl text-lg flex items-center justify-center gap-3">
                    <i class="fas fa-rocket"></i> EMPEZAR GRATIS AHORA
                </button>
                <a href="https://wa.me/573100000000?text=Hola%20Nexus-X,%20solicito%20asesoría%20para%20TallerPRO360" class="btn-nexus bg-white/5 hover:bg-white/10 text-white font-bold py-5 px-12 rounded-2xl text-lg border border-white/20 backdrop-blur-sm flex items-center justify-center gap-3">
                    <i class="fab fa-whatsapp"></i> Hablar con Asesor
                </a>
            </div>
        </div>
    </header>

    <section id="soluciones" class="py-28 px-6 max-w-7xl mx-auto">
        <div class="text-center mb-20">
            <h2 class="text-4xl font-black text-slate-800 mb-4 tracking-tighter italic uppercase">Ingeniería Starlink</h2>
            <div class="h-1 w-20 bg-gold mx-auto mb-6"></div>
            <p class="text-slate-500 font-medium uppercase text-xs tracking-[2px]">Potenciando el sector automotriz desde Charlotte, NC</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-10">
            <div class="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                <div class="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200">
                    <i class="fas fa-microphone-alt text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800 tracking-tight">Voz Nexus-X</h3>
                <p class="text-slate-500 leading-relaxed text-sm">Dicta diagnósticos pesados mientras trabajas. El sistema convierte tu voz en órdenes técnicas con el estándar Easy Vehicle USA.</p>
            </div>

            <div class="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 hover:border-green-200 transition-all group">
                <div class="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-200">
                    <i class="fab fa-whatsapp text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800 tracking-tight">WhatsApp Elite</h3>
                <p class="text-slate-500 leading-relaxed text-sm">Notificaciones automáticas de ingreso y fotos de evidencia. Mantén a tus clientes conectados al progreso de su vehículo.</p>
            </div>

            <div class="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 hover:border-gold transition-all group">
                <div class="bg-gold w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-amber-200">
                    <i class="fas fa-passport text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800 tracking-tight">Passport Starlink</h3>
                <p class="text-slate-500 leading-relaxed text-sm">Cada vehículo tiene una hoja de vida digital inviolable. Consulta el historial global de cualquier placa en nuestra red.</p>
            </div>
        </div>
    </section>

    <section id="precios" class="bg-slate-900 py-28 px-6 relative overflow-hidden">
        <div class="max-w-6xl mx-auto relative z-10">
            <h2 class="text-4xl font-black text-center mb-20 text-white tracking-tighter italic uppercase">Estrategia de <span class="text-gold">Crecimiento</span></h2>
            
            <div class="grid md:grid-cols-3 gap-8 items-center">
                <div class="bg-slate-800/40 p-10 rounded-3xl border border-slate-700 backdrop-blur-md text-white">
                    <h3 class="text-xl font-black mb-2 uppercase tracking-widest text-slate-400">Starter</h3>
                    <div class="text-4xl font-black mb-8">$49.000 <span class="text-xs font-normal opacity-50">/mes</span></div>
                    <ul class="space-y-5 mb-10 text-sm opacity-80">
                        <li><i class="fas fa-check text-green-500 mr-3"></i> 50 Órdenes por Voz</li>
                        <li><i class="fas fa-check text-green-500 mr-3"></i> WhatsApp Básico</li>
                        <li><i class="fas fa-check text-green-500 mr-3"></i> Soporte Email</li>
                    </ul>
                    <button onclick="registrarInteres('INTERES_PLAN_STARTER')" class="w-full py-4 rounded-xl border-2 border-slate-600 font-black hover:bg-slate-700 transition uppercase text-xs tracking-widest">Seleccionar</button>
                </div>

                <div class="bg-white p-12 rounded-[40px] shadow-2xl border-4 border-gold transform scale-105 relative">
                    <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold text-slate-900 px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-[2px]">Más Solicitado</div>
                    <h3 class="text-xl font-black mb-2 text-slate-900 uppercase tracking-widest">Pro Nexus-X</h3>
                    <div class="text-5xl font-black mb-8 text-slate-900">$89.000 <span class="text-xs font-normal text-slate-400">/mes</span></div>
                    <ul class="space-y-5 mb-12 text-sm text-slate-600 font-bold italic">
                        <li><i class="fas fa-check text-blue-600 mr-3"></i> Órdenes Ilimitadas</li>
                        <li><i class="fas fa-check text-blue-600 mr-3"></i> Caja y Finanzas Full</li>
                        <li><i class="fas fa-check text-blue-600 mr-3"></i> Liquidación de Nómina</li>
                        <li><i class="fas fa-check text-blue-600 mr-3"></i> Passport Global Access</li>
                    </ul>
                    <button onclick="registrarInteres('INTERES_PLAN_PRO_NEXUS')" class="w-full py-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition shadow-xl uppercase text-xs tracking-[2px]">Activar Red Pro</button>
                </div>

                <div class="bg-slate-800/40 p-10 rounded-3xl border border-slate-700 backdrop-blur-md text-white text-right">
                    <h3 class="text-xl font-black mb-2 uppercase tracking-widest text-slate-400">Admin+</h3>
                    <div class="text-4xl font-black mb-8">$129.000 <span class="text-xs font-normal opacity-50">/mes</span></div>
                    <ul class="space-y-5 mb-10 text-sm opacity-80">
                        <li><i class="fas fa-check text-gold mr-3"></i> Facturación Electrónica</li>
                        <li><i class="fas fa-check text-gold mr-3"></i> Multi-Taller Sync</li>
                        <li><i class="fas fa-check text-gold mr-3"></i> Soporte VIP Nexus-X</li>
                    </ul>
                    <button onclick="registrarInteres('INTERES_PLAN_ADMIN_PLUS')" class="w-full py-4 rounded-xl border-2 border-gold text-gold font-black hover:bg-gold/10 transition uppercase text-xs tracking-widest text-center">Contactar CEO</button>
                </div>
            </div>
        </div>
    </section>

    <footer class="py-20 text-center bg-white border-t border-slate-100">
        <div class="max-w-4xl mx-auto px-6">
            <div class="flex justify-center items-center gap-3 mb-8">
                <i class="fas fa-satellite text-blue-600 text-3xl"></i>
                <span class="text-2xl font-black tracking-tighter uppercase">TallerPRO360</span>
            </div>
            <p class="font-black text-slate-800 uppercase tracking-[3px] text-sm mb-4">Nexus-X Starlink SAS</p>
            <p class="text-slate-400 text-xs mb-8">Charlotte, NC. United States | Ibagué, Colombia</p>
            <div class="flex flex-wrap justify-center gap-8 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                <span>EASY VEHICLE USA</span>
                <span>COLOMBIAN TRUCKS LOGISTICS LLC</span>
                <span>SISTEMA LOGISTICO NEXUS-X</span>
            </div>
            <div class="mt-12 text-[10px] text-slate-300 font-medium">
                © 2026 Todos los derechos pertenecen a la firma legalmente constituida en Charlotte NC.
            </div>
        </div>
    </footer>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
            authDomain: "tallerpro360.firebaseapp.com",
            projectId: "tallerpro360",
            storageBucket: "tallerpro360.appspot.com",
            messagingSenderId: "636224778184",
            appId: "1:636224778184:web:9bd7351b6458a1ef625afd"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Función Maestra de Rastreo de Clientes
        window.registrarInteres = async (tipoPlan) => {
            console.log("Rastreando interés para: " + tipoPlan);
            try {
                // Registramos el lead en la base de datos de Nexus-X
                await addDoc(collection(db, "leads_interesados"), {
                    plan_clicado: tipoPlan,
                    agente: "LANDING_WEB_DIRECTA",
                    ubicacion_estimada: "COL_USA_TRACK",
                    fecha: serverTimestamp()
                });
                
                // Redirigir al sistema operativo
                window.location.href = "app.php"; 
            } catch (error) {
                console.error("Error Nexus-X Tracker: ", error);
                // Si falla el rastreo, no bloqueamos al cliente, lo enviamos a la app de todos modos
                window.location.href = "app.php";
            }
        };
    </script>
</body>
</html>
