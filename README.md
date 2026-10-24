# Ley de Gay-Lussac — Simulación Interactiva

Práctica de laboratorio simulada para **Física y Química de 3.º de ESO**: el alumno encierra aire en
un **matraz** cerrado con una **llave de tres vías**, lo mete en un baño de agua con hielo y lo calienta
con una **placa calefactora** hasta unos 80 °C. Lee la temperatura en un **termómetro** y la presión en un
**manómetro digital**, comprueba que, a volumen constante, **P / T es constante** con T en kelvin y, al
alargar la recta de P frente a t hasta P = 0, llega al **cero absoluto**.

Es la tercera de la gama **Prácticas de laboratorio** de [simulaciencia.es](https://simulaciencia.es) y forma
pareja con la de la [ley de Boyle-Mariotte](https://github.com/jrgrijota/simulacion-practica-boyle).

## Niveles

- **Guiada (paso a paso):** nueve pasos numerados y un cuaderno de laboratorio en pantalla con seis medidas
  (sala, agua con hielo y hacia 20, 40, 60 y 80 °C). La simulación comprueba cada lectura y cada cálculo al
  apuntarlos. Antes de pasar a kelvin, el alumno calcula P / t con la temperatura en °C y ve que no se repite.
  En el paso 7 coloca una **regla** sobre sus puntos y lee dónde corta el eje de P = 0. Después mira la gráfica
  en kelvin y termina con una pregunta de partículas. En este nivel el agitador se enciende solo con la placa
  y la potencia es media.
- **Libre (con guión en papel):** la simulación solo pone los instrumentos y el número de montaje. El alumno
  sigue un guión impreso, elige a qué temperaturas mide y lo apunta todo en la hoja; no hay cuaderno ni
  corrección en pantalla. Maneja los cinco mandos: llave, elevador, encendido de la placa, potencia (baja,
  media o alta) y agitador.

## Cómo se maneja

- La **palanca de la llave** se pulsa. Apunta a la salida que cierra: **hacia arriba**, todo está abierto al
  aire de la sala; **hacia abajo**, el aire del matraz queda encerrado.
- Las **flechas cian** de la base del elevador lo suben y lo bajan entre tres alturas: abajo (el agua no toca
  el matraz), a media altura (solo cubre el fondo) y arriba (cubre el matraz entero).
- La placa tiene tres botones: **encendido** (con un piloto rojo), **potencia** y **agitador**. Al apagarla
  sigue caliente y el agua aún sube 2 o 3 °C. Se apaga sola a 90 °C.
- Mientras queda **hielo**, el agua no pasa de 0 °C: los cubitos se ven menguar y un aviso explica que el
  calor se gasta en fundirlos.
- La **lupa** se arrastra y amplía el termómetro. Su línea amarilla marca la altura de los ojos: se pone en
  el final de la columna roja para leer.
- El **tiempo va × 10**, y un reloj dice cuánto tiempo de laboratorio habría pasado.
- Abrir la llave después de cerrarla, con el aire más caliente o más frío que al cerrar, hace que salga o
  entre aire: en el nivel guiado sale un aviso rojo y hay que empezar de nuevo con el mismo montaje.
- En el móvil, unos botones bajo la mesa hacen lo mismo que los mandos.
- **Con el teclado:** el tabulador lleva a unos botones que solo aparecen al recibir el foco (llave, elevador,
  placa, potencia, agitador y llevar la lupa al termómetro). Con el lienzo enfocado, las flechas mueven la
  lupa; los extremos de la regla de la gráfica también se mueven con las flechas. «Describir los
  instrumentos» dice entre qué rayas está el líquido del termómetro, qué marca el manómetro y cómo están la
  placa y el elevador.

## Criterio didáctico

- La simulación **nunca muestra la temperatura**: hay que leerla en el termómetro (de −10 a 110 °C, división
  de 1 °C, alcohol teñido de rojo). El manómetro es digital, de 0,1 kPa: con uno de aguja el cero absoluto
  saldría desviado varias decenas de grados.
- Hay 12 montajes numerados. Cada número es siempre el mismo día de laboratorio: la presión atmosférica
  (la habitual en Madrid, de 93 a 96 kPa), la temperatura de la sala y la cantidad de hielo. Al abrir la
  simulación sale uno al azar. La clave es P / T = Patm / (tsala + 273,15).
- La ley se cumple exactamente; lo que aleja el resultado son los errores del alumno: leer con la placa
  encendida o sin esperar, no cubrir el matraz, leer el termómetro sin poner los ojos a la altura del
  líquido, calentar sin remover (en el nivel libre) o pasarse por la inercia de la placa.
- En el nivel guiado se da por buena la temperatura a menos de medio grado de lo que marca el termómetro y
  la presión que enseña la pantalla. Las filas calientes se aceptan en un margen (por ejemplo, la de 20 °C
  entre 15 y 30 °C), y si el agua pasa de largo una fila, esa fila se salta. T vale con t + 273 o con
  t + 273,15. P / T se da por constante con menos de un 2 % de diferencia, y el corte de la regla con P = 0,
  a menos de 15 °C del de la recta de los datos del alumno.
- No se tienen en cuenta la dilatación del vidrio ni el aire del tubo, que no se calienta.

## Uso

Abre `index.html` en un navegador. No necesita instalación ni conexión: incluye [p5.js](https://p5js.org/)
en `js/vendor/`. Incluye temas oscuro, claro y alto contraste (botón del engranaje).

Parámetros de la dirección, para repartir la práctica:

| Parámetro | Efecto |
|---|---|
| `?nivel=libre` | Abre el nivel libre |
| `?montaje=7` | Empieza con el montaje 7 (de 1 a 12); sin él, sale uno al azar |

Por ahora la interfaz solo está en español; las traducciones se harán con la versión definitiva.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Panel de controles de los dos niveles |
| `css/style.css` | Estilos y temas (mismo sistema visual que el resto de simulaciones) |
| `css/practica.css` | Estilos propios: pasos, cuaderno, gráfica con la regla, pregunta y botones de los instrumentos |
| `js/montajes.js` | Los 12 montajes, las potencias de la placa y las medidas del nivel guiado |
| `js/sketch.js` | Mesa de laboratorio, placa, baño, matraz, termómetro, manómetro, lupa, física, pasos y comprobaciones |
| `js/i18n.js`, `js/i18n-en.js`, `js/i18n-ca.js`, `js/i18n-eu.js`, `js/i18n-gl.js` | Idioma de la interfaz (diccionarios pendientes) |
