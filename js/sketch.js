'use strict';
// ============================================================
//  Ley de Gay-Lussac — práctica de laboratorio simulada
//  Aire encerrado en un matraz de volumen fijo, conectado por
//  una llave de tres vías a un manómetro digital. El matraz se
//  calienta en un baño de agua sobre una placa calefactora y se
//  comprueba que P/T es constante con T en kelvin.
// ============================================================

const CV_W = 900, CV_H = 600;

// ── Geometría (coordenadas del lienzo) ──────────────────────
const MESA_Y  = 520;                  // borde superior de la mesa
const MANO    = { x: 60, y: 286, w: 150, h: 96 };
const PUERTO_Y = 330;                 // altura de la salida del manómetro
const LLAVE   = { x: 262, y: PUERTO_Y };
const TUBO_X  = 312;                  // donde el tubo sube hacia el matraz
const TUBO_Y  = 150;
const MX      = 470;                  // eje del matraz
const MATRAZ  = { tapon: 160, cuello: 182, hombro: 218, base: 332, ancho: 62 };
const TX      = 548;                  // termómetro
const TERMO   = { arriba: 108, bulbo: 326, yMenos10: 314, pxGrado: 1.6 };
const VARILLA_X = 640;
const VASO    = { ancho: 176, alto: 140, agua: 120 };
const PLACA_H = 30;
const ALTOS   = [18, 83, 148];        // alturas del elevador: abajo, a media altura y arriba
const ELEV_V  = 70;                   // px por segundo
const RELOJ   = { x: 790, y: 470 };

// ── Física ──────────────────────────────────────────────────
// El tiempo va × 10: un segundo de la simulación son diez en el laboratorio.
const T0K          = 273.15;
const TAU_PLACA    = 2.6;             // s: la placa guarda calor y lo sigue dando al apagarla
const TAU_PERDIDA  = 1200;            // s: el baño pierde calor hacia la sala, muy despacio
const TAU_AIRE     = 3;               // s: el aire del matraz tarda en llegar a la temperatura del agua
const TAU_TERMO    = 1.2;             // s: el termómetro tarda un poco en marcar
const T_APAGADO    = 90;              // °C: la placa se apaga sola
const CADA_PANTALLA = 0.5;            // s entre lecturas del manómetro digital

const PASOS = [
    'Con la llave abierta, leer la temperatura y la presión de la sala',
    'Cerrar la llave para encerrar el aire del matraz',
    'Subir el agua con hielo hasta cubrir el matraz y leer',
    'Calentar, apagar cerca de 20, 40, 60 y 80 °C y leer',
    'Probar P / t con la temperatura en °C',
    'Pasar a kelvin y calcular P / T',
    'Alargar la recta de P frente a t hasta P = 0',
    'Mirar la gráfica P frente a T en kelvin',
    'Explicarlo con partículas',
];
const N_PASOS = PASOS.length;

const INDICACIONES = [
    'Paso 1: con la llave abierta y el elevador abajo, lleva la lupa al termómetro y lee la temperatura de la sala. Lee también el manómetro y apunta las dos en la fila «Sala».',
    'Paso 2: cierra la llave (palanca hacia abajo) para encerrar el aire del matraz.',
    'Paso 3: sube el elevador hasta arriba para que el agua con hielo cubra el matraz. Espera a que el termómetro y el manómetro se paren y apunta la fila «Hielo».',
    'Paso 4: enciende la placa. Apágala unos grados antes de {o} °C, espera a que el termómetro y el manómetro se paren y apunta la fila «≈ {o} °C».',
    'Paso 5: calcula P / t con la temperatura en °C para las medidas de {a} y {b} °C. ¿Sale lo mismo?',
    'Paso 6: pasa cada temperatura a kelvin (T = t + 273) y calcula P / T con tres decimales.',
    'Paso 7: arrastra los extremos de la regla naranja de la gráfica hasta que pase por tus puntos. ¿A qué temperatura llega la regla a P = 0? Apúntalo.',
    'Paso 8: cambia la gráfica a «P frente a T (K)». ¿Por dónde pasa ahora la recta?',
    'Paso 9: responde en el panel la pregunta de partículas.',
];

const PREGUNTA = [
    { txt: 'las partículas del aire se dilatan y ocupan más sitio.',
      exp: 'No. Las partículas no cambian de tamaño al calentarlas. Cuando un gas se dilata es porque sus partículas se separan, y aquí ni eso puede pasar: el matraz no deja que el volumen crezca. Lo que cambia es lo deprisa que se mueven.' },
    { txt: 'al calentar aparecen más partículas de aire.',
      exp: 'No. El matraz está cerrado: no entra ni sale aire, y el calor no crea partículas. Hay las mismas que al principio.' },
    { txt: 'las partículas se mueven más deprisa y chocan con las paredes más veces y con más fuerza.', ok: true,
      exp: '✓ Eso es. Al subir la temperatura, las partículas se mueven más deprisa: cada choque contra la pared es más fuerte y hay más choques por segundo, así que la presión sube. Cuanto más fría está, más despacio se mueven; en el cero absoluto, la presión sería cero.' },
    { txt: 'el calor es una sustancia que entra en el matraz y empuja las paredes.',
      exp: 'No. El calor no es una sustancia ni ocupa sitio: es energía que pasa del agua caliente al aire. Esa energía hace que las partículas del aire se muevan más deprisa.' },
];

// ── Estado ─────────────────────────────────────────────────
let nivel = 'guiada';          // 'guiada' | 'libre'
let montaje = MONTAJES[Math.floor(Math.random() * MONTAJES.length)];   // al azar, salvo ?montaje=N

let tAgua = 0;                 // °C, media del baño
let hielo = 0;                 // hielo que queda, en «grados de calor»
let calorPlaca = 0;            // calor guardado en la placa, en grados del baño
let placaOn = false;
let potencia = 'medio';
let agitadorOn = false;
let estratificacion = 0;       // °C: sin remover, el agua de arriba está más fría que la media
let tTermo = 20;               // lo que marca el termómetro
let tAire = 20;                // temperatura del aire del matraz
let pRef = 94, tRefK = 293;    // el aire encerrado: P = pRef · T / tRefK
let llaveAbierta = true;
let elevIdx = 0;               // 0 abajo, 1 a media altura, 2 arriba
let elevAlto = ALTOS[0];
let tiempoLab = 0;             // s de laboratorio (el de la simulación × 10)
let pantalla = 0;              // lo que enseña el manómetro
let tPantalla = 0;
let avisoHielo = false;
let tHielo = 0;

let lupaPos = { x: 0, y: 0 };
let arrastre = null;           // { que: 'lupa', dx, dy }
let errorPendiente = null;     // { tipo, t }
let bloqueado = false;

let datos = {};                // valores del cuaderno: t1, p1, k1, r1…, pc1, pc2, cero
let correctos = {};
let saltadas = {};             // filas que el agua ha pasado sin apuntarlas
let regla = { a: { t: -120, p: 30 }, b: { t: 90, p: 85 } };
let ceroOk = false;
let vistoKelvin = false;
let respuesta = null;
let terminado = false;
let pestanaKelvin = false;

let mensaje = '';
let mensajeT = -1e9;
let mensajeTipo = '';
let ultimoPaso = 0;
const DURACION_AVISO = 6000;
let TH = {};
let encima = null;
let punteroTipo = 'mouse';
let pulso = null;
let escala = 1;
let tAnterior = 0;

// ============================================================
//  p5
// ============================================================
function setup() {
    const canvas = createCanvas(CV_W, CV_H);
    canvas.parent('canvas-container');
    canvas.elt.setAttribute('role', 'application');
    canvas.elt.setAttribute('tabindex', '0');
    canvas.elt.setAttribute('aria-label', i18n.t('Mesa de laboratorio con un manómetro digital, una llave de tres vías y un matraz cerrado dentro de un vaso de agua con hielo, sobre una placa calefactora con agitador y un elevador. Hay un termómetro en el agua, un reloj y una lupa. Con el ratón o el dedo se arrastra la lupa y se pulsan la palanca de la llave, las flechas del elevador y los botones de la placa. Con el teclado, las flechas mueven la lupa. Los mensajes de la simulación se leen en voz alta.'));
    setupPuntero(canvas.elt);
    fitCanvas();
    frameRate(60);
    textFont('monospace');

    leerParametros();
    rellenarMontajes();
    construirCuaderno();
    construirPregunta();
    setupControles();
    setupRegla();
    setupThemeSelector();
    setNivel(nivel);
    tAnterior = millis();
}

function draw() {
    updateTheme();
    const ahora = millis();
    const dt = Math.min(0.05, (ahora - tAnterior) / 1000);
    tAnterior = ahora;
    if (!bloqueado) {
        avanzarElevador(dt);
        avanzarBano(dt);
        avanzarAire(dt);
        vigilarFilas();
        tiempoLab += dt * 10;
    }
    if (errorPendiente && millis() > errorPendiente.t) {
        const tipo = errorPendiente.tipo;
        errorPendiente = null;
        mostrarError(tipo);
    }

    encima = objetoBajoPuntero();
    background(TH.fondo);
    dibujarEscena();
    dibujarResaltes();
    dibujarRotulos();
    dibujarLupa();
    actualizarCursor();
}

function dibujarEscena() {
    dibujarPared();
    dibujarMesa();
    dibujarSoporte();
    dibujarElevador();
    dibujarBano();
    dibujarManometro();
    dibujarTubo();
    dibujarLlave();
    dibujarReloj();
}

// ============================================================
//  Parámetros y montaje
// ============================================================
function leerParametros() {
    const q = new URLSearchParams(location.search);
    if (q.get('nivel') === 'libre') nivel = 'libre';
    const n = parseInt(q.get('montaje'), 10);
    const m = MONTAJES.find(x => x.n === n);
    if (m) montaje = m;
}

function elegirMontaje(n) {
    montaje = MONTAJES.find(m => m.n === n) || MONTAJES[0];
    document.getElementById('select-montaje').value = String(montaje.n);
    reiniciar();
}

function reiniciar() {
    ocultarError();
    tAgua = 0;
    hielo = montaje.hielo;
    calorPlaca = 0;
    placaOn = false;
    potencia = 'medio';
    agitadorOn = false;
    estratificacion = 0;
    tTermo = montaje.tSala;
    tAire = montaje.tSala;
    pRef = montaje.patm;
    tRefK = montaje.tSala + T0K;
    llaveAbierta = true;
    elevIdx = 0;
    elevAlto = ALTOS[0];
    tiempoLab = 0;
    pantalla = presion();
    tPantalla = 0;
    avisoHielo = false;
    tHielo = 0;
    arrastre = null;
    errorPendiente = null;
    datos = {};
    correctos = {};
    saltadas = {};
    regla = { a: { t: -120, p: 30 }, b: { t: 90, p: 85 } };
    ceroOk = false;
    vistoKelvin = false;
    respuesta = null;
    terminado = false;
    pestanaKelvin = false;
    mensaje = '';
    mensajeT = -1e9;
    ultimoPaso = 0;
    lupaPos = lupaReposo();
    limpiarCuaderno();
    cambiarPestana(false);
    actualizarInterfaz();
}

// ============================================================
//  Física del baño y del aire encerrado
// ============================================================
function guiada() { return nivel === 'guiada'; }
function agitando() { return guiada() ? placaOn || calorPorSegundo() > 0.04 : agitadorOn; }
function calorPorSegundo() { return calorPlaca / TAU_PLACA; }

function avanzarElevador(dt) {
    const obj = ALTOS[elevIdx];
    if (elevAlto !== obj) {
        const d = ELEV_V * dt;
        elevAlto = Math.abs(obj - elevAlto) <= d ? obj : elevAlto + Math.sign(obj - elevAlto) * d;
        if (elevAlto === obj) actualizarInterfaz();
    }
}
function elevadorQuieto() { return elevAlto === ALTOS[elevIdx]; }

