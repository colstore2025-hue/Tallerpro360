/**
 * marketplace_bridge.js - NEXUS-X 
 * Módulo para embeber el Marketplace en el Dashboard
 */
export default async function marketplaceBridge(container) {
    container.innerHTML = `
        <div class="w-full h-screen bg-[#010409]">
            <iframe src="marketplace.html" class="w-full h-full border-none shadow-2xl"></iframe>
        </div>
    `;
}
