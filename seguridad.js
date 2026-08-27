// seguridad.js - VERSIÓN DE ACCESO LIBRE (Con Reloj de Arena / Caducidad)
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const paginaActual = window.location.pathname;
const esPuertaPrincipal = paginaActual.includes("config.html");
const esIndex = paginaActual.includes("index.html") || paginaActual === "/" || paginaActual.endsWith("/");

// Ocultamos el body rápido para evitar parpadeos visuales
if (!esIndex) {
    document.body.style.opacity = "0";
}

// Estilos para la pantalla de bloqueo por caducidad (Nativo y profesional)
const style = document.createElement('style');
style.textContent = `
    .bloqueo-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
    .bloqueo-card { background: white; width: 85%; max-width: 340px; border-radius: 20px; padding: 30px 20px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.4); animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .bloqueo-icon { font-size: 50px; color: #f59e0b; margin-bottom: 15px; }
    .bloqueo-title { font-size: 20px; font-weight: 800; color: #001e60; margin-bottom: 10px; }
    .bloqueo-text { font-size: 15px; color: #555; margin-bottom: 25px; line-height: 1.5; font-weight: 500; }
    .btn-tg-premium { background-color: #229ED9; color: white; border: none; width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; text-decoration: none; margin-bottom: 12px; gap: 8px; transition: 0.2s;}
    .btn-tg-premium:active { transform: scale(0.95); }
    .btn-copiar-ref { background-color: #e8f7ee; color: #00b551; border: none; width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 12px; transition: 0.2s;}
    .btn-copiar-ref:active { transform: scale(0.95); }
    .btn-salir-bloqueo { background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 5px; }
`;
document.head.appendChild(style);

// Función básica para salir
window.expulsarUsuario = async function() { 
    localStorage.removeItem("sesion_iniciada");
    localStorage.removeItem("sesion_token_ibk");
    localStorage.removeItem("ibk_mi_codigo");
    try {
        await signOut(auth);
    } catch(e) { console.error("Error cerrando sesión:", e); }
    window.location.href = "index.html"; 
};

// Función para mostrar la pantalla de bloqueo
function mostrarPantallaCaducidad(codigoMiRef) {
    // Armamos el enlace de invitación de forma dinámica
    const linkInvitacion = window.location.origin + "/?ref=" + codigoMiRef;
    
    document.body.innerHTML += `
        <div class="bloqueo-overlay">
            <div class="bloqueo-card">
                <i class="fa-solid fa-hourglass-end bloqueo-icon"></i>
                <div class="bloqueo-title">Tiempo Agotado</div>
                <div class="bloqueo-text">Tu tiempo de prueba ha terminado. Invita a 1 amigo para ganar 2 días más, o compra tu acceso con:</div>
                
                <a href="https://t.me/MaikolEsleiter" class="btn-tg-premium">
                    <i class="fa-brands fa-telegram" style="font-size: 18px;"></i> MaikolEsleiter
                </a>
                
                <button class="btn-copiar-ref" onclick="navigator.clipboard.writeText('${linkInvitacion}'); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> ¡Copiado!'; this.style.backgroundColor='#00b551'; this.style.color='white';">
                    <i class="fa-solid fa-link"></i> Copiar mi enlace
                </button>

                <button class="btn-salir-bloqueo" onclick="expulsarUsuario()">Cerrar Sesión</button>
            </div>
        </div>
    `;
    document.body.style.opacity = "1";
}

// El vigilante (Verifica inicio de sesión y fecha de caducidad)
onAuthStateChanged(auth, async (user) => {
    // 1. Si NO hay usuario y no está en la portada, lo regresamos al index
    if (!user) {
        if (!esIndex) {
            window.expulsarUsuario();
        } else {
            document.body.style.opacity = "1"; 
        }
        return;
    }

    // 2. Si SÍ hay usuario y estamos en el index, lo dejamos tranquilo
    if (esIndex) {
        document.body.style.opacity = "1";
        return;
    }

    // 3. Revisión del Reloj de Arena (Solo si NO es el index)
    try {
        const userRef = doc(db, "accesos_libres", user.email);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const datos = snap.data();
            
            // Comparamos las fechas
            const fechaCaducidad = new Date(datos.fecha_caducidad);
            const fechaActual = new Date();

            if (fechaActual > fechaCaducidad) {
                // ¡SE ACABÓ EL TIEMPO! Mostramos la pantalla de bloqueo
                const miCodigo = datos.id || localStorage.getItem("ibk_mi_codigo") || "";
                mostrarPantallaCaducidad(miCodigo);
            } else {
                // TIEMPO VIGENTE: Lo dejamos pasar a la app y le mostramos la pantalla
                document.body.style.opacity = "1";
                document.body.style.transition = "opacity 0.2s";
            }
        } else {
            // Si por algún motivo no existe su documento, lo expulsamos
            window.expulsarUsuario();
        }
    } catch(error) {
        console.error("Error verificando caducidad:", error);
        // Fallback en caso de error de internet para no romper la app entera
        document.body.style.opacity = "1"; 
    }
});