/**
 * --- 📐 3. ARQUITECTURA VISUAL MAESTRA (DASHBOARD TOTAL V35.1) ---
 * Fusión: Estética Skynet + Telemetría Empresarial PRO360
 * Integración total: staff.js, gerenteAI.js, finanzas_elite.js
 */
function renderInterface(container, plan, user, empresa, config) {
    const isElite = (plan === 'ELITE' || plan === 'PRO');

    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-700 pb-40 max-w-[1800px] mx-auto bg-[#010409] text-white selection:bg-cyan-500/30">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-white/5 pb-10">
            <div class="relative pl-6 group">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4] group-hover:shadow-[0_0_40px_#06b6d4] transition-all"></div>
                <h1 class="orbitron text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">${empresa}</h1>
                <p class="text-[9px] text-slate-500 font-black orbitron tracking-[0.5em] mt-2 uppercase italic">
                    OPERADOR: <span class="text-white">${user}</span> // <span class="text-cyan-500 text-[10px]">SYSTEM_V35.0_PRO_CORE</span>
                </p>
            </div>
            <div class="bg-[#0d1117] border-2 ${config.clase || 'border-cyan-500/30'} px-10 py-5 rounded-[2.5rem] text-center shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                <p class="text-[8px] font-black orbitron uppercase mb-1 tracking-widest text-slate-400 text-center">Status de Licencia</p>
                <p class="text-3xl font-black orbitron italic text-white">${plan} <span class="text-cyan-400 uppercase">Active</span></p>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${renderBtn('Clientes', 'fa-users', '#clientes', config.modulos.includes('clientes'))}
            ${renderBtn('Vehículos', 'fa-car', '#vehiculos', config.modulos.includes('vehiculos'))}
            ${renderBtn('Inventario', 'fa-box-open', '#inventario', config.modulos.includes('inventario'))}
            ${renderBtn('Caja', 'fa-vault', '#pagos', config.modulos.includes('pagos'))}
            ${renderBtn('Contabilidad', 'fa-file-invoice-dollar', '#contabilidad', config.modulos.includes('contabilidad'))}
            ${renderBtn('Nómina', 'fa-user-tie', '#nomina', config.modulos.includes('nomina'))}
            
            ${renderBtn('Reportes', 'fa-chart-pie', '#reportes', config.modulos.includes('reportes'))}
            ${renderBtn('Marketplace', 'fa-shop', '#marketplace', isElite)}
            ${renderBtn('Publish', 'fa-cloud-arrow-up', '#publish', isElite)}
            
            <button onclick="window.open('https://wa.me/573115709730?text=SOPORTE_NEXUS_X_STARLINK:%20Solicito%20asistencia%20técnica%20para%20${empresa}', '_blank')" 
                class="flex flex-col items-center justify-center p-6 bg-[#0d1117] border border-white/5 rounded-[2rem] hover:border-green-500/50 transition-all group">
                <i class="fab fa-whatsapp text-2xl mb-3 text-slate-500 group-hover:text-green-400 group-hover:scale-110 transition-transform"></i>
                <span class="orbitron text-[9px] font-black uppercase text-slate-500 group-hover:text-white text-center">Soporte NXS</span>
            </button>

            ${renderBtn('Staff', 'fa-people-group', '#staff', config.modulos.includes('staff'))}
            ${renderBtn('Audit Center', 'fa-shield-halved', '#finanzas-elite', isElite)}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onclick="location.hash='#vehiculos'" class="cursor-pointer bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 p-10 rounded-[3rem] group transition-all relative overflow-hidden">
                <div class="absolute -right-10 -top-10 text-9xl text-white/5 rotate-12 group-hover:text-cyan-500/10 transition-colors"><i class="fas fa-screwdriver-wrench"></i></div>
                <h3 class="orbitron text-xs font-black text-slate-500 mb-2 uppercase tracking-widest italic">Misiones en Proceso</h3>
                <p class="text-4xl font-black orbitron text-white italic tracking-tighter uppercase leading-none">Órdenes de Trabajo</p>
                <div class="mt-6 flex items-center gap-4 text-cyan-500 font-bold text-[10px] orbitron group-hover:translate-x-2 transition-transform">
                    <span>EXPLORAR RADAR</span> <i class="fas fa-arrow-right"></i>
                </div>
            </div>

            <div onclick="${isElite ? "location.hash='#finanzas-elite'" : "window.restrictedAccess('GERENTE AI')"}" 
                class="cursor-pointer bg-gradient-to-br from-[#0d1117] to-black border border-white/5 hover:border-purple-500/50 p-10 rounded-[3rem] group transition-all relative overflow-hidden">
                <div class="absolute -right-10 -top-10 text-9xl text-purple-500/5 group-hover:text-purple-500/10 transition-colors"><i class="fas fa-brain"></i></div>
                <h3 class="orbitron text-xs font-black text-slate-500 mb-2 uppercase tracking-widest italic">Análisis Predictivo</h3>
                <p class="text-4xl font-black orbitron text-white italic tracking-tighter uppercase leading-none">Gerente <span class="text-purple-500">AI</span></p>
                <div class="mt-6 flex items-center gap-4 text-purple-500 font-bold text-[10px] orbitron group-hover:scale-105 transition-transform">
                    <span>DESPLEGAR RED NEURONAL</span> <i class="fas fa-microchip animate-pulse"></i>
                </div>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            </div>

        <div class="grid lg:grid-cols-12 gap-6">
            <div class="lg:col-span-4 bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                <div class="flex justify-between items-center mb-8">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] border-l-2 border-cyan-500 pl-4">Rendimiento Staff</h4>
                    <i class="fas fa-chart-line text-cyan-500/20"></i>
                </div>
                <div id="techEfficiency" class="space-y-6">
                    </div>
            </div>

            <div class="lg:col-span-8 bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
                <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full"></div>
                <div id="boxAI" class="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-110 transition-transform">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div>
                                <h5 class="orbitron text-xs font-black uppercase italic tracking-widest">Nexus Assistant</h5>
                                <p class="text-[8px] text-cyan-500 orbitron font-bold uppercase tracking-[0.2em]">Core_V20_Active</p>
                            </div>
                        </div>
                        <p id="txtAI" class="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium italic">
                            Sincronizando flujo de caja real-time con proyecciones de rampa... Escaneando integridad del sistema financiero para ${empresa}.
                        </p>
                    </div>
                    <div id="btnAI" class="mt-8">
                        <button onclick="location.hash='#finanzas-elite'" class="px-10 py-4 bg-white text-black orbitron text-[10px] font-black uppercase rounded-2xl hover:bg-cyan-400 transition-colors shadow-xl">
                            Entrar al Centro de Control AI
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${renderFooterKpi('Ticket Promedio', 'valTicket', 'fa-ticket')}
            ${renderFooterKpi('Revenue Mensual', 'valRevenue', 'fa-money-bill-trend-up')}
            ${renderFooterKpi('Utilidad Estimada', 'valProfit', 'fa-hand-holding-dollar')}
        </div>
    </div>`;
}

/**
 * RENDERER DE KPIS DE FOOTER (ESTILO PRO360)
 */
function renderFooterKpi(label, id, icon) {
    return `
    <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-cyan-500/30 transition-all relative overflow-hidden">
        <div class="relative z-10">
            <p class="orbitron text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">${label}</p>
            <p id="${id}" class="orbitron text-2xl font-black text-white">$ 0</p>
        </div>
        <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-all relative z-10">
            <i class="fas ${icon}"></i>
        </div>
        <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
    </div>`;
}
