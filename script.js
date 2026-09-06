import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "AIzaSyC4r-lwyA8lUuN1blNr97lIf_8jI6wcCkY",

  authDomain: "fatima-6247b.firebaseapp.com",

  projectId: "fatima-6247b",

  storageBucket: "fatima-6247b.firebasestorage.app",

  messagingSenderId: "64107332049",

  appId: "1:64107332049:web:1d173226346310703da0f0"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. LÓGICA DE PESTAÑAS (TABS) ---
window.cambiarTab = function(estado) {
    // Cambiar estilos de los botones
    document.getElementById('btn-tab-pendientes').classList.toggle('activo', estado === 'pendientes');
    document.getElementById('btn-tab-completadas').classList.toggle('activo', estado === 'completadas');
    
    // Mostrar/Ocultar listas
    document.getElementById('vista-pendientes').style.display = estado === 'pendientes' ? 'block' : 'none';
    document.getElementById('vista-completadas').style.display = estado === 'completadas' ? 'block' : 'none';
}

// --- 2. LÓGICA CRUD (Crear, Leer, Actualizar, Borrar) ---

window.agregarItem = async function(tipo) {
    const inputId = tipo === 'peli' ? 'input-peli' : 'input-lugar';
    const coleccion = tipo === 'peli' ? 'peliculas' : 'lugares'; 
    const input = document.getElementById(inputId);
    const valor = input.value.trim();

    if (valor !== "") {
        try {
            await addDoc(collection(db, coleccion), {
                texto: valor,
                estado: 'pendiente', // Nuevo campo
                fecha: serverTimestamp() 
            });
            input.value = ""; 
        } catch (e) {
            console.error("Error al agregar: ", e);
        }
    }
}

window.eliminarItem = async function(tipo, idDocumento) {
    if(confirm("¿Seguro que quieres borrar esto?")) {
        const coleccion = tipo === 'peli' ? 'peliculas' : 'lugares';
        await deleteDoc(doc(db, coleccion, idDocumento));
    }
}

window.editarItem = async function(tipo, idDocumento, textoActual) {
    const nuevoTexto = prompt("Edita el texto:", textoActual);
    if (nuevoTexto && nuevoTexto.trim() !== "" && nuevoTexto !== textoActual) {
        const coleccion = tipo === 'peli' ? 'peliculas' : 'lugares';
        await updateDoc(doc(db, coleccion, idDocumento), {
            texto: nuevoTexto.trim()
        });
    }
}

window.cambiarEstado = async function(tipo, idDocumento, estadoActual) {
    const coleccion = tipo === 'peli' ? 'peliculas' : 'lugares';
    const nuevoEstado = estadoActual === 'pendiente' ? 'completado' : 'pendiente';
    await updateDoc(doc(db, coleccion, idDocumento), {
        estado: nuevoEstado
    });
}

// --- 3. ESCUCHAR CAMBIOS (REAL-TIME) ---
function cargarListaRealtime(tipo) {
    const coleccion = tipo === 'peli' ? 'peliculas' : 'lugares';
    
    const idPendientes = tipo === 'peli' ? 'lista-pelis-pendientes' : 'lista-lugares-pendientes';
    const idCompletadas = tipo === 'peli' ? 'lista-pelis-completadas' : 'lista-lugares-completadas';
    
    const listaPendientes = document.getElementById(idPendientes);
    const listaCompletadas = document.getElementById(idCompletadas);
    
    // Si la lista no existe en la página actual (ej. estamos en index.html), no hacemos nada
    if (!listaPendientes) return;

    const q = query(collection(db, coleccion), orderBy("fecha", "asc"));

    onSnapshot(q, (snapshot) => {
        listaPendientes.innerHTML = ""; 
        listaCompletadas.innerHTML = ""; 

        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id; 
            if(item.fecha === null) return; 

            // Si es un dato viejo que no tiene estado, lo tratamos como pendiente
            const estado = item.estado || 'pendiente'; 

            const li = document.createElement('li');
            
            // Definimos el ícono del botón dependiendo del estado
            const iconoCheck = estado === 'pendiente' ? '✔' : '↺';
            const tituloCheck = estado === 'pendiente' ? 'Marcar como visto/hecho' : 'Regresar a pendientes';

            li.innerHTML = `
                <span>${item.texto}</span>
                <div class="acciones-item">
                    <button class="btn-accion btn-check" title="${tituloCheck}" onclick="cambiarEstado('${tipo}', '${id}', '${estado}')">${iconoCheck}</button>
                    <button class="btn-accion btn-editar" title="Editar" onclick="editarItem('${tipo}', '${id}', '${item.texto}')">✎</button>
                    <button class="btn-accion btn-borrar" title="Borrar" onclick="eliminarItem('${tipo}', '${id}')">✖</button>
                </div>
            `;

            if (estado === 'pendiente') {
                listaPendientes.appendChild(li);
            } else {
                listaCompletadas.appendChild(li);
            }
        });
    });
}

