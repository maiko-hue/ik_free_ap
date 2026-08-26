// seguridad.js - MODO VELOCIDAD Y PERSISTENCIA (VIGILANTE CORREGIDO)
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const paginaActual = window.location.pathname;
const esPuertaPrincipal = paginaActual.includes("config.html");
const esIndex = paginaActual.includes("index.html") || paginaActual === "/" || paginaActual.endsWith("/");

if (esPuertaPrincipal || esIndex) {
    document.body.style.opacity = "0";
}

const style = document.createElement('style');
style.textContent = `
    .seguridad-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
    .seguridad-card { background: white; width: 85%; max-width: 320px; border-radius: 20px; padding: 30px 20px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.4); animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .seguridad-icon { font-size: 55px; color: #00b551; margin-bottom: 20px; }
    .seguridad-title { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 12px; }
    .seguridad-text { font-size: 14px; color: #666; margin-bottom: 25px; line-height: 1.6; }
    .btn-soporte { background-color: #00b551; color: white; border: none; width: 100%; padding: 15px; border-radius: 15px; font-size: 16px; font-weight: 700; cursor: pointer; display: block; text-decoration: none; margin-bottom: 12px; }
    .btn-salir { background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; }
`;
document.head.appendChild(style);

let vigilanteActivo = null;

window.expulsarUsuario = async function() { 
    localStorage.removeItem("pase_vip_ibk");
    localStorage.removeItem("sesion_iniciada");
    localStorage.removeItem("sesion_token_ibk");
    try {
        await signOut(auth);
    } catch(e) { console.error("Error cerrando sesión:", e); }
    window.location.href = "index.html"; 
};

onAuthStateChanged(auth, async (user) => {
    // 1. Si NO hay usuario logueado
    if (!user) {
        if (!esIndex) window.expulsarUsuario();
        else document.body.style.opacity = "1"; 
        return;
    }

    // 2. REGLA SALVAVIDAS: Si estamos en el Index, el Vigilante NO interviene.
    // Solo verifica si el usuario ya era VIP para mandarlo directo al PIN.
    if (esIndex) {
        if (localStorage.getItem("pase_vip_ibk") === "true") {
            window.location.href = "login_pin.html";
        } else {
            document.body.style.opacity = "1"; // Deja que el index.html haga su trabajo
        }
        return; // ¡AQUÍ ESTÁ LA MAGIA! Cortamos la función para que no te expulse.
    }

    if (!esPuertaPrincipal) return;

    // 3. LÓGICA DE PUERTAS PRINCIPALES (Vigilancia Estricta)
    const miTicket = localStorage.getItem("sesion_token_ibk");
    
    try {
        const userRef = doc(db, "clientes_ibk", user.email);
        
        vigilanteActivo = onSnapshot(userRef, (userSnap) => {
            if (!userSnap.exists()) {
                window.expulsarUsuario();
                return;
            }

            const userData = userSnap.data();

            if (userData.sesion_token && userData.sesion_token !== miTicket) {
                document.body.innerHTML = `
                    <div class="seguridad-overlay">
                        <div class="seguridad-card">
                            <i class="fa-solid fa-right-from-bracket" style="font-size: 55px; color: #ef4444; margin-bottom: 20px;"></i>
                            <div class="seguridad-title">Sesión Cerrada</div>
                            <div class="seguridad-text">Tu sesión se ha cerrado por actividad en otro dispositivo.</div>
                            <button class="btn-soporte" style="background-color: #ef4444;" onclick="expulsarUsuario()">Entendido</button>
                        </div>
                    </div>
                `;
                document.body.style.opacity = "1";
                if (vigilanteActivo) vigilanteActivo(); 
                return; 
            }

            if (userData.estado === "activo") {
                localStorage.setItem("pase_vip_ibk", "true");
                document.body.style.opacity = "1";
                document.body.style.transition = "opacity 0.2s";
            } else {
                document.body.innerHTML = `
                    <div class="seguridad-overlay">
                        <div class="seguridad-card">
                            <i class="fa-solid fa-circle-user seguridad-icon"></i>
                            <div class="seguridad-title">¡Cuenta no activada!</div>
                            <div class="seguridad-text">Hola <strong>${user.displayName || 'Usuario'}</strong>, tu acceso a Interbank Premium se encuentra <strong>inactivo</strong>. Contacta a soporte.</div>
                            <a href="https://t.me/MaikolEsleiter" class="btn-soporte">Contactar Soporte</a>
                            <button class="btn-salir" onclick="window.expulsarUsuario()">Volver al inicio</button>
                        </div>
                    </div>
                `;
                document.body.style.opacity = "1";
                localStorage.removeItem("pase_vip_ibk"); 
            }
        });
    } catch (error) {
        console.error("Error en seguridad:", error);
        window.expulsarUsuario();
    }
});