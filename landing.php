<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TallerPRO360 - Nexus-X Starlink | Gestión Élite para Talleres</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .gradient-starlink {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        .gold-border { border-color: #f59e0b; }
        .text-gold { color: #f59e0b; }
    </style>
</head>
<body class="bg-slate-50 font-sans">

    <nav class="bg-[#0f172a] py-4 px-6 border-b border-white/10 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <i class="fas fa-satellite text-gold text-2xl"></i>
                <span class="text-white font-black text-xl tracking-tighter">TallerPRO360 <span class="text-gold">ELITE</span></span>
            </div>
            <div class="hidden md:flex gap-6 text-white text-sm font-bold uppercase tracking-widest">
                <a href="#soluciones" class="hover:text-gold transition">Soluciones</a>
                <a href="#precios" class="hover:text-gold transition">Precios</a>
                <a href="index.php" class="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition">Entrar al Sistema</a>
            </div>
        </div>
    </nav>

    <header class="gradient-starlink text-white py-20 px-6 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <i class="fas fa-microchip text-[20rem] absolute -top-20 -left-20"></i>
            <i class="fas fa-truck-moving text-[15rem] absolute -bottom-10 -right-10"></i>
        </div>
        
        <div class="max-w-4xl mx-auto relative z-10">
            <div class="inline-block bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-xs font-bold mb-6 border border-blue-500/30">
                SISTEMA LOGÍSTICO NEXUS-X STARLINK USA/COL
            </div>
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight">
                La secretaria que <span class="text-gold">no tienes que pagar.</span>
            </h1>
            <p class="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                TallerPRO360: El cerebro digital de **Nexus-X** para mecánicos que quieren facturar como grandes sin complicaciones.
            </p>
            <div class="flex flex-col md:flex-row gap-4 justify-center">
                <a href="index.php?action=register" class="bg-green-600 hover:bg-green-700 text-white font-black py-5 px-10 rounded-2xl text-lg transition shadow-[0_0_20px_rgba(22,163,74,0.4)] flex items-center justify-center gap-2">
                    <i class="fas fa-rocket"></i> PROBAR 14 DÍAS GRATIS
                </a>
                <a href="https://wa.me/573100000000" class="bg-white/10 hover:bg-white/20 text-white font-bold py-5 px-10 rounded-2xl text-lg transition border border-white/30 backdrop-blur-sm">
                    Hablar con un Asesor
                </a>
            </div>
        </div>
    </header>

    <section id="soluciones" class="py-24 px-6 max-w-7xl mx-auto">
        <div class="text-center mb-20">
            <h2 class="text-4xl font-black text-slate-800 mb-4">Ingeniería Starlink para tu taller</h2>
            <p class="text-slate-500">Tecnología de **Colombian Trucks Logistics LLC** al servicio del mecánico moderno.</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div class="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition">
                    <i class="fas fa-microphone-alt text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800">Manos Libres AI</h3>
                <p class="text-slate-600 leading-relaxed">Dicta los diagnósticos mientras trabajas debajo del camión. El sistema Nexus-X procesa tu voz y crea la orden técnica al instante.</p>
            </div>
            <div class="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div class="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 -rotate-3 group-hover:rotate-0 transition">
                    <i class="fab fa-whatsapp text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800">Vínculo con Cliente</h3>
                <p class="text-slate-600 leading-relaxed">Envía reportes de ingreso y fotos de evidencia por WhatsApp automáticamente. Genera confianza y transparencia Starlink.</p>
            </div>
            <div class="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div class="bg-gold w-16 h-16 rounded-2xl flex items-center justify-center mb-8 rotate-6 group-hover:rotate-0 transition" style="background-color: #f59e0b;">
                    <i class="fas fa-id-badge text-white text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black mb-4 text-slate-800">Vehicle Passport</h3>
                <p class="text-slate-600 leading-relaxed">Cada vehículo en la red tiene una hoja de vida digital. Consulta reparaciones previas hechas en cualquier taller de la red.</p>
            </div>
        </div>
    </section>

    <section id="precios" class="bg-slate-900 py-24 px-6 relative overflow-hidden">
        <div class="max-w-6xl mx-auto relative z-10">
            <h2 class="text-4xl font-black text-center mb-16 text-white">Planes que <span class="text-gold">crecen contigo</span></h2>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 backdrop-blur-md">
                    <h3 class="text-xl font-bold mb-2 text-white">Starter (Trial)</h3>
                    <div class="text-4xl font-black mb-6 text-white">$0 <span class="text-sm font-normal text-slate-400">/14 días</span></div>
                    <ul class="space-y-4 mb-8 text-slate-300">
                        <li><i class="fas fa-check text-green-500 mr-2"></i> Órdenes por Voz</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i> Registro de Placas</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i> WhatsApp Básico</li>
                    </ul>
                    <a href="index.php" class="block text-center w-full py-4 rounded-xl border-2 border-slate-600 text-white font-bold hover:bg-slate-700 transition">Comenzar Gratis</a>
                </div>

                <div class="bg-white p-8 rounded-3xl shadow-2xl border-4 border-gold transform scale-105 relative">
                    <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold text-slate-900 px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest">EL MÁS BUSCADO</div>
                    <h3 class="text-xl font-bold mb-2 text-slate-900">Pro Nexus-X</h3>
                    <div class="text-5xl font-black mb-6 text-slate-900">$89.000 <span class="text-sm font-normal text-slate-500">/mes</span></div>
                    <ul class="space-y-4 mb-8 text-slate-700 font-medium">
                        <li><i class="fas fa-check text-blue-600 mr-2"></i> Todo el Plan Starter</li>
                        <li><i class="fas fa-check text-blue-600 mr-2"></i> Caja Menor y Gastos</li>
                        <li><i class="fas fa-check text-blue-600 mr-2"></i> Liquidación de Mecánicos</li>
                        <li><i class="fas fa-check text-blue-600 mr-2"></i> Vehicle Passport Full</li>
                    </ul>
                    <a href="index.php" class="block text-center w-full py-4 rounded-xl bg-slate-900 text-white font-black hover:bg-black transition shadow-lg">ACTIVAR PLAN PRO</a>
                </div>

                <div class="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 backdrop-blur-md">
                    <h3 class="text-xl font-bold mb-2 text-white">Admin+ Elite</h3>
                    <div class="text-4xl font-black mb-6 text-white">$129.000 <span class="text-sm font-normal text-slate-400">/mes</span></div>
                    <ul class="space-y-4 mb-8 text-slate-300">
                        <li><i class="fas fa-check text-green-500 mr-2"></i> Todo el Plan Pro</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i> Soporte 24/7 Nexus-X</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i> Facturación Electrónica</li>
                    </ul>
                    <button class="w-full py-4 rounded-xl border-2 border-gold text-gold font-bold hover:bg-gold/10 transition">Hablar con Ventas</button>
                </div>
            </div>
        </div>
    </section>

    <footer class="py-16 text-center bg-white border-t border-slate-100">
        <div class="flex justify-center items-center gap-2 mb-6">
            <i class="fas fa-satellite text-blue-600 text-3xl"></i>
            <span class="text-2xl font-black tracking-tighter">TallerPRO360</span>
        </div>
        <p class="font-bold text-slate-800">Un producto de Sistema Logístico Nexus-X Starlink SAS</p>
        <p class="text-slate-500 text-sm mb-4">Charlotte, NC. United States | Ibagué, Colombia</p>
        <div class="flex justify-center gap-8 text-slate-400 text-xs uppercase font-black">
            <span>EASY VEHICLE USA</span>
            <span>COLOMBIAN TRUCKS LOGISTICS LLC</span>
        </div>
        <div class="mt-8 text-[0.6rem] text-slate-400">
            © 2026 Todos los derechos pertenecen a Colombian Trucks Logistics LLC & Nexus-X Starlink SAS.
        </div>
    </footer>

</body>
</html>