function avanzarBano(dt) {
    // La placa guarda calor: al encenderla tarda en calentar y al apagarla sigue dando
    if (placaOn) calorPlaca += POTENCIAS[potencia].calor * dt;
    const entra = calorPorSegundo() * dt;
    calorPlaca -= entra;
    const sale = (tAgua - montaje.tSala) / TAU_PERDIDA * dt;
    const neto = entra - sale;
    if (hielo > 0) {
        // Mientras queda hielo, el calor lo funde y el agua sigue a 0 °C
        hielo -= neto;
        tAgua = 0;
        if (hielo < 0) { tAgua = -hielo; hielo = 0; }
        if (placaOn) tHielo += dt; else tHielo = 0;
        if (placaOn && tHielo > 4 && !avisoHielo) {
            avisoHielo = true;
            decir(i18n.t('El agua no se calienta todavía: el calor de la placa se está gastando en fundir el hielo. Cuando se funda, la temperatura empezará a subir.'));
        }
    } else {
        tAgua += neto;
    }
    if (placaOn && tAgua >= T_APAGADO) {
        placaOn = false;
        decir(i18n.t('La placa se ha apagado sola a {t} °C, para que el agua no llegue a hervir.', { t: T_APAGADO }), 'aviso');
        actualizarInterfaz();
    }
    // Sin remover, el agua de abajo se calienta antes que la de arriba
    const flujo = calorPorSegundo();
    if (agitando()) estratificacion *= Math.exp(-dt / 0.8);
    else if (flujo > 0.05 && hielo <= 0) estratificacion += (flujo * 5 - estratificacion) * Math.min(1, dt / 4);
    else estratificacion *= Math.exp(-dt / 40);
    // El termómetro, en el agua de arriba, o en el aire si el elevador está abajo
    const local = bulboEnAgua() ? tAgua - 0.5 * estratificacion : montaje.tSala;
    tTermo += (local - tTermo) * Math.min(1, dt / TAU_TERMO);
}

// Altura del agua y de la placa según el elevador
function yElevador() { return MESA_Y - elevAlto; }
function baseAgua() { return yElevador() - PLACA_H - 6; }
function nivelAgua() { return baseAgua() - VASO.agua; }
function bulboEnAgua() { return nivelAgua() < TERMO.bulbo - 4; }

// Parte del matraz que cubre el agua (en volumen: la parte ancha está abajo)
function cubierto() {
    const h = constrain((MATRAZ.base - nivelAgua()) / (MATRAZ.base - MATRAZ.hombro), 0, 1);
    return 1 - (1 - h) * (1 - h);
}

function tAireObjetivo() {
    return montaje.tSala + cubierto() * (tAgua - montaje.tSala);
}

function avanzarAire(dt) {
    tAire += (tAireObjetivo() - tAire) * Math.min(1, dt / TAU_AIRE);
    if (llaveAbierta) {
        // Con la llave abierta el aire entra y sale: la presión es la de la sala
        pRef = montaje.patm;
        tRefK = tAire + T0K;
    }
    tPantalla += dt;
    if (tPantalla >= CADA_PANTALLA) {
        tPantalla = 0;
        pantalla = Math.round(presion() * 10) / 10;
    }
}

function presion() {
    return pRef * (tAire + T0K) / tRefK;
}

// El termómetro y el manómetro están parados: ya se puede leer
function todoQuieto() {
    return !placaOn && calorPorSegundo() < 0.04 && Math.abs(tAire - tAireObjetivo()) < 0.25
        && Math.abs(tTermo - (bulboEnAgua() ? tAgua - 0.5 * estratificacion : montaje.tSala)) < 0.15
        && elevadorQuieto();
}

// ============================================================
//  Llave, elevador y placa
// ============================================================
function pulsarLlave() {
    if (bloqueado) return;
    if (guiada()) {
        const paso = pasoActual();
        if (llaveAbierta && paso < 2) {
            decir(i18n.t('Todavía no cierres la llave: primero apunta la temperatura y la presión de la sala.'));
            return;
        }
        if (!llaveAbierta) {
            const hayMedidas = MEDIDAS.some((_, i) => i > 0 && filaHecha(i + 1));
            if (hayMedidas || Math.abs(presion() - montaje.patm) > 0.5) {
                errorPendiente = { tipo: presion() > montaje.patm ? 'sale' : 'entra', t: millis() + 400 };
                llaveAbierta = true;
                actualizarInterfaz();
                return;
            }
        }
    }
    llaveAbierta = !llaveAbierta;
    decir(llaveAbierta
        ? i18n.t('Llave abierta: el matraz y el manómetro comunican con el aire de la sala. Si el aire de dentro está más caliente o más frío que al cerrar, sale o entra aire.')
        : i18n.t('Llave cerrada: el aire del matraz queda encerrado. Ahora siempre es el mismo aire, en el mismo volumen.'));
    actualizarInterfaz();
}

function moverElevador(sentido) {
    if (bloqueado) return;
    const nuevo = constrain(elevIdx + sentido, 0, ALTOS.length - 1);
    if (nuevo === elevIdx) {
        decir(sentido > 0 ? i18n.t('El elevador ya está arriba del todo.') : i18n.t('El elevador ya está abajo del todo.'));
        return;
    }
    if (guiada() && sentido > 0 && llaveAbierta) {
        decir(i18n.t('Antes de meter el matraz en el agua, cierra la llave para encerrar el aire.'));
        return;
    }
    elevIdx = nuevo;
    decir([
        i18n.t('Elevador abajo: el agua ya no toca el matraz.'),
        i18n.t('Elevador a media altura: el agua solo cubre el fondo del matraz.'),
        i18n.t('Elevador arriba: el agua cubre el matraz entero.'),
    ][elevIdx]);
    actualizarInterfaz();
}

function pulsarPlaca() {
    if (bloqueado) return;
    if (guiada() && !placaOn && !filaHecha(2)) {
        decir(i18n.t('Todavía no enciendas la placa: primero sube el agua con hielo y apunta la fila «Hielo».'));
        return;
    }
    if (!placaOn && tAgua >= T_APAGADO - 1) {
        decir(i18n.t('El agua ya está a más de {t} °C: la placa no se enciende para que no llegue a hervir.', { t: T_APAGADO - 1 }));
        return;
    }
    placaOn = !placaOn;
    if (placaOn) {
        decir(guiada()
            ? i18n.t('Placa encendida a potencia media, con el agitador. Apágala unos grados antes de la temperatura que buscas: sigue caliente y el agua aún sube un poco.')
            : i18n.t('Placa encendida a potencia {p}.', { p: i18n.t(POTENCIAS[potencia].nombre) }));
    } else {
        decir(i18n.t('Placa apagada. Todavía está caliente: el agua subirá un poco más antes de pararse.'));
    }
    actualizarInterfaz();
}

function cambiarPotencia() {
    if (bloqueado || guiada()) return;
    const orden = ['bajo', 'medio', 'alto'];
    potencia = orden[(orden.indexOf(potencia) + 1) % orden.length];
    decir(i18n.t('Potencia {p}.', { p: i18n.t(POTENCIAS[potencia].nombre) }));
    actualizarInterfaz();
}

function pulsarAgitador() {
    if (bloqueado || guiada()) return;
    agitadorOn = !agitadorOn;
    decir(agitadorOn
        ? i18n.t('Agitador encendido: el imán del fondo remueve el agua y la temperatura se iguala.')
        : i18n.t('Agitador apagado. Sin remover, el agua de abajo se calienta antes que la de arriba.'));
    actualizarInterfaz();
}

const ERRORES = {
    sale: {
        titulo: 'Se ha escapado aire del matraz',
        texto: 'Has abierto la llave con el aire del matraz más caliente que cuando la cerraste. Parte del aire se ha salido por la llave, así que ya no tienes la misma cantidad de gas y las medidas anteriores no se pueden comparar con las nuevas. Vuelve a empezar y deja la llave cerrada durante todas las medidas.',
    },
    entra: {
        titulo: 'Ha entrado aire en el matraz',
        texto: 'Has abierto la llave con el aire del matraz más frío que cuando la cerraste. Ha entrado aire de la sala, así que ya no tienes la misma cantidad de gas y las medidas anteriores no se pueden comparar con las nuevas. Vuelve a empezar y deja la llave cerrada durante todas las medidas.',
    },
};

function vineta(sale) {
    const flechas = sale
        ? '<path class="v-aire" d="M97 34l-6 10M103 34v13M109 34l6 10"/>'
        : '<path class="v-aire" d="M91 46l6-10M103 49V36M115 46l-6-10"/>';
    return '<svg viewBox="0 0 300 120" width="300" height="120"><line class="v-mesa" x1="10" y1="112" x2="290" y2="112"/>'
        + '<rect class="v-agua" x="152" y="62" width="88" height="50"/><path class="v-tubo" d="M150 112V54M242 112V54"/>'
        + '<path class="v-matraz" d="M186 24V40L168 82a3 3 0 0 0 3 4H215a3 3 0 0 0 3-4L200 40V24Z"/>'
        + '<path class="v-tubo" d="M193 22V10H103V20"/><rect class="v-llave" x="88" y="2" width="30" height="16" rx="3"/>'
        + '<rect class="v-llave" x="99" y="18" width="8" height="10"/><path class="v-cian" d="M103 10V-6"/>' + flechas + '</svg>';
}

function mostrarError(tipo) {
    const e = ERRORES[tipo];
    document.getElementById('error-vineta').innerHTML = vineta(tipo === 'sale');
    document.getElementById('error-titulo').textContent = i18n.t(e.titulo);
    document.getElementById('error-texto').textContent = i18n.t(e.texto);
    document.getElementById('error-lab').hidden = false;
    bloqueado = true;
    arrastre = null;
    document.querySelectorAll('.control-panel, .barra-lab, .botones-tactiles, #canvas-container').forEach(el => { el.inert = true; });
    document.getElementById('error-reiniciar').focus();
}

function ocultarError() {
    const caja = document.getElementById('error-lab');
    if (!caja || caja.hidden) return;
    caja.hidden = true;
    bloqueado = false;
    document.querySelectorAll('.control-panel, .barra-lab, .botones-tactiles, #canvas-container').forEach(el => { el.inert = false; });
}

// ============================================================
//  Lo que diría quien mira los instrumentos
// ============================================================
function describirInstrumentos() {
    const t = tTermo;
    const abajo = Math.floor(t + 1e-6);
    const resto = t - abajo;
    let txt;
    if (resto < 0.15) txt = i18n.t('El líquido del termómetro está justo en la raya de {a} °C.', { a: abajo });
    else if (resto > 0.85) txt = i18n.t('El líquido del termómetro está justo en la raya de {a} °C.', { a: abajo + 1 });
    else txt = i18n.t('El líquido del termómetro está entre las rayas de {a} y {b} °C.', { a: abajo, b: abajo + 1 });
    txt += ' ' + i18n.t('El manómetro marca {p} kPa.', { p: i18n.num(pantalla, 1) });
    if (!todoQuieto()) txt += ' ' + i18n.t('Todavía cambian.');
    txt += ' ' + (placaOn
        ? i18n.t('La placa está encendida, a potencia {p}.', { p: i18n.t(POTENCIAS[potencia].nombre) })
        : i18n.t('La placa está apagada.'));
    if (!guiada()) txt += ' ' + (agitadorOn ? i18n.t('El agitador está encendido.') : i18n.t('El agitador está apagado.'));
    txt += ' ' + [
        i18n.t('El elevador está abajo: el agua no toca el matraz.'),
        i18n.t('El elevador está a media altura: el agua cubre el fondo del matraz.'),
        i18n.t('El elevador está arriba: el agua cubre el matraz entero.'),
    ][elevIdx];
    if (hielo > 0) txt += ' ' + i18n.t('Todavía quedan cubitos de hielo.');
    decir(txt);
}

// ============================================================
//  Nivel guiado: pasos y cuaderno
// ============================================================
const N_FILAS = MEDIDAS.length;
function filaHecha(i) { return correctos['t' + i] && correctos['p' + i]; }
function filaCerrada(i) { return filaHecha(i) || saltadas[i]; }
function filasConDatos() { return MEDIDAS.map((_, k) => k + 1).filter(filaHecha); }

function filaActual() {
    for (let i = 1; i <= N_FILAS; i++) if (!filaCerrada(i)) return i;
    return 0;
}

// Medidas con las que se prueba P/t en °C: las de 40 y 80 °C, o las dos más calientes que haya
function filasPrueba() {
    const calientes = [3, 4, 5, 6].filter(filaHecha);
    const preferidas = [4, 6].filter(filaHecha);
    if (preferidas.length === 2) return preferidas;
    return calientes.slice(-2);
}