// Ejecutar oyentes. (El if (!listaPendientes) arriba evita errores si estamos en otra página)
cargarListaRealtime('peli');
cargarListaRealtime('lugar');


// --- 4. LÓGICA DEL CONTADOR (Se ejecuta solo si existe el id 'tiempo-transcurrido') ---
const cajaTiempo = document.getElementById('tiempo-transcurrido');
if (cajaTiempo) {
    const fechaInicio = new Date(2026, 8, 7); // 7 de septiembre de 2026 (meses empiezan en 0)
    function actualizarContador() {
        const ahora = new Date();
        if (ahora < fechaInicio) {
            cajaTiempo.innerHTML = "Ya casi es el día... ¡Faltan " + Math.ceil((fechaInicio - ahora) / (1000 * 60 * 60 * 24)) + " días!";
            return;
        }
        let diff = ahora - fechaInicio;
        const diasTotales = Math.floor(diff / (1000 * 60 * 60 * 24));
        const años = Math.floor(diasTotales / 365);
        const meses = Math.floor((diasTotales % 365) / 30);
        const dias = (diasTotales % 365) % 30;
        
        cajaTiempo.innerHTML = `${años} años, ${meses} meses y ${dias} días`;
    }
    setInterval(actualizarContador, 1000);
    actualizarContador();
}

// --- 5. LÓGICA PARA LA TECLA ENTER ---
document.addEventListener('DOMContentLoaded', () => {
    const inputPeli = document.getElementById('input-peli');
    const inputLugar = document.getElementById('input-lugar');

    if (inputPeli) {
        inputPeli.addEventListener('keypress', function(evento) {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                agregarItem('peli');
            }
        });
    }

    if (inputLugar) {
        inputLugar.addEventListener('keypress', function(evento) {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                agregarItem('lugar');
            }
        });
    }
});

// --- 6. LÓGICA DE BOTONES WHATSAPP (NFC) ---
document.addEventListener('DOMContentLoaded', () => {
    const btnTeQuiero = document.getElementById('btn-wa-tequiero');
    const btnCasa = document.getElementById('btn-wa-casa');

    // Solo se ejecuta si estamos en la página de inicio (donde están los botones)
    if (btnTeQuiero && btnCasa) {
        
        // 1. PON SUS NÚMEROS AQUÍ (con código de país, ej: 52 para México)
        const numeroSergio = "523335046533"; 
        const numeroFatima = "523334892015"; 

        // 2. Leer la URL para ver de quién es el NFC
        const urlParams = new URLSearchParams(window.location.search);
        const usuario = urlParams.get('usuario');

        let numeroDestino = numeroSergio; // Por defecto te llegan a ti

        // 3. Asignar el destino cruzado
        if (usuario === 'fatima') {
            numeroDestino = numeroSergio; // Si lee Fátima, te lo manda a ti
        } else if (usuario === 'sergio') {
            numeroDestino = numeroFatima; // Si lee Sergio, se lo manda a ella
        }

        // 4. Armar los enlaces para WhatsApp
        const msjTeQuiero = encodeURIComponent("Te quiero mucho ❤️");
        const msjCasa = encodeURIComponent("Ya estoy en mi casa, mi vida 🏡");

        btnTeQuiero.href = `whatsapp://send?phone=${numeroDestino}&text=${msjTeQuiero}`;
        btnCasa.href = `whatsapp://send?phone=${numeroDestino}&text=${msjCasa}`;
    }
});