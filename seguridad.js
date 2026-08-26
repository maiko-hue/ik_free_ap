// seguridad.js - VERSIÓN DE ACCESO LIBRE (Sin anti-clon ni bloqueos)
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const paginaActual = window.location.pathname;
const esPuertaPrincipal = paginaActual.includes("config.html");
const esIndex = paginaActual.includes("index.html") || paginaActual === "/" || paginaActual.endsWith("/");

// Ocultamos el body rápido para evitar parpadeos visuales
if (esPuertaPrincipal || esIndex) {
    document.body.style.opacity = "0";
}

// Función básica para salir
window.expulsarUsuario = async function() { 
    localStorage.removeItem("sesion_iniciada");
    localStorage.removeItem("sesion_token_ibk");
    try {
        await signOut(auth);
    } catch(e) { console.error("Error cerrando sesión:", e); }
    window.location.href = "index.html"; 
};

// El único vigilante que queda: ¿Está logueado o no?
onAuthStateChanged(auth, (user) => {
    // 1. Si NO hay usuario y no está en la portada, lo regresamos al index
    if (!user) {
        if (!esIndex) {
            window.expulsarUsuario();
        } else {
            document.body.style.opacity = "1"; 
        }
        return;
    }

    // 2. Si SÍ hay usuario, simplemente lo dejamos pasar sin hacer preguntas
    document.body.style.opacity = "1";
    document.body.style.transition = "opacity 0.2s";
});