function kelvinHechos() {
    return filasConDatos().every(i => correctos['k' + i] && correctos['r' + i]);
}

function pasoActual() {
    if (!filaHecha(1)) return 1;
    if (llaveAbierta) return 2;
    if (!filaHecha(2)) return 3;
    if (![3, 4, 5, 6].every(filaCerrada)) return 4;
    if (!(correctos.pc1 && correctos.pc2)) return 5;
    if (!kelvinHechos()) return 6;
    if (!ceroOk) return 7;
    if (!vistoKelvin) return 8;
    if (!terminado) return 9;
    return 10;
}

function indicacionPaso(paso) {
    const fila = filaActual();
    const m = fila ? MEDIDAS[fila - 1] : null;
    const prueba = filasPrueba();
    return i18n.t(INDICACIONES[paso - 1], {
        o: m && m.objetivo ? m.objetivo : 80,
        a: prueba[0] ? i18n.num(datos['t' + prueba[0]]) : 40,
        b: prueba[1] ? i18n.num(datos['t' + prueba[1]]) : 80,
    });
}

// Si el agua pasa de una temperatura sin que se apunte, esa fila se salta
function vigilarFilas() {
    if (!guiada() || pasoActual() !== 4) return;
    const fila = filaActual();
    const m = MEDIDAS[fila - 1];
    if (fila >= 3 && tTermo > m.max + 0.5) {
        saltadas[fila] = true;
        const sig = filaActual();
        if (filasConDatos().filter(i => i >= 3).length + (N_FILAS - (sig || N_FILAS + 1) + 1) < 2) {
            decir(i18n.t('Te has pasado de {max} °C sin apuntar la medida. Ya no quedan bastantes medidas calientes: empieza de nuevo y apaga la placa unos grados antes.', { max: m.max }), 'aviso');
        } else {
            decir(i18n.t('Te has pasado de {max} °C sin apuntar la medida «{r}». No pasa nada: esa fila queda sin hacer y sigues con la siguiente. Apaga la placa unos grados antes.', { max: m.max, r: i18n.t(m.rotulo) }), 'aviso');
        }
        actualizarInterfaz();
    }
}

function leerNumero(txt) {
    const s = String(txt).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
    if (s === '' || !/^-?\d*\.?\d+$/.test(s)) return null;
    return parseFloat(s);
}

function comprobarDato(id) {
    const inp = document.getElementById('dato-' + id);
    const x = leerNumero(inp.value);
    if (x === null) {
        if (inp.value.trim() !== '') avisoCuaderno(i18n.t('Escribe solo el número, sin la unidad.'), 'mal');
        return;
    }
    datos[id] = x;
    const tipo = id.replace(/\d+$/, '');
    const i = parseInt(id.replace(/^\D+/, ''), 10);
    let ok = false, pista = '';

    // Cada medida se toma en orden y en las condiciones de su fila
    if ((tipo === 't' || tipo === 'p') && !filaHecha(i)) {
        const aviso = condicionesFila(i);
        if (aviso) {
            correctos[id] = false;
            marcar(id, false);
            avisoCuaderno(aviso, 'mal');
            actualizarInterfaz();
            return;
        }
    }

    if (tipo === 't') {
        const real = tTermo;
        const m = MEDIDAS[i - 1];
        ok = Math.abs(x - real) <= 0.52 && x >= m.min && x <= m.max;
        if (Math.abs(x - real) <= 0.52 && !ok) {
            pista = i18n.t('Esta medida se toma hacia {o} °C, entre {a} y {b} °C.', { o: m.objetivo, a: m.min, b: m.max });
        } else if (Math.abs(x - real) <= 2.6) {
            pista = i18n.t('Casi. Pon la lupa de forma que la línea amarilla de los ojos pase por el final de la columna roja: si miras desde arriba o desde abajo, lees un grado de más o de menos.');
        } else {
            pista = i18n.t('Revisa la lectura. Lleva la lupa al final de la columna roja del termómetro y cuenta las rayas desde el número más cercano: cada raya vale 1 °C.');
        }
    } else if (tipo === 'p') {
        ok = Math.abs(x - pantalla) <= 0.15;
        pista = i18n.t('Apunta la cifra del manómetro tal como sale, con su decimal.');
    } else if (tipo === 'pc') {
        const f = filasPrueba()[i - 1];
        const esperado = datos['p' + f] / datos['t' + f];
        ok = Math.abs(x - esperado) <= Math.max(0.01, esperado * 0.01);
        pista = i18n.t('Divide tu presión entre tu temperatura en °C de esa medida.');
    } else if (tipo === 'k') {
        const t = datos['t' + i];
        ok = Math.abs(x - (t + 273)) <= 0.01 || Math.abs(x - (t + T0K)) <= 0.051;
        pista = Math.abs(x - (t - 273)) < 0.2
            ? i18n.t('Hay que sumar 273, no restar: en kelvin todas las temperaturas son positivas.')
            : i18n.t('Suma 273 a tu temperatura en °C: T = t + 273.');
    } else if (tipo === 'r') {
        const esperado = datos['p' + i] / datos['k' + i];
        ok = Math.abs(x - esperado) <= Math.max(0.0015, esperado * 0.005);
        pista = datos['t' + i] && Math.abs(x - datos['p' + i] / datos['t' + i]) < 0.01
            ? i18n.t('Has dividido entre la temperatura en °C. Usa T en kelvin.')
            : i18n.t('Divide tu presión entre T en kelvin y redondea a tres decimales.');
        if (!correctos['k' + i]) {
            ok = false;
            pista = i18n.t('Antes pasa esa temperatura a kelvin.');
        }
    } else if (id === 'cero') {
        comprobarCero(x);
        return;
    }

    correctos[id] = ok;
    marcar(id, ok);
    if (ok) {
        let txt = i18n.t('Bien apuntado.');
        if (tipo === 't' || tipo === 'p') {
            if (filaHecha(i) && i === 2) txt = i18n.t('Bien apuntado. La presión ha bajado de la de la sala porque el aire se ha enfriado, no porque falte aire: el matraz está cerrado y sigue teniendo el mismo aire.');
            if (filaHecha(i) && i >= 3) {
                const m = MEDIDAS[i - 1];
                if (datos['t' + i] > m.objetivo + 2) txt = i18n.t('Bien apuntado. Te has pasado un poco de {o} °C porque la placa sigue calentando después de apagarla: no pasa nada, la medida vale. La próxima vez apágala unos grados antes.', { o: m.objetivo });
            }
        }
        const siguiente = pasoActual();
        if (filaHecha(i) && (tipo === 't' || tipo === 'p') && siguiente <= N_PASOS) txt += ' ' + indicacionPaso(siguiente);
        if (tipo === 'pc' && correctos.pc1 && correctos.pc2) {
            const [f1, f2] = filasPrueba();
            txt = i18n.t('Con °C sale {a} y {b} kPa/°C: no se repite. Al doblar la temperatura en °C la presión no se dobla, porque 0 °C no es la temperatura a la que el aire dejaría de empujar. Ahora pasa a kelvin.', {
                a: i18n.num(datos.pc1, 2), b: i18n.num(datos.pc2, 2),
            });
            void f1; void f2;
        }
        avisoCuaderno(txt, 'bien');
        if ((tipo === 'k' || tipo === 'r') && kelvinHechos()) resultadoLey();
    } else {
        avisoCuaderno(pista, 'mal');
    }
    actualizarInterfaz();
    dibujarGrafica();
}

function condicionesFila(i) {
    const fila = filaActual();
    if (i !== fila) return i18n.t('Ve en orden: ahora toca la fila «{r}».', { r: i18n.t(MEDIDAS[fila - 1].rotulo) });
    if (i === 1) {
        if (elevIdx !== 0) return i18n.t('Para leer la sala, baja el elevador: el termómetro tiene que estar fuera del agua.');
        if (!todoQuieto()) return i18n.t('Espera a que el termómetro se pare.');
        return '';
    }
    if (llaveAbierta) return i18n.t('Antes de medir, cierra la llave para encerrar el aire.');
    if (elevIdx !== 2 || !elevadorQuieto()) return i18n.t('El agua no cubre el matraz entero: sube el elevador hasta arriba. Si solo cubre el fondo, el aire de arriba no se calienta igual.');
    if (placaOn) return i18n.t('La placa está encendida y el agua sigue subiendo: apágala y espera a que el termómetro y el manómetro se paren.');
    if (!todoQuieto()) return i18n.t('La presión aún cambia: el aire del matraz todavía no está a la temperatura del agua. Espera a que el termómetro y el manómetro se paren.');
    if (i === 2 && hielo <= 0) return i18n.t('Ya no queda hielo: empieza de nuevo para medir a 0 °C.');
    return '';
}

function marcar(id, ok) {
    const marca = document.getElementById('marca-' + id);
    if (marca) {
        marca.textContent = ok ? '✓' : '✗';
        marca.className = 'marca ' + (ok ? 'bien' : 'mal');
    }
    const inp = document.getElementById('dato-' + id);
    inp.classList.toggle('bien', ok);
    inp.classList.toggle('mal', !ok);
}

function kAlumno() {
    const rs = filasConDatos().map(i => datos['r' + i]).filter(x => x > 0);
    return rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
}

function resultadoLey() {
    const rs = filasConDatos().map(i => datos['r' + i]);
    const k = kAlumno();
    const cambio = (Math.max(...rs) - Math.min(...rs)) / k * 100;
    const res = document.getElementById('resultado-ley');
    res.hidden = false;
    if (cambio < 2) {
        res.className = 'resultado bien';
        res.textContent = i18n.t('✓ P / T vale unos {k} kPa/K en todas las medidas: entre la mayor y la menor cambia solo un {c} %. A volumen constante, P / T = constante si la temperatura está en kelvin: es la ley de Gay-Lussac.', {
            k: i18n.num(k, 3), c: i18n.num(cambio, 1),
        });
    } else {
        res.className = 'resultado mal';
        res.textContent = i18n.t('P / T cambia un {c} % entre la medida mayor y la menor. Busca la medida que más se aleja y repasa su lectura y sus cuentas.', { c: i18n.num(cambio, 1) });
    }
}

// Recta de los datos del alumno, por mínimos cuadrados
function ajuste() {
    const pts = filasConDatos().map(i => [datos['t' + i], datos['p' + i]]);
    const n = pts.length;
    const mx = pts.reduce((a, q) => a + q[0], 0) / n, my = pts.reduce((a, q) => a + q[1], 0) / n;
    let sxy = 0, sxx = 0;
    pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); });
    const m = sxy / sxx;
    return { m, b: my - m * mx, pts };
}

function pReglaEn(t) {
    const { a, b } = regla;
    return a.p + (b.p - a.p) * (t - a.t) / (b.t - a.t);
}

function comprobarCero(x) {
    const { m, b, pts } = ajuste();
    const corte = -b / m;
    const lejos = pts.reduce((s, [t, p]) => s + Math.abs(p - pReglaEn(t)), 0) / pts.length;
    let ok = false, pista;
    if (lejos > 2.5) pista = i18n.t('Primero coloca la regla sobre tus puntos: arrastra sus dos extremos naranjas hasta que la recta pase por todos.');
    else if (x > 0) pista = i18n.t('La regla corta el eje a la izquierda del 0: es una temperatura negativa.');
    else {
        ok = Math.abs(x - corte) <= 15;
        pista = i18n.t('Mira dónde corta la regla el eje horizontal, donde P = 0. Las rayas pequeñas van de 25 en 25 °C.');
    }
    correctos.cero = ok;
    marcar('cero', ok);
    const res = document.getElementById('resultado-cero');
    if (ok) {
        ceroOk = true;
        res.hidden = false;
        res.className = 'resultado bien';
        res.textContent = i18n.t('✓ Tu recta llega a P = 0 hacia {t} °C. El valor exacto es −273,15 °C. Por debajo, la presión tendría que ser negativa, y eso no puede ser: es la temperatura más baja posible, el cero absoluto. La escala Kelvin empieza ahí: 0 K = −273,15 °C.', {
            t: i18n.num(x, 0).replace('-', '−'),
        });
        avisoCuaderno(indicacionPaso(8), 'bien');
    } else {
        avisoCuaderno(pista, 'mal');
    }
    actualizarInterfaz();
    dibujarGrafica();
}

