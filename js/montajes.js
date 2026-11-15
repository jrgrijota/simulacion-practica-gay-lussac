'use strict';
// ============================================================
//  Montajes de la práctica
//  Cada número es siempre el mismo día de laboratorio: la presión
//  atmosférica (la habitual en Madrid, a unos 650 m de altitud),
//  la temperatura de la sala y el hielo del vaso. La clave de la
//  guía docente sale de esta tabla: P/T = patm / (tSala + 273,15).
//  El hielo se mide en «grados de calor»: lo que tendría que subir
//  el agua con el calor que hace falta para fundirlo.
// ============================================================

const MONTAJES = [
    { n: 1,  patm: 94.6, tSala: 21, hielo: 10 },
    { n: 2,  patm: 93.4, tSala: 22, hielo: 14 },
    { n: 3,  patm: 95.2, tSala: 20, hielo: 8 },
    { n: 4,  patm: 94.1, tSala: 23, hielo: 12 },
    { n: 5,  patm: 94.2, tSala: 21, hielo: 9 },
    { n: 6,  patm: 93.0, tSala: 24, hielo: 15 },
    { n: 7,  patm: 94.9, tSala: 22, hielo: 11 },
    { n: 8,  patm: 93.7, tSala: 20, hielo: 7 },
    { n: 9,  patm: 95.5, tSala: 22, hielo: 13 },
    { n: 10, patm: 94.3, tSala: 19, hielo: 10 },
    { n: 11, patm: 96.0, tSala: 23, hielo: 12 },
    { n: 12, patm: 93.9, tSala: 21, hielo: 9 },
];

// Potencias de la placa: °C por segundo que sube el agua (con el tiempo × 10)
const POTENCIAS = {
    bajo:  { nombre: 'baja',  calor: 0.35 },
    medio: { nombre: 'media', calor: 0.7 },
    alto:  { nombre: 'alta',  calor: 1.05 },
};

// Medidas del nivel guiado: lo que se busca y lo que se da por bueno
const MEDIDAS = [
    { rotulo: 'Sala',     min: -Infinity, max: Infinity },
    { rotulo: 'Hielo',    min: -0.5, max: 0.5 },
    { rotulo: '≈ 20 °C',  min: 15, max: 30, objetivo: 20 },
    { rotulo: '≈ 40 °C',  min: 35, max: 50, objetivo: 40 },
    { rotulo: '≈ 60 °C',  min: 55, max: 70, objetivo: 60 },
    { rotulo: '≈ 80 °C',  min: 75, max: 89, objetivo: 80 },
];