function elegirRespuesta(k) {
    if (!guiada() || pasoActual() !== 9) return;
    respuesta = k;
    const op = PREGUNTA[k];
    const res = document.getElementById('resultado-pregunta');
    res.hidden = false;
    res.className = 'resultado ' + (op.ok ? 'bien' : 'mal');
    res.textContent = i18n.t(op.exp);
    if (op.ok) {
        terminado = true;
        decir(i18n.t('Práctica terminada. Puedes repetirla con otro montaje: tendrá otra presión y otra temperatura de la sala, pero P / T también será constante.'));
    }
    actualizarInterfaz();
}

function avisoCuaderno(txt, tipo) {
    const el = document.getElementById('aviso-cuaderno');
    el.textContent = txt;
    el.className = 'aviso-cuaderno' + (tipo ? ' ' + tipo : '');
}

// ── Cuaderno: seis medidas con t, P, T y P/T ──
function construirCuaderno() {
    const t = document.getElementById('tabla-medidas');
    const cab = [
        ['Medida', ''],
        ['<i>t</i> (°C)', ''],
        ['<i>P</i> (kPa)', ''],
        ['<i>T</i> (K)', ''],
        ['<i>P</i> / <i>T</i>', '(kPa/K)'],
    ];
    cab.forEach(([a, b]) => {
        const s = document.createElement('span');
        s.className = 'th';
        s.setAttribute('role', 'columnheader');
        s.innerHTML = a + (b ? `<span class="opcional">${i18n.t(b)}</span>` : '');
        t.appendChild(s);
    });
    MEDIDAS.forEach((m, k) => {
        const i = k + 1;
        const n = document.createElement('span');
        n.className = 'n';
        n.id = 'fila-' + i;
        n.textContent = i18n.t(m.rotulo);
        t.appendChild(n);
        ['t', 'p', 'k', 'r'].forEach(tipo => {
            const inp = document.createElement('input');
            inp.className = 'dato';
            inp.id = 'dato-' + tipo + i;
            inp.type = 'text';
            inp.inputMode = 'decimal';
            inp.autocomplete = 'off';
            const nombre = { t: 'Temperatura en grados Celsius', p: 'Presión', k: 'Temperatura en kelvin', r: 'P entre T' }[tipo];
            inp.setAttribute('aria-label', i18n.t('{q}, medida «{r}»', { q: i18n.t(nombre), r: i18n.t(m.rotulo) }));
            t.appendChild(inp);
        });
        const obj = document.createElement('span');
        obj.className = 'objetivo';
        obj.id = 'objetivo-' + i;
        obj.hidden = true;
        t.appendChild(obj);
    });
    document.querySelectorAll('.dato').forEach(inp => {
        const id = inp.id.replace('dato-', '');
        inp.addEventListener('change', () => comprobarDato(id));
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); comprobarDato(id); } });
    });
}

function limpiarCuaderno() {
    document.querySelectorAll('.dato').forEach(inp => {
        inp.value = '';
        inp.classList.remove('bien', 'mal');
    });
    document.querySelectorAll('.marca').forEach(m => { m.textContent = ''; m.className = 'marca'; });
    ['resultado-ley', 'resultado-cero', 'resultado-pregunta'].forEach(id => { document.getElementById(id).hidden = true; });
    document.getElementById('enlace-boyle').hidden = true;
    avisoCuaderno(i18n.t('Escribe lo que leas en los instrumentos y pulsa Intro.'));
    document.querySelectorAll('.opcion').forEach(b => b.classList.remove('elegida', 'acierto'));
}

function construirPregunta() {
    const c = document.getElementById('pregunta');
    PREGUNTA.forEach((op, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opcion';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.textContent = i18n.t(op.txt);
        b.addEventListener('click', () => elegirRespuesta(k));
        c.appendChild(b);
    });
}

// ── Gráfica del panel, con la regla del paso 7 ──
const GRAF = { x0: 40, y0: 176, w: 266, h: 160, pmax: 125 };

function rangoT() {
    if (pestanaKelvin) return [0, 400];
    return guiada() && pasoActual() >= 7 ? [-300, 100] : [-10, 100];
}
function gx(t) { const [a, b] = rangoT(); return GRAF.x0 + (t - a) / (b - a) * GRAF.w; }
function gy(p) { return GRAF.y0 - p / GRAF.pmax * GRAF.h; }
function conRegla() { return guiada() && !pestanaKelvin && pasoActual() === 7; }

function dibujarGrafica() {
    const svg = document.getElementById('grafica');
    if (!svg) return;
    const kel = pestanaKelvin;
    const [ta, tb] = rangoT();
    const { x0, y0, w, h } = GRAF;
    let s = '';
    for (let p = 0; p <= 120; p += 40) {
        s += `<line class="g-rejilla" x1="${x0}" x2="${x0 + w}" y1="${gy(p)}" y2="${gy(p)}"/>`;
        s += `<text class="g-texto" x="${x0 - 6}" y="${gy(p) + 3}" text-anchor="end">${p}</text>`;
    }
    const paso = tb - ta > 200 ? 100 : 20;
    const menor = tb - ta > 200 ? 25 : 10;
    for (let t = Math.ceil(ta / menor) * menor; t <= tb; t += menor) {
        const grande = Math.abs(t / paso - Math.round(t / paso)) < 1e-9;
        s += `<line class="g-eje" x1="${gx(t)}" x2="${gx(t)}" y1="${y0}" y2="${y0 + (grande ? 5 : 3)}"/>`;
        if (grande) s += `<text class="g-texto" x="${gx(t)}" y="${y0 + 14}" text-anchor="middle">${String(t).replace('-', '−')}</text>`;
    }
    const xCero = kel ? x0 : gx(0);
    s += `<line class="g-eje" x1="${x0}" y1="${y0}" x2="${x0 + w}" y2="${y0}"/><line class="g-eje" x1="${xCero}" y1="${y0}" x2="${xCero}" y2="${y0 - h}"/>`;
    s += `<text class="g-titulo" x="${x0 + w}" y="${y0 + 28}" text-anchor="end">${kel ? i18n.t('T (K)') : i18n.t('t (°C)')}</text>`;
    s += `<text class="g-titulo" x="${x0 - 32}" y="${y0 - h - 8}">${i18n.t('P (kPa)')}</text>`;

    const pts = filasConDatos().map(i => [datos['t' + i], datos['p' + i]]);
    if (kel && ceroOk) {
        const k = kAlumno();
        s += `<path class="g-ley" d="M${gx(0)},${gy(0)} L${gx(400)},${gy(Math.min(GRAF.pmax * 1.1, k * 400))}"/>`;
    }
    if (!kel && ceroOk) {
        const { m, b } = ajuste();
        s += `<path class="g-ley" d="M${gx(-b / m)},${gy(0)} L${gx(100)},${gy(m * 100 + b)}"/>`;
        s += `<circle class="g-cero" cx="${gx(-T0K)}" cy="${gy(0)}" r="4"/><text class="g-cero-texto" x="${gx(-T0K) + 7}" y="${gy(0) - 7}">−273 °C</text>`;
    }
    pts.forEach(([t, p]) => {
        s += `<circle class="g-punto" cx="${gx(kel ? t + T0K : t).toFixed(1)}" cy="${gy(p).toFixed(1)}" r="3.6"/>`;
    });
    if (conRegla()) {
        // La regla: una recta que pasa por sus dos extremos y llega de lado a lado
        const t1 = ta, t2 = tb;
        const clip = `<clipPath id="recorte"><rect x="${x0}" y="${y0 - h - 6}" width="${w}" height="${h + 12}"/></clipPath>`;
        s += `<defs>${clip}</defs><line class="g-regla" clip-path="url(#recorte)" x1="${gx(t1)}" y1="${gy(pReglaEn(t1))}" x2="${gx(t2)}" y2="${gy(pReglaEn(t2))}"/>`;
        ['a', 'b'].forEach(e => {
            const q = regla[e];
            s += `<circle class="g-zona" data-extremo="${e}" cx="${gx(q.t)}" cy="${gy(q.p)}" r="14"/>`;
            s += `<circle class="g-extremo" data-extremo="${e}" tabindex="0" role="slider" aria-label="${i18n.t(e === 'a' ? 'Extremo izquierdo de la regla' : 'Extremo derecho de la regla')}" aria-valuetext="${i18n.t('{t} °C, {p} kPa', { t: Math.round(q.t), p: Math.round(q.p) })}" cx="${gx(q.t)}" cy="${gy(q.p)}" r="6"/>`;
        });
    }
    if (!pts.length) s += `<text class="g-vacia" x="${x0 + w / 2}" y="${y0 - h / 2}" text-anchor="middle">${i18n.t('Aquí aparecerán tus medidas.')}</text>`;
    svg.innerHTML = s;
    svg.classList.toggle('con-regla', conRegla());
    svg.setAttribute('aria-label', kel
        ? i18n.t('Gráfica de la presión frente a la temperatura en kelvin con {n} puntos.', { n: pts.length })
        : i18n.t('Gráfica de la presión frente a la temperatura en grados Celsius con {n} puntos.', { n: pts.length }));
}

function setupRegla() {
    const svg = document.getElementById('grafica');
    let cogido = null;
    const aDatos = (e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const q = pt.matrixTransform(svg.getScreenCTM().inverse());
        const [ta, tb] = rangoT();
        const t = ta + (q.x - GRAF.x0) / GRAF.w * (tb - ta);
        const p = (GRAF.y0 - q.y) / GRAF.h * GRAF.pmax;
        return { t: constrain(t, ta, tb), p: constrain(p, 0, GRAF.pmax) };
    };
    const mover = (e, q) => {
        const otro = regla[e === 'a' ? 'b' : 'a'];
        if (Math.abs(q.t - otro.t) < 20) return;      // los extremos no se cruzan ni se juntan
        if ((e === 'a') !== (q.t < otro.t)) return;
        regla[e] = q;
        dibujarGrafica();
    };
    svg.addEventListener('pointerdown', e => {
        const el = e.target.closest('[data-extremo]');
        if (!el || !conRegla()) return;
        cogido = el.dataset.extremo;
        svg.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    svg.addEventListener('pointermove', e => { if (cogido) mover(cogido, aDatos(e)); });
    const soltar = () => {
        if (!cogido) return;
        const e = cogido;
        cogido = null;
        dibujarGrafica();
        const el = svg.querySelector(`.g-extremo[data-extremo="${e}"]`);
        if (el && document.activeElement === document.body) el.focus({ preventScroll: true });
    };
    svg.addEventListener('pointerup', soltar);
    svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('keydown', e => {
        const el = e.target.closest('.g-extremo');
        if (!el || !conRegla()) return;
        const d = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (!d) return;
        e.preventDefault();
        const ext = el.dataset.extremo;
        const q = regla[ext];
        const [ta, tb] = rangoT();
        const k = e.shiftKey ? 5 : 1;
        mover(ext, { t: constrain(q.t + d[0] * k, ta, tb), p: constrain(q.p + d[1] * k, 0, GRAF.pmax) });
        const nuevo = svg.querySelector(`.g-extremo[data-extremo="${ext}"]`);
        if (nuevo) nuevo.focus({ preventScroll: true });
    });
}

function cambiarPestana(kel) {
    pestanaKelvin = kel;
    document.getElementById('graf-c').classList.toggle('activa', !kel);
    document.getElementById('graf-k').classList.toggle('activa', kel);
    document.getElementById('graf-c').setAttribute('aria-selected', String(!kel));
    document.getElementById('graf-k').setAttribute('aria-selected', String(kel));
    if (kel && guiada() && pasoActual() === 8) {
        vistoKelvin = true;
        avisoCuaderno(i18n.t('En kelvin, la misma recta pasa por el origen: P es proporcional a T. Si la temperatura en kelvin se duplica, la presión se duplica.'), 'bien');
    }
    dibujarGrafica();
    actualizarInterfaz();
}

// ============================================================
//  Interfaz
// ============================================================
function setNivel(n) {
    nivel = n;
    document.body.classList.remove('nivel-guiada', 'nivel-libre');
    document.body.classList.add('nivel-' + n);
    ['guiada', 'libre'].forEach(m => {
        const b = document.getElementById('nivel-' + m);
        b.classList.toggle('active', m === n);
        b.setAttribute('aria-selected', String(m === n));
    });
    elegirMontaje(montaje.n);
    fitCanvas();
}

function actualizarInterfaz() {
    const paso = pasoActual();
    const fila = filaActual();
    const g = guiada();

    document.getElementById('btn-llave').textContent = llaveAbierta ? i18n.t('Cerrar la llave') : i18n.t('Abrir la llave');
    document.getElementById('tactil-llave').textContent = llaveAbierta ? i18n.t('Llave: cerrar') : i18n.t('Llave: abrir');
    document.getElementById('btn-placa').textContent = placaOn ? i18n.t('Apagar la placa') : i18n.t('Encender la placa');
    document.getElementById('tactil-placa').textContent = placaOn ? i18n.t('Placa: apagar') : i18n.t('Placa: encender');
    const txtPot = i18n.t('Potencia: {p}', { p: i18n.t(POTENCIAS[potencia].nombre) });
    document.getElementById('btn-potencia').textContent = txtPot;
    document.getElementById('tactil-potencia').textContent = txtPot;
    document.getElementById('btn-agitador').textContent = agitadorOn ? i18n.t('Apagar el agitador') : i18n.t('Encender el agitador');
    document.getElementById('tactil-agitador').textContent = agitadorOn ? i18n.t('Agitador: apagar') : i18n.t('Agitador: encender');
    const subir = elevIdx < ALTOS.length - 1;
    document.getElementById('tactil-elevador').textContent = subir ? i18n.t('Elevador: subir') : i18n.t('Elevador: bajar');

    // Pasos
    const lista = document.getElementById('lista-pasos');
    lista.innerHTML = '';
    PASOS.forEach((txt, i) => {
        const li = document.createElement('li');
        const n = i + 1;
        const estado = n < paso ? 'hecho' : n === paso ? 'ahora' : '';
        li.className = estado;
        if (estado === 'ahora') li.setAttribute('aria-current', 'step');
        const num = document.createElement('span');
        num.className = 'num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = estado === 'hecho' ? '✓' : String(n);
        li.appendChild(num);
        li.appendChild(document.createTextNode(i18n.t(txt) + (estado === 'hecho' ? ' ' : '')));
        if (estado === 'hecho') {
            const sr = document.createElement('span');
            sr.className = 'sr-only';
            sr.textContent = i18n.t('(hecho)');
            li.appendChild(sr);
        }
        lista.appendChild(li);
    });

    // Cuaderno
    MEDIDAS.forEach((m, k) => {
        const i = k + 1;
        const actual = i === fila && (i === 1 ? paso === 1 : i === 2 ? paso === 3 : paso === 4);
        ['t', 'p'].forEach(t => {
            const inp = document.getElementById('dato-' + t + i);
            inp.disabled = !(actual && !correctos[t + i]);
            if (saltadas[i] && !filaHecha(i)) inp.placeholder = '—';
            else inp.placeholder = '';
        });
        ['k', 'r'].forEach(t => {
            document.getElementById('dato-' + t + i).disabled = !(filaHecha(i) && paso >= 6 && !correctos[t + i]);
        });
        document.getElementById('fila-' + i).classList.toggle('ahora', actual);
        const obj = document.getElementById('objetivo-' + i);
        obj.hidden = !(actual && i >= 3);
        if (i >= 3) obj.textContent = i18n.t('Apunta esta fila entre {a} y {b} °C, con la placa apagada.', { a: m.min, b: m.max });
    });
    const prueba = filasPrueba();
    ['pc1', 'pc2'].forEach((id, k) => {
        const f = prueba[k];
        document.getElementById('dato-' + id).disabled = !(paso === 5 && f && !correctos[id]);
        document.getElementById('etiqueta-' + id).textContent = f
            ? i18n.t('Medida de {t} °C', { t: i18n.num(datos['t' + f]) })
            : i18n.t(k === 0 ? 'Medida de 40 °C' : 'Medida de 80 °C');
    });
    document.getElementById('prueba-celsius').hidden = paso < 5;
    document.getElementById('fila-cero').hidden = paso < 7;
    document.getElementById('dato-cero').disabled = paso !== 7;

    document.querySelectorAll('.opcion').forEach((b, k) => {
        b.disabled = !(g && paso === 9);
        const sel = k === respuesta;
        b.setAttribute('aria-checked', String(sel));
        b.classList.toggle('elegida', sel);
        b.classList.toggle('acierto', sel && PREGUNTA[k].ok);
    });
    document.getElementById('enlace-boyle').hidden = !terminado;

    if (g && paso !== ultimoPaso) {
        const antes = ultimoPaso;
        ultimoPaso = paso;
        pulso = OBJETO_PASO[paso] ? { obj: OBJETO_PASO[paso], t: millis() } : null;
        if (paso <= N_PASOS) anunciar(indicacionPaso(paso));
        // Al llegar al paso 7 la gráfica se aleja hasta −300 °C
        if (paso === 7 && antes !== 7 && pestanaKelvin) cambiarPestana(false);
        else if (paso === 7 || antes === 7) dibujarGrafica();
    }
}

function indicacion() {
    if (!guiada()) return i18n.t('Sigue tu guión. Apunta en el papel todo lo que midas.');
    const paso = pasoActual();
    return paso <= N_PASOS ? indicacionPaso(paso) : i18n.t('Práctica terminada. Elige otro montaje para repetirla.');
}

function decir(txt, tipo) {
    mensaje = txt;
    mensajeTipo = tipo || '';
    mensajeT = millis();
    anunciar(txt);
}

function anunciar(txt) {
    const el = document.getElementById('anuncio');
    el.textContent = el.textContent === txt ? txt + ' ' : txt;
}

function rellenarMontajes() {
    const sel = document.getElementById('select-montaje');
    MONTAJES.forEach(m => {
        const o = document.createElement('option');
        o.value = String(m.n);
        o.textContent = i18n.t('Montaje {n}', { n: m.n });
        sel.appendChild(o);
    });
}

function setupControles() {
    document.getElementById('nivel-guiada').addEventListener('click', () => setNivel('guiada'));
    document.getElementById('nivel-libre').addEventListener('click', () => setNivel('libre'));
    document.getElementById('select-montaje').addEventListener('change', e => elegirMontaje(parseInt(e.target.value, 10)));
    document.getElementById('btn-azar').addEventListener('click', () => {
        let n;
        do { n = 1 + Math.floor(Math.random() * MONTAJES.length); } while (n === montaje.n);
        elegirMontaje(n);
    });

    const clic = (ids, f) => ids.forEach(id => document.getElementById(id).addEventListener('click', f));
    clic(['btn-llave', 'tactil-llave'], pulsarLlave);
    clic(['btn-placa', 'tactil-placa'], pulsarPlaca);
    clic(['btn-potencia', 'tactil-potencia'], cambiarPotencia);
    clic(['btn-agitador', 'tactil-agitador'], pulsarAgitador);
    clic(['btn-subir'], () => moverElevador(1));
    clic(['btn-bajar'], () => moverElevador(-1));
    clic(['tactil-elevador'], () => moverElevador(elevIdx < ALTOS.length - 1 ? 1 : -1));
    document.getElementById('btn-lupa-termometro').addEventListener('click', () => {
        llevarLupaTermometro();
        decir(i18n.t('La lupa está sobre el final de la columna roja del termómetro. Muévela con las flechas si quieres ver otra parte de la escala.'));
        document.querySelector('#canvas-container canvas').focus();
    });
    document.getElementById('btn-describir').addEventListener('click', describirInstrumentos);
    document.getElementById('btn-reiniciar').addEventListener('click', reiniciar);
    document.getElementById('graf-c').addEventListener('click', () => cambiarPestana(false));
    document.getElementById('graf-k').addEventListener('click', () => cambiarPestana(true));

    document.getElementById('error-lab').addEventListener('keydown', e => {
        if (e.key === 'Tab') { e.preventDefault(); document.getElementById('error-reiniciar').focus(); }
    });
    document.getElementById('error-reiniciar').addEventListener('click', () => {
        reiniciar();
        document.querySelector('#canvas-container canvas').focus();
    });
}

// ============================================================
//  Dibujo
// ============================================================
// Vista frontal pura y una sola luz, arriba a la izquierda.
// El cian marca lo que se puede coger o pulsar.

function dibujarPared() {
    const ctx = drawingContext;
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, MESA_Y);
    g.addColorStop(0, TH.pared1);
    g.addColorStop(1, TH.pared2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CV_W, MESA_Y);
    if (TH.luzPared) {
        const r = ctx.createRadialGradient(300, 120, 20, 300, 120, 560);
        r.addColorStop(0, TH.luzPared);
        r.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, CV_W, MESA_Y);
    }
    ctx.restore();
}

function dibujarMesa() {
    noStroke();
    fill(TH.encimeraCanto);
    rect(0, MESA_Y, CV_W, 3);
    fill(TH.encimeraFrente);
    rect(0, MESA_Y + 3, CV_W, 15);
    fill(TH.mesa);
    rect(0, MESA_Y + 18, CV_W, CV_H - MESA_Y - 18);
    fill(TH.sombraCanto);
    rect(0, MESA_Y + 18, CV_W, 3);
}

function sombraContacto(x, ancho, y = MESA_Y) {
    if (TH.contraste) return;
    noStroke();
    fill(TH.sombra);
    ellipse(x, y + 1, ancho, 7);
    ellipse(x, y + 1, ancho * 0.7, 4);
}

function conAlfa(c, a) {
    const k = color(c);
    k.setAlpha(a);
    return k;
}

// Rótulo bajo un instrumento: nombre y, debajo, el dato técnico más pequeño
function rotulo(lineas, x, nombres = 1) {
    noStroke();
    textAlign(CENTER, TOP);
    const t1 = tamTexto(13), t2 = tamTexto(11);
    let y = MESA_Y + 26;
    if (escala < 0.62) lineas = lineas.slice(0, nombres);
    lineas.forEach((l, i) => {
        const esNombre = i < nombres;
        const t = esNombre ? t1 : t2;
        textSize(t);
        fill(esNombre ? TH.texto : TH.textoTenue);
        const medio = textWidth(l) / 2 + 6;
        text(l, constrain(x, medio, CV_W - medio), y);
        y += t * 1.25;
    });
}

// ── Soporte con las pinzas del matraz y del termómetro ──
function dibujarSoporte() {
    sombraContacto(VARILLA_X, 120);
    noStroke();
    fill(TH.pies);
    rect(VARILLA_X - 50, MESA_Y - 8, 110, 8, 2);
    fill(TH.varilla);
    rect(VARILLA_X - 4, 96, 8, MESA_Y - 104);
    // Brazos
    rect(MX + 12, MATRAZ.cuello + 8, VARILLA_X - MX - 12, 6);
    rect(TX + 4, TERMO.arriba + 10, VARILLA_X - TX - 4, 5);
    fill(TH.pinza);
    rect(VARILLA_X - 9, MATRAZ.cuello + 3, 18, 16, 3);
    rect(VARILLA_X - 9, TERMO.arriba + 5, 18, 15, 3);
    rect(MX + 8, MATRAZ.cuello + 4, 12, 14, 2);
    rect(TX + 2, TERMO.arriba + 6, 10, 13, 2);
}

// ── Elevador de tijera ──
function dibujarElevador() {
    const yTop = yElevador();
    sombraContacto(MX, 150);
    noStroke();
    fill(TH.pies);
    rect(MX - 72, MESA_Y - 8, 144, 8, 2);
    stroke(TH.varilla);
    strokeWeight(5);
    line(MX - 58, MESA_Y - 8, MX + 58, yTop + 8);
    line(MX + 58, MESA_Y - 8, MX - 58, yTop + 8);
    noStroke();
    fill(TH.soporte);
    circle(MX, (MESA_Y + yTop) / 2, 9);
    fill(TH.pies);
    rect(MX - 72, yTop, 144, 8, 2);
    // Mando: dos flechas cian en la base (cian = se pulsa)
    const fx = MX - 124, fy = MESA_Y - 36;
    fill(TH.soporte);
    rect(fx - 13, fy - 6, 26, 42, 4);
    fill(elevIdx < ALTOS.length - 1 ? TH.acento : TH.apagado);
    triangle(fx - 7, fy + 10, fx + 7, fy + 10, fx, fy);
    fill(elevIdx > 0 ? TH.acento : TH.apagado);
    triangle(fx - 7, fy + 20, fx + 7, fy + 20, fx, fy + 30);
}

// ── Placa, vaso, agua, matraz y termómetro ──
function dibujarBano() {
    const yTop = yElevador();
    const yPlaca = yTop - PLACA_H;
    const base = baseAgua();
    const nivel = nivelAgua();
    const a = VASO.ancho / 2;
    const fondoVaso = base + 4;
    const bordeVaso = fondoVaso - VASO.alto;
    const caliente = constrain(calorPlaca / 2.5, 0, 1);

    // Placa: cuerpo y superficie, que enrojece al calentarse
    stroke(TH.metalBorde);
    strokeWeight(1.5);
    fill(TH.placa);
    rect(MX - 100, yPlaca, 200, PLACA_H, 5);
    noStroke();
    fill(lerpColor(color(TH.placaFria), color(TH.placaCaliente), caliente));
    rect(MX - 94, yPlaca - 5, 188, 6, 2);
    // Mandos de la placa
    const cy = yPlaca + PLACA_H / 2 + 1;
    const libre = !guiada();
    // Encendido
    fill(TH.acento);
    circle(MX - 78, cy, 18);
    stroke(TH.placa);
    strokeWeight(2);
    noFill();
    arc(MX - 78, cy, 9, 9, -PI / 2 + 0.7, -PI / 2 - 0.7 + TWO_PI);
    line(MX - 78, cy - 6, MX - 78, cy - 1);
    noStroke();
    fill(placaOn ? TH.led : TH.ledApagado);
    circle(MX - 58, cy, 7);
    // Potencia
    fill(libre ? TH.acento : TH.apagado);
    circle(MX - 30, cy, 18);
    stroke(TH.placa);
    strokeWeight(2);
    const ang = { bajo: -2.3, medio: -PI / 2, alto: -0.85 }[potencia];
    line(MX - 30, cy, MX - 30 + Math.cos(ang) * 7, cy + Math.sin(ang) * 7);
    noStroke();
    fill(TH.tinta);
    textSize(8);
    textAlign(LEFT, CENTER);
    text(i18n.t('CALOR'), MX - 18, cy + 1);
    // Agitador
    fill(libre ? TH.acento : TH.apagado);
    circle(MX + 74, cy, 18);
    stroke(TH.placa);
    strokeWeight(2);
    noFill();
    arc(MX + 74, cy + 1, 9, 9, PI + 0.3, TWO_PI - 0.3);
    noStroke();
    fill(agitando() ? TH.led : TH.ledApagado);
    circle(MX + 54, cy, 7);
    fill(TH.tinta);
    textAlign(RIGHT, CENTER);
    text(i18n.t('AGITAR'), MX + 46, cy + 1);

    // Vaso: fondo del vidrio y agua
    noStroke();
    fill(TH.vidrioFondo);
    rect(MX - a, bordeVaso, 2 * a, VASO.alto);
    fill(TH.agua);
    rect(MX - a + 2, nivel, 2 * a - 4, base - nivel);

    dibujarMatraz();
    dibujarTermometro();

    // El agua por delante, para que el matraz se vea sumergido
    noStroke();
    fill(TH.aguaFrente);
    rect(MX - a + 2, nivel, 2 * a - 4, base - nivel);
    stroke(TH.aguaBorde);
    strokeWeight(1.5);
    line(MX - a + 2, nivel, MX + a - 2, nivel);
    // Hielo flotando: los cubitos menguan al fundirse
    if (hielo > 0) {
        const f = Math.sqrt(constrain(hielo / montaje.hielo, 0, 1));
        noStroke();
        fill(TH.hielo);
        [[-60, 0, 0.2], [-18, 2, -0.25], [26, -1, 0.15]].forEach(([dx, dy, rot]) => {
            const s = 6 + 9 * f;
            push();
            translate(MX + dx, nivel + dy);
            rotate(rot);
            rect(-s / 2, -s * 0.45, s, s * 0.9, 2);
            pop();
        });
    }
    // Imán del agitador en el fondo
    noStroke();
    fill(TH.iman);
    const giro = agitando() ? Math.abs(Math.cos(millis() / 90)) : 1;
    rect(MX - 14 * giro, base - 6, 28 * giro + 0.5, 6, 3);
    // Vapor por encima de 60 °C
    if (tAgua > 60 && !TH.contraste) {
        noFill();
        stroke(255, 255, 255, constrain((tAgua - 60) * 4, 0, 80));
        strokeWeight(2.5);
        const t = millis() / 700;
        [-40, 30].forEach((dx, k) => {
            const y0 = bordeVaso - 6 - ((t + k * 0.5) % 1) * 14;
            bezier(MX + dx, y0, MX + dx + 6, y0 - 8, MX + dx - 6, y0 - 14, MX + dx, y0 - 22);
        });
    }
    // Paredes del vaso, por delante de todo
    noFill();
    stroke(TH.vidrio);
    strokeWeight(2);
    beginShape();
    vertex(MX - a - 5, bordeVaso);
    vertex(MX - a, bordeVaso + 5);
    vertex(MX - a, fondoVaso);
    vertex(MX + a, fondoVaso);
    vertex(MX + a, bordeVaso);
    endShape();
    noStroke();
    fill(TH.textoTenue);
    textSize(8);
    textAlign(LEFT, CENTER);
    text('600 mL', MX - a + 6, bordeVaso + 12);

    rotulo([i18n.t('matraz en el baño'), i18n.t('placa con agitador · termómetro de 1 °C')], MX);
}

function dibujarMatraz() {
    const { tapon, cuello, hombro, base, ancho } = MATRAZ;
    stroke(TH.vidrio);
    strokeWeight(2.2);
    fill(TH.vidrioFondo);
    beginShape();
    vertex(MX - 11, cuello);
    vertex(MX - 11, hombro);
    vertex(MX - ancho, base - 8);
    quadraticVertex(MX - ancho - 2, base, MX - ancho + 8, base);
    vertex(MX + ancho - 8, base);
    quadraticVertex(MX + ancho + 2, base, MX + ancho, base - 8);
    vertex(MX + 11, hombro);
    vertex(MX + 11, cuello);
    endShape();
    // Tapón de goma
    noStroke();
    fill(TH.tapon);
    quad(MX - 14, tapon, MX + 14, tapon, MX + 12, cuello + 6, MX - 12, cuello + 6);
    noStroke();
    fill(TH.textoTenue);
    textSize(9);
    textAlign(CENTER, CENTER);
    text('250 mL', MX, base - 22);
    if (!TH.contraste) {
        fill(TH.brillo);
        quad(MX - 30, base - 12, MX - 26, base - 12, MX - 8, hombro + 14, MX - 9, hombro + 6);
    }
}

function yGrado(t) { return TERMO.yMenos10 - (t + 10) * TERMO.pxGrado; }

function dibujarTermometro() {
    const x = TX;
    // Tubo de vidrio y depósito
    stroke(TH.vidrio);
    strokeWeight(1.5);
    fill(TH.termoTubo);
    rect(x - 6, TERMO.arriba, 12, TERMO.bulbo - TERMO.arriba - 4, 6, 6, 0, 0);
    noStroke();
    fill(TH.alcohol);
    circle(x, TERMO.bulbo, 13);
    // Columna de alcohol teñido
    const y = yGrado(tTermo);
    rect(x - 1.6, y, 3.2, TERMO.bulbo - y);
    // Escala: una raya por grado, más larga cada 5 y cada 10, número cada 10
    for (let t = -10; t <= 110; t++) {
        const yy = yGrado(t);
        const diez = t % 10 === 0, cinco = t % 5 === 0;
        stroke(TH.raya);
        strokeWeight(diez ? 1 : 0.55);
        line(x + 6, yy, x + 6 + (diez ? 8 : cinco ? 5.5 : 3), yy);
        if (diez && t % 20 === 0) {
            noStroke();
            fill(TH.texto);
            textSize(7);
            textAlign(LEFT, CENTER);
            text(String(t).replace('-', '−'), x + 16, yy);
        }
    }
    noStroke();
    fill(TH.textoTenue);
    textSize(7);
    textAlign(CENTER, BOTTOM);
    text('°C', x, TERMO.arriba - 2);
}

// ── Manómetro digital ──
function dibujarManometro() {
    const { x, y, w, h } = MANO;
    sombraContacto(x + w / 2, 70);
    noStroke();
    fill(TH.pies);
    rect(x + 50, y + h, 50, MESA_Y - y - h);
    rect(x + 30, MESA_Y - 8, 90, 8, 2);
    stroke(TH.metalBorde);
    strokeWeight(1.5);
    fill(TH.metal);
    rect(x, y, w, h, 8);
    noStroke();
    fill(TH.pantalla);
    rect(x + 12, y + 14, w - 24, 44, 4);
    fill(TH.pantallaTexto);
    textStyle(BOLD);
    textSize(28);
    textAlign(RIGHT, CENTER);
    text(i18n.num(pantalla, 1), x + w - 42, y + 37);
    textStyle(NORMAL);
    textSize(11);
    textAlign(LEFT, CENTER);
    text('kPa', x + w - 39, y + 40);
    fill(TH.tinta);
    textSize(9);
    textAlign(CENTER, CENTER);
    text(i18n.t('PRESIÓN ABSOLUTA'), x + w / 2, y + 78);
    // Salida hacia la llave
    stroke(TH.metalBorde);
    strokeWeight(1);
    fill(TH.metal);
    rect(x + w, PUERTO_Y - 6, 16, 12);
    rotulo([i18n.t('manómetro'), i18n.t('digital · 0,1 kPa · absoluta')], x + w / 2);
}

function dibujarTubo() {
    const tramo = () => {
        noFill();
        beginShape();
        vertex(LLAVE.x + 24, PUERTO_Y);
        vertex(TUBO_X, PUERTO_Y);
        vertex(TUBO_X, TUBO_Y);
        vertex(MX, TUBO_Y);
        vertex(MX, MATRAZ.tapon + 2);
        endShape();
        line(MANO.x + MANO.w + 14, PUERTO_Y, LLAVE.x - 22, PUERTO_Y);
    };
    strokeJoin(ROUND);
    stroke(TH.tuboBorde);
    strokeWeight(8);
    tramo();
    stroke(TH.tubo);
    strokeWeight(6);
    tramo();
    strokeJoin(MITER);
}

// Llave de tres vías: la palanca apunta a la salida que cierra
function dibujarLlave() {
    const { x, y } = LLAVE;
    stroke(TH.metalBorde);
    strokeWeight(1);
    fill(TH.llave);
    rect(x - 24, y - 9, 48, 18, 4);
    rect(x - 5, y + 9, 10, 16);              // salida al aire de la sala
    fill(TH.metal);
    circle(x, y, 18);
    noStroke();
    fill(TH.acento);
    if (llaveAbierta) rect(x - 6, y - 46, 12, 38, 3);
    else rect(x - 6, y + 8, 12, 38, 3);
    if (!TH.contraste) {
        fill(255, 255, 255, 90);
        if (llaveAbierta) rect(x - 3, y - 43, 2, 32, 1);
        else rect(x - 3, y + 11, 2, 32, 1);
    }
    rotulo([i18n.t('llave'), llaveAbierta ? i18n.t('abierta') : i18n.t('cerrada')], x);
}

// Reloj del laboratorio: cuánto tiempo de verdad llevaría la práctica
function dibujarReloj() {
    const { x, y } = RELOJ;
    const s = Math.floor(tiempoLab);
    const txt = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    stroke(TH.tarjetaBorde);
    strokeWeight(1);
    fill(TH.pastilla);
    rect(x - 78, y - 26, 156, 52, 10);
    noStroke();
    fill(TH.textoTenue);
    textSize(9);
    textAlign(CENTER, CENTER);
    text(i18n.t('tiempo en el laboratorio'), x, y - 13);
    fill(TH.texto);
    textSize(20);
    textStyle(BOLD);
    text(txt, x - 14, y + 8);
    textStyle(NORMAL);
    fill(TH.textoTenue);
    textSize(10);
    text('× 10', x + 50, y + 9);
}

// ── Lupa ──
function aumentoLupa() { return 3; }
function radioLupa() { return escala < 0.62 ? 104 : 82; }
function lupaReposo() { return escala < 0.62 ? { x: 780, y: 268 } : { x: 790, y: 290 }; }

// La lupa está sobre el termómetro: la línea de los ojos se ve a pleno color
function lupaSobreTermometro() {
    return Math.abs(lupaPos.x - TX) < 30 && lupaPos.y > TERMO.arriba && lupaPos.y < TERMO.bulbo;
}

function dibujarLupa() {
    const { x, y } = lupaPos;
    const r = radioLupa();
    const cogida = arrastre && arrastre.que === 'lupa';
    const leyendo = lupaSobreTermometro();
    strokeCap(ROUND);
    stroke(TH.aro);
    strokeWeight(8);
    line(x + r * 0.7, y + r * 0.7, x + r * 0.88, y + r * 0.88);
    stroke(TH.empunadura);
    strokeWeight(13);
    line(x + r * 0.9, y + r * 0.9, x + r * 1.27, y + r * 1.27);
    if (!TH.contraste) {
        stroke(TH.empunaduraLuz);
        strokeWeight(2.5);
        line(x + r * 0.93 + 2.6, y + r * 0.93 - 2.6, x + r * 1.22 + 2.6, y + r * 1.22 - 2.6);
    }
    strokeCap(SQUARE);

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(x, y, r, 0, TWO_PI);
    drawingContext.clip();
    noStroke();
    fill(TH.fondo);
    rect(x - r, y - r, 2 * r, 2 * r);
    push();
    translate(x, y);
    scale(aumentoLupa());
    translate(-x, -y);
    dibujarEscena();
    pop();
    // Línea de los ojos: se pone en el final de la columna roja para leer
    stroke(conAlfa(TH.ojos, leyendo ? 255 : 102));
    strokeWeight(1.3);
    drawingContext.setLineDash([5, 4]);
    line(x - r, y, x + r, y);
    drawingContext.setLineDash([]);
    if (!TH.contraste) {
        noFill();
        stroke(255, 255, 255, 70);
        strokeWeight(3.5);
        arc(x, y, r * 1.62, r * 1.62, PI * 1.2, PI * 1.42);
        strokeWeight(1.5);
        arc(x, y, r * 1.45, r * 1.45, PI * 1.25, PI * 1.36);
    }
    drawingContext.restore();

    noFill();
    if (!TH.contraste) {
        stroke(TH.aroSombra);
        strokeWeight(6.5);
        circle(x, y, 2 * r);
    }
    stroke(TH.aro);
    strokeWeight(4.5);
    circle(x, y, 2 * r);
    if (!TH.contraste) {
        stroke(TH.aroLuz);
        strokeWeight(1.6);
        arc(x, y, 2 * r, 2 * r, PI * 1.03, PI * 1.47);
    }
    const a = Math.max(cogida || encima === 'lupa' ? 230 : 0, 255 * intensidadPulso('lupa'));
    if (a > 0) {
        stroke(conAlfa(TH.acento, a));
        strokeWeight(2);
        circle(x, y, 2 * r + 9);
    }
    dibujarOjo(x - r - 22, y, leyendo ? 255 : 102);
}

function dibujarOjo(ex, y, alfa) {
    stroke(conAlfa(TH.ojos, alfa));
    strokeWeight(1.4);
    fill(conAlfa(TH.ojoBlanco, alfa));
    beginShape();
    vertex(ex - 12, y);
    bezierVertex(ex - 5, y - 8.5, ex + 5, y - 8.5, ex + 12, y);
    bezierVertex(ex + 5, y + 8.5, ex - 5, y + 8.5, ex - 12, y);
    endShape(CLOSE);
    noStroke();
    fill(conAlfa(TH.ojos, alfa));
    circle(ex, y, 9);
    fill(conAlfa(TH.pupila, alfa));
    circle(ex, y, 4.2);
    fill(255, 255, 255, alfa * 0.9);
    circle(ex - 1.6, y - 1.6, 1.8);
}

function llevarLupaTermometro() {
    lupaPos = { x: TX + 6, y: yGrado(tTermo) };
}

// ── Resaltes en cian ──
const OBJETO_PASO = [null, 'lupa', 'llave', 'elevador', 'placa', null, null, null, null, null];
const MOVIMIENTO_REDUCIDO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function intensidadPulso(obj) {
    if (!pulso || pulso.obj !== obj || MOVIMIENTO_REDUCIDO) return 0;
    const t = millis() - pulso.t;
    return t < 1200 ? Math.sin(PI * (t % 600) / 600) : 0;
}

function objetoBajoPuntero() {
    if (punteroTipo !== 'mouse' || arrastre || bloqueado) return null;
    if (mouseX < 0 || mouseY < 0 || mouseX > CV_W || mouseY > CV_H) return null;
    return queHay({ x: mouseX, y: mouseY });
}

function dibujarResaltes() {
    const a = obj => Math.max(encima === obj || (arrastre && arrastre.que === obj) ? 220 : 0, 255 * intensidadPulso(obj));
    noFill();
    strokeWeight(2);
    if (a('llave') > 0) {
        stroke(conAlfa(TH.acento, a('llave')));
        rect(LLAVE.x - 14, llaveAbierta ? LLAVE.y - 52 : LLAVE.y - 14, 28, 66, 7);
    }
    ['subir', 'bajar'].forEach(z => {
        const v = Math.max(a(z), z === 'subir' ? a('elevador') : 0);
        if (v > 0) {
            stroke(conAlfa(TH.acento, v));
            const b = zonaElevador(z);
            rect(b.x, b.y, b.w, b.h, 5);
        }
    });
    const yc = yElevador() - PLACA_H / 2 + 1;
    [['placa', MX - 78], ['potencia', MX - 30], ['agitador', MX + 74]].forEach(([z, x]) => {
        if (a(z) > 0) {
            stroke(conAlfa(TH.acento, a(z)));
            circle(x, yc, 28);
        }
    });
}

// ── Textos del lienzo: tarjeta de indicación y pastilla del montaje ──
function envolver(txt, ancho) {
    const lineas = [];
    let l = '';
    txt.split(' ').forEach(p => {
        const prueba = l ? l + ' ' + p : p;
        if (l && textWidth(prueba) > ancho) { lineas.push(l); l = p; } else l = prueba;
    });
    if (l) lineas.push(l);
    return lineas;
}

function espaciado(px) {
    try { drawingContext.letterSpacing = px + 'px'; } catch (e) { /* sin letterSpacing */ }
}

function dibujarRotulos() {
    const movil = escala < 0.62;
    const m = 12;
    const duracion = mensajeTipo === 'aviso' ? DURACION_AVISO * 2 : DURACION_AVISO;
    const hayMensaje = millis() - mensajeT < duracion && !arrastre;
    const esAviso = hayMensaje && mensajeTipo === 'aviso';
    const paso = pasoActual();
    let cuerpo = hayMensaje ? mensaje : indicacion();
    if (!hayMensaje && nivel === 'guiada' && paso <= N_PASOS) cuerpo = cuerpo.replace(/^[^:]{1,16}:\s+/, '');
    cuerpo = cuerpo.replace(/^⚠\s*/, '');
    const etiqueta = esAviso ? i18n.t('AVISO')
        : nivel === 'libre' ? i18n.t('NIVEL LIBRE')
        : paso <= N_PASOS ? i18n.t('PASO {n} DE {t}', { n: paso, t: N_PASOS })
        : i18n.t('PRÁCTICA TERMINADA');
    const cabecera = movil && !esAviso
        ? etiqueta + ' · ' + i18n.t('MONTAJE {n} · SALA A {t} °C', { n: montaje.n, t: montaje.tSala })
        : etiqueta;

    const tp = tamTexto(13);
    textSize(tp);
    textStyle(NORMAL);
    const txtP = i18n.t('Montaje {n} · sala a {t} °C', { n: montaje.n, t: montaje.tSala });
    const wP = textWidth(txtP) + 26, hP = tp + 14;

    const tt = tamTexto(15), te = tamTexto(11);
    const wC = movil ? CV_W - 2 * m : CV_W - 3 * m - wP;
    const sangria = esAviso ? te * 1.9 : 0;
    textSize(tt);
    const lineas = envolver(cuerpo, wC - 32);
    const hC = 14 + te + 9 + lineas.length * tt * 1.32 + 8;
    stroke(esAviso ? TH.aviso : TH.tarjetaBorde);
    strokeWeight(esAviso ? 1.6 : 1);
    fill(TH.tarjeta);
    rect(m, m, wC, hC, 8);
    noStroke();
    if (esAviso) {
        fill(TH.aviso);
        circle(m + 16 + te * 0.7, m + 14 + te * 0.5, te * 1.4);
        fill(TH.fondo);
        textSize(te);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text('!', m + 16 + te * 0.7, m + 14 + te * 0.55);
    }
    fill(esAviso ? TH.aviso : TH.acento);
    textSize(te);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    espaciado(1.4);
    text(cabecera, m + 16 + sangria, m + 14);
    espaciado(0);
    textStyle(NORMAL);
    fill(TH.texto);
    textSize(tt);
    lineas.forEach((l, i) => text(l, m + 16, m + 14 + te + 9 + i * tt * 1.32));

    // En el móvil no cabe la pastilla: el montaje va en la cabecera de la tarjeta
    if (movil) return;
    const xP = CV_W - m - wP;
    const yP = m;
    stroke(TH.tarjetaBorde);
    strokeWeight(1);
    fill(TH.pastilla);
    rect(xP, yP, wP, hP, hP / 2);
    noStroke();
    fill(TH.texto);
    textSize(tp);
    textAlign(CENTER, CENTER);
    text(txtP, xP + wP / 2, yP + hP / 2 + 0.5);
}

function tamTexto(base) {
    return constrain(base * 0.7 / escala, base, base * 1.9);
}

// ═══════════════════════════════════════════════════════════════════
//  RATÓN, DEDO Y TECLADO
// ═══════════════════════════════════════════════════════════════════
function puntoLienzo(e, cv) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * CV_W / r.width, y: (e.clientY - r.top) * CV_H / r.height };
}


function sobreLupa(q) {
    const r = radioLupa();
    const enAro = dist(q.x, q.y, lupaPos.x, lupaPos.y) < r;
    const t = ((q.x - lupaPos.x) + (q.y - lupaPos.y)) / 2;
    const enMango = t > r * 0.6 && t < r * 1.35 && Math.abs((q.x - lupaPos.x) - (q.y - lupaPos.y)) < 18;
    return enAro || enMango;
}

// Los mandos son pequeños: en pantallas pequeñas la zona que responde crece
function holgura() { return Math.max(4, 14 / escala - 10); }

function sobreLlave(q) {
    const extra = holgura();
    const y0 = llaveAbierta ? LLAVE.y - 46 : LLAVE.y - 10;
    return Math.abs(q.x - LLAVE.x) < 14 + extra && q.y > y0 - extra && q.y < y0 + 56 + extra;
}

function zonaElevador(z) {
    const fx = MX - 124, fy = MESA_Y - 36;
    return z === 'subir' ? { x: fx - 12, y: fy - 4, w: 24, h: 18 } : { x: fx - 12, y: fy + 16, w: 24, h: 18 };
}

function dentro(q, b, extra) {
    return q.x > b.x - extra && q.x < b.x + b.w + extra && q.y > b.y - extra && q.y < b.y + b.h + extra;
}

function queHay(q) {
    if (sobreLupa(q)) return 'lupa';
    if (sobreLlave(q)) return 'llave';
    const extra = holgura();
    const ex = Math.min(extra, 6);
    if (dentro(q, zonaElevador('subir'), ex)) return 'subir';
    if (dentro(q, zonaElevador('bajar'), ex)) return 'bajar';
    const yc = yElevador() - PLACA_H / 2 + 1;
    if (dist(q.x, q.y, MX - 78, yc) < 11 + extra) return 'placa';
    if (!guiada() && dist(q.x, q.y, MX - 30, yc) < 11 + extra) return 'potencia';
    if (!guiada() && dist(q.x, q.y, MX + 74, yc) < 11 + extra) return 'agitador';
    return null;
}

function setupPuntero(cv) {
    cv.style.touchAction = 'none';

    cv.addEventListener('pointermove', (e) => { punteroTipo = e.pointerType; });
    cv.addEventListener('pointerdown', (e) => {
        punteroTipo = e.pointerType;
        if (bloqueado) return;
        const q = puntoLienzo(e, cv);
        const que = queHay(q);
        if (que === 'lupa') {
            const r = radioLupa();
            arrastre = e.pointerType === 'touch'
                ? { que: 'lupa', dx: -r * 1.05, dy: -r * 1.05 }
                : { que: 'lupa', dx: lupaPos.x - q.x, dy: lupaPos.y - q.y };
            lupaPos.x = constrain(q.x + arrastre.dx, 0, CV_W);
            lupaPos.y = constrain(q.y + arrastre.dy, 0, MESA_Y);
            cv.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }
        const acciones = {
            llave: pulsarLlave,
            subir: () => moverElevador(1),
            bajar: () => moverElevador(-1),
            placa: pulsarPlaca,
            potencia: cambiarPotencia,
            agitador: pulsarAgitador,
        };
        if (acciones[que]) {
            acciones[que]();
            e.preventDefault();
        }
    });

    cv.addEventListener('pointermove', (e) => {
        if (!arrastre) return;
        const q = puntoLienzo(e, cv);
        lupaPos.x = constrain(q.x + arrastre.dx, 0, CV_W);
        lupaPos.y = constrain(q.y + arrastre.dy, 0, MESA_Y);
    });

    const terminar = () => {
        if (!arrastre) return;
        arrastre = null;
        actualizarInterfaz();
    };
    cv.addEventListener('pointerup', terminar);
    cv.addEventListener('pointercancel', terminar);

    // Flechas: mueven la lupa (Mayús para ir más deprisa)
    cv.addEventListener('keydown', (e) => {
        if (bloqueado) return;
        const paso = e.shiftKey ? 20 : 4;
        const d = { ArrowUp: [0, -paso], ArrowDown: [0, paso], ArrowLeft: [-paso, 0], ArrowRight: [paso, 0] }[e.key];
        if (!d) return;
        e.preventDefault();
        lupaPos.x = constrain(lupaPos.x + d[0], 0, CV_W);
        lupaPos.y = constrain(lupaPos.y + d[1], 0, MESA_Y);
    });
}

function actualizarCursor() {
    const cv = document.querySelector('#canvas-container canvas');
    if (!cv) return;
    let c = 'default';
    if (arrastre) c = 'grabbing';
    else {
        const q = queHay({ x: mouseX, y: mouseY });
        if (q === 'lupa') c = 'grab';
        else if (q) c = 'pointer';
    }
    if (cv.style.cursor !== c) cv.style.cursor = c;
}

// ═══════════════════════════════════════════════════════════════════
//  TAMAÑO DEL CANVAS
// ═══════════════════════════════════════════════════════════════════
function fitCanvas() {
    const cont = document.getElementById('canvas-container');
    const cv = cont.querySelector('canvas');
    if (!cv) return;
    const cs = getComputedStyle(cont);
    const w = cont.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const apilado = window.matchMedia('(max-width: 1100px)').matches;
    const h = apilado ? Infinity : cont.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const s = Math.max(0.1, Math.min(w / CV_W, h / CV_H));
    escala = s;
    cv.style.width  = Math.floor(CV_W * s) + 'px';
    cv.style.height = Math.floor(CV_H * s) + 'px';
}

function windowResized() { fitCanvas(); }

// ═══════════════════════════════════════════════════════════════════
//  TEMAS (oscuro · claro · alto contraste)
// ═══════════════════════════════════════════════════════════════════
const CLAVE_TEMA = 'sim-practica-gay-lussac-tema';

function setupThemeSelector() {
    const themeBtn   = document.getElementById('theme-btn');
    const themePanel = document.getElementById('theme-panel');
    const themeOpts  = document.querySelectorAll('.theme-opt');

    const closePanel = () => {
        themePanel.classList.remove('open');
        themePanel.setAttribute('aria-hidden', 'true');
        themeBtn.classList.remove('active');
        themeBtn.setAttribute('aria-expanded', 'false');
    };

    const aplicar = (theme) => {
        document.body.classList.remove('theme-light', 'theme-contrast');
        if (theme !== 'dark') document.body.classList.add('theme-' + theme);
        themeOpts.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
    };

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = themePanel.classList.toggle('open');
        themeBtn.classList.toggle('active', isOpen);
        themeBtn.setAttribute('aria-expanded', String(isOpen));
        themePanel.setAttribute('aria-hidden', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
        if (!themeBtn.contains(e.target) && !themePanel.contains(e.target)) closePanel();
    });

    themeOpts.forEach(btn => {
        btn.addEventListener('click', () => {
            aplicar(btn.dataset.theme);
            try { localStorage.setItem(CLAVE_TEMA, btn.dataset.theme); } catch (e) { /* sin almacenamiento */ }
            closePanel();
        });
    });

    try {
        const guardado = localStorage.getItem(CLAVE_TEMA);
        if (guardado === 'light' || guardado === 'contrast') aplicar(guardado);
    } catch (e) { /* sin almacenamiento */ }
}


function updateTheme() {
    const isLight    = document.body.classList.contains('theme-light');
    const isContrast = document.body.classList.contains('theme-contrast');

    if (isLight) {
        TH = {
            fondo: '#e2e8f0', pared1: '#f1f4f8', pared2: '#e2e8f0', luzPared: 'rgba(255,255,255,0.45)',
            encimeraCanto: '#9eabbd', encimeraFrente: '#c4cdda', mesa: '#d3dae4', sombraCanto: 'rgba(40,55,80,0.12)', sombra: 'rgba(40,55,80,0.22)',
            texto: '#0d1520', textoTenue: '#46556e', acento: '#00628e', aviso: '#9a5a00',
            pies: '#5a6578', soporte: '#7d8797', metal: '#e1e6ee', metalLuz: '#ffffff', metalBorde: '#7d8aa0',
            esfera: '#ffffff', esferaBorde: '#9aa3b2', tinta: '#1a2236', tintaTenue: '#5a6474', aguja: '#c62828', eje: '#3a4150', franja: '#d33',
            tubo: '#f4f6fa', tuboBorde: '#9aa3b2', llave: '#f2f4f7',
            vidrio: '#5a6a84', vidrioFondo: 'rgba(255,255,255,0.45)', raya: '#1a2236', brillo: 'rgba(255,255,255,0.75)',
            aireDentro: 'rgba(120,160,220,0.08)', goma: '#2a2f3a', gomaRaya: '#4a5262', vastago: '#f2f4f7',
            pantalla: '#10241a', pantallaTexto: '#5ef0a8',
            varilla: '#8a94a6', pinza: '#5a6578', apagado: '#a8b0bd', tapon: '#5a6070',
            placa: '#eef1f5', placaFria: '#9aa3b2', placaCaliente: '#d0503e', led: '#e0301e', ledApagado: '#8a93a2',
            agua: 'rgba(60,130,210,0.30)', aguaFrente: 'rgba(60,130,210,0.16)', aguaBorde: '#2f6fb8', hielo: 'rgba(255,255,255,0.9)', iman: '#ffffff',
            termoTubo: 'rgba(255,255,255,0.6)', alcohol: '#d0342a', ojos: '#8a6000', ojoBlanco: '#ffffff', pupila: '#1a1a1a',
            contraste: false,
            aro: '#7d8797', aroLuz: '#dfe4ea', aroSombra: 'rgba(30,40,60,0.3)', empunadura: '#0088bb', empunaduraLuz: 'rgba(255,255,255,0.45)',
            tarjeta: 'rgba(255,255,255,0.92)', tarjetaBorde: '#c3ccd9', pastilla: 'rgba(255,255,255,0.92)',
        };
    } else if (isContrast) {
        TH = {
            fondo: '#000000', pared1: '#000000', pared2: '#000000',
            encimeraCanto: '#ffff00', encimeraFrente: '#000000', mesa: '#000000', sombraCanto: '#000000', sombra: 'rgba(0,0,0,0)',
            texto: '#ffffff', textoTenue: '#ffffff', acento: '#00ffff', aviso: '#ffaa00',
            pies: '#ffffff', soporte: '#ffffff', metal: '#000000', metalLuz: '#000000', metalBorde: '#ffffff',
            esfera: '#000000', esferaBorde: '#ffffff', tinta: '#ffffff', tintaTenue: '#ffffff', aguja: '#ff4444', eje: '#ffffff', franja: '#ff4444',
            tubo: '#000000', tuboBorde: '#ffffff', llave: '#000000',
            vidrio: '#ffffff', vidrioFondo: 'rgba(255,255,255,0.06)', raya: '#ffffff', brillo: 'rgba(255,255,255,0)',
            aireDentro: 'rgba(0,0,0,0)', goma: '#ffffff', gomaRaya: '#000000', vastago: '#000000',
            pantalla: '#000000', pantallaTexto: '#00ff88',
            varilla: '#ffffff', pinza: '#ffffff', apagado: '#555555', tapon: '#ffffff',
            placa: '#000000', placaFria: '#ffffff', placaCaliente: '#ff4444', led: '#ff4444', ledApagado: '#555555',
            agua: 'rgba(0,160,255,0.35)', aguaFrente: 'rgba(0,0,0,0)', aguaBorde: '#00ffff', hielo: '#ffffff', iman: '#ffffff',
            termoTubo: '#000000', alcohol: '#ff4444', ojos: '#ffff00', ojoBlanco: '#ffffff', pupila: '#000000',
            contraste: true,
            aro: '#ffffff', aroLuz: '#ffffff', aroSombra: '#000000', empunadura: '#00ffff', empunaduraLuz: '#000000',
            tarjeta: '#000000', tarjetaBorde: '#ffff00', pastilla: '#000000',
        };
    } else {
        TH = {
            fondo: '#0d1016', pared1: '#161b24', pared2: '#0d1016', luzPared: 'rgba(120,150,200,0.07)',
            encimeraCanto: '#46526a', encimeraFrente: '#1f2633', mesa: '#141922', sombraCanto: 'rgba(0,0,0,0.35)', sombra: 'rgba(0,0,0,0.4)',
            texto: '#d8dee8', textoTenue: '#8d9ab3', acento: '#00c8ff', aviso: '#f0a832',
            pies: '#3a4150', soporte: '#566074', metal: '#c3cad6', metalLuz: '#eef1f5', metalBorde: '#8d95a5',
            esfera: '#f4f6fa', esferaBorde: '#9aa2b0', tinta: '#1d2430', tintaTenue: '#5a6474', aguja: '#c62828', eje: '#3a4150', franja: '#d33',
            tubo: '#dfe5ee', tuboBorde: '#8d95a5', llave: '#e8ecf2',
            vidrio: '#c8d4e6', vidrioFondo: 'rgba(200,212,230,0.06)', raya: '#e4ecf8', brillo: 'rgba(255,255,255,0.16)',
            aireDentro: 'rgba(150,190,240,0.05)', goma: '#4a5263', gomaRaya: '#2a303b', vastago: '#dfe5ee',
            pantalla: '#0c1712', pantallaTexto: '#5ef0a8',
            varilla: '#7a8394', pinza: '#566074', apagado: '#4b5563', tapon: '#565c68',
            placa: '#d9dee6', placaFria: '#9aa2b0', placaCaliente: '#c8584a', led: '#ff4a3a', ledApagado: '#4b5563',
            agua: 'rgba(55,130,215,0.42)', aguaFrente: 'rgba(55,130,215,0.16)', aguaBorde: '#7fb8ff', hielo: 'rgba(230,245,255,0.8)', iman: '#f4f6fa',
            termoTubo: 'rgba(235,240,248,0.14)', alcohol: '#e0453a', ojos: '#ffd24a', ojoBlanco: '#f4f6fa', pupila: '#1a1a1a',
            contraste: false,
            aro: '#9aa4b2', aroLuz: '#e6ebf2', aroSombra: 'rgba(0,0,0,0.45)', empunadura: '#00c8ff', empunaduraLuz: 'rgba(255,255,255,0.45)',
            tarjeta: 'rgba(22,27,36,0.92)', tarjetaBorde: '#2c3546', pastilla: 'rgba(22,27,36,0.92)',
        };
    }
}
