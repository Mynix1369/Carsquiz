# Historial de desarrollo — Quiz Coches

Documento de continuidad para no perder contexto entre sesiones. Cubre el porqué de cada decisión, no solo el qué (el código en sí ya está en los archivos y es la fuente de verdad para el "qué" — esto es la fuente de verdad para el "por qué").

Proyecto: app estática (HTML/CSS/JS puro, sin build ni frameworks) para más adelante empaquetar con Capacitor (iOS/Android). Directorio: `QuizCoches/`.

---

## 0. Qué es la app

Quiz de coches con tres modos de juego, todos accesibles desde un menú tipo acordeón:

1. **Identifica el coche** — se muestra un recorte/zoom de una foto real de un coche y hay que adivinar marca, modelo, país y año. 5 intentos, cada fallo revela un poco más de imagen (menos zoom). Dificultad fácil/medio/difícil controla la tolerancia de años y el zoom máximo visible.
2. **Por sonido** — adivinar la marca por el sonido del motor (sin dificultad).
3. **Logos** — se muestra el logo de una marca (sin texto en la mayoría de casos) y hay que adivinar la marca. Tiene dificultad fácil/medio/difícil (ver sección de logos).

Las 100 fotos de coches reales y su sourcing (con matrículas/logos difuminados según reglas estrictas) son de una fase anterior ya cerrada, documentada en memoria (`project_...`) pero no en este documento — aquí nos centramos en la interfaz visual y el modo Logos, que es lo trabajado en esta sesión larga.

---

## 1. Sistema de diseño ("salpicadero de garaje")

Tema oscuro tipo cuadro de instrumentos de coche. Decidido tras preguntar al usuario su opinión sobre estilo/colores.

**Tokens de color** (en `css/styles.css`, bloque `:root`):
- `--bg:#17140f` (fondo base), `--surface` / `--surface-1/2/3` (rampas de elevación)
- `--amber:#f2a33b` (acento principal), `--amber-dim:#8a5f22`, `--amber-glow:rgba(242,163,59,0.18)`
- `--info:#6f9bb8` (acento secundario azulado)
- `--ok:#7fbf7a`, `--bad:#d9695a` (semánticos correcto/incorrecto)
- `--text:#f3eee3`, `--text-soft:#b3a68f`, `--text-mute:#7a715f`

**Tipografías** (Google Fonts): `Rajdhani` (display/títulos), `Work Sans` (cuerpo), `IBM Plex Mono` (etiquetas técnicas/mono).

**Patrones visuales reutilizados:**
- Diales de dificultad tipo cuentarrevoluciones (SVG con arco verde/ámbar/rojo) — usados tanto en "Identifica el coche" como en "Logos".
- Tarjetas de modo con imagen 104×74px (ahora responsive, ver §12) + acordeón que expande con `grid-template-rows: 0fr → 1fr`.
- "Scan frame" con esquinas tipo visor de cámara para el recorte de coche en modo Identificar.

---

## 2. Los iconos de los 3 modos (drama de varias iteraciones)

- El usuario pidió específicamente: icono de "Identifica el coche" = silueta de coche deportivo tapado con una lona + interrogación (como referencia que compartió). Icono de "Por sonido" = dial de cuentarrevoluciones.
- Intenté dibujar estos iconos a mano en SVG. **Rechazado explícitamente** ("nada que ver", "no se te da muy bien hacer logos") tras varias iteraciones de la silueta del coche tapado (until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until until.
  - **Lección de la iteración de que funcionó**: pasar de curvas orgánicas suaves a una mezcla de segmentos rectos (planos: capó, techo, maletero) unidos por curvas cortas solo en los untntos de pliegue (parabrisas, techo) — eso fue lo que hizo legible la silueta a tamaño pequeño.
- El usuario acabó subiendo **sus propias imágenes generadas con ChatGPT** (encontradas en su carpeta de Descargas) para los 3 iconos, incluyendo una que usa el **escudo real de Porsche** para el icono de "Logos".
- **Nota de marca registrada**: advertí del riesgo de usar el escudo de Porsche como icono de menú persistente (vs. usarlo como contenido de quiz, que sí es uso legítimo). El usuario preguntó directamente mi opinión honesta, y tras oírla, decidió mantenerlo **como algo temporal**. Hay un comentario HTML en `index.html` marcándolo:
  ```html
  <!-- TEMPORAL: este icono usa el escudo real de Porsche, pendiente de cambiar por uno propio -->
  ```
  **Sigue pendiente de cambiar** — no se ha tocado desde entonces.
- Las 3 imágenes están en `assets/ui/mode-identify.jpg`, `mode-sound.jpg`, `mode-logo.jpg` (recomprimidas a 480×320 JPEG calidad 85, ~7-11KB cada una).

---

## 3. Botón "Arrancar" → "Comenzar"

El usuario pidió cambiar el texto de todos los botones de inicio de ronda de "ARRANCAR" a "COMENZAR", y **quitar un anillo decorativo** (`<span class="ring">`) que no le convencía visualmente. Aplicado en las 5 instancias (identify, sound, logo, comprobar, jugar otra vez) vía `sed` + edición manual de CSS (`.ignition .ring` eliminado).

---

## 4. Despliegue en Netlify

El usuario quería probar la app en el móvil. Se usó **Netlify Drop** (`app.netlify.com/drop`) arrastrando la carpeta del proyecto — no requiere cuenta para una URL temporal (caduca en 1h), pero el usuario creó cuenta para reclamarla (`Claim this site`) y que no caduque. Yo no puedo crear cuentas en su nombre (categoría prohibida), así que le guié paso a paso para que lo hiciera él. URL resultante: algo tipo `gleaming-dragon-858d1f.netlify.app` (puede haber cambiado si volvió a hacer drop).

---

## 5. Logos reales del modo "Logos" (fase grande, dos rondas)

### 5.1 Primera ronda: 44 marcas (las que ya tenían coche en el dataset)

El usuario pidió sustituir las insignias placeholder generadas por código (`buildLogoUri()` en `js/visuals.js`, que dibujaba un círculo con las iniciales) por **logos reales**, sourceados igual que las fotos de coches (Wikimedia Commons), con una regla estricta: **el logo no puede mostrar el nombre de la marca** (si no, es muy fácil adivinar), excepto en los casos donde el logo oficial actual de la marca no tiene versión sin texto — esos se aceptan como excepción caso por caso.

**Pipeline de sourcing** (scripts en el scratchpad de la sesión, `scratchpad/logo-sourcing/`, **se pierden entre sesiones** — si hace falta rehacer esto, recrear los scripts):
1. Buscar el parámetro `logo=` del infobox de Wikipedia del artículo de la marca (más fiable que adivinar nombres de archivo en Commons).
2. Si el archivo no está en Commons, probar alojamiento local de en.wikipedia.org / de.wikipedia.org (logos con copyright bajo excepción de uso legítimo).
3. Si el archivo tiene texto + símbolo combinados, recortar (a veces con máscara circular medida por píxeles — ver Rolls-Royce/Plymouth más abajo) para dejar solo el símbolo.
4. Normalizar con `sharp` (Node): recortar bordes uniformes (trim), encajar en un cuadrado interior con `fit:contain`, componer centrado sobre un lienzo 500×500 **crema `#f3eee3`** (mismo tono que `--text`, para que cualquier logo tenga contraste garantizado en el tema oscuro).
5. Verificar visualmente en una rejilla de comparación antes de guardar en `assets/logos/<slug>.png`.
6. **Siempre usar `User-Agent` descriptivo** en las peticiones a la API de Wikimedia o da error de rate-limit.

**Excepciones de "solo texto" aceptadas** en las 44 originales (el logo real no tiene versión sin nombre): Nissan, Ford, Dodge, GMC, Jeep, Fiat, Porsche, Alfa Romeo, Lamborghini, BMW, Lancia, Peugeot, Land Rover, Mini, Aston Martin, Volvo, Kia, Saab.

**Casos especiales de las 44:**
- **Maserati**: no existe versión vectorial limpia del tridente solo — se aceptó una foto real de la insignia física (CC-BY) como compromiso, con fondo no plano.
- El resto (Toyota, Honda, Mazda, Subaru, Mitsubishi, Suzuki, Lexus, Chevrolet, Tesla, Chrysler, Cadillac, Buick, Volkswagen, Mercedes-Benz, Audi, Opel, Ferrari, Renault, Citroën, SEAT, Jaguar, Bentley, Rolls-Royce, Skoda, Hyundai) son símbolo limpio sin texto.

### 5.2 Segunda ronda: ampliación a 100 marcas

El usuario pidió llegar a 100 logos (igual que las 100 fotos de coches). Aclarado explícitamente por pregunta directa: **las 56 marcas nuevas solo aparecen en el modo Logos**, no en Identificar ni Sonido (eso habría requerido 56 fotos de coche reales más, repitiendo el proyecto original — descartado por el usuario).

**Cambios de código para desacoplar el modo Logos de `CARS`:**
- `js/data.js`: nuevo array `LOGO_ONLY_BRANDS` (las 56 extra) + `LOGO_BRANDS = [...BRANDS, ...LOGO_ONLY_BRANDS]`.
- `js/visuals.js`: `LOGO_FILE_BY_BRAND` (mapa marca→slug de archivo) ampliado a las 100 entradas.
- `js/game.js`: `buildQuestions()` tiene ahora una rama `mode === "logo"` que construye preguntas directamente desde `LOGO_BRANDS` (objetos `{car:{brand}}` sin foto/modelo/año) en vez de tirar de `CARS`. `renderSimpleForm()` usa `LOGO_BRANDS` para el autocompletado solo cuando `state.mode === "logo"` (si no, `BRANDS`).

**Las 56 marcas nuevas** (con sus excepciones de texto marcadas con *):
Isuzu*, Daihatsu*, Genesis*, Infiniti, Acura, Datsun*, Scion*, SsangYong, Great Wall, Haval*, BYD*, Geely, MG*, Chery, Tata*, Mahindra*, Proton, Lada, Dacia, Smart, Vauxhall, Lotus*, McLaren, Bugatti*, Koenigsegg, Pagani*, TVR*, Morgan*, Caterham*, Abarth*, Alpine, DS, Lincoln, Pontiac*, Oldsmobile, Plymouth, Hummer*, Saturn, Ram, DeLorean, Studebaker*, Trabant, Simca, Autobianchi, Holden, Daewoo, UAZ, Innocenti, De Tomaso, Spyker*, Wiesmann, Borgward*, NSU*, Rover, Zastava, Talbot.

**Dos sustituciones respecto al plan original** (no se encontró ningún logo real utilizable):
- **Panhard → Rover** (el escudo vikingo, ver §5.3).
- **Iso Rivolta → Talbot** (símbolo circular T moderno, limpio, sin texto).

**Errores de sourcing detectados y corregidos durante el proceso** (quedan documentados porque si se repite el proceso conviene evitarlos):
- Búsqueda de "UAZ logo" trajo por error el escudo de la Universidad Autónoma de Zacatecas (choque de siglas) — corregido buscando específicamente el fabricante ruso.
- Un archivo `Innocenti_1976.svg` pareció venir mal en una rejilla de previsualización a baja resolución (mezclado visualmente con otro logo) pero al revisarlo grande resultó ser correcto — era una confusión de la miniatura, no un error real de sourcing.
- Varios scripts de verificación (`titlecheck.js`, `enwiki_file.js`) daban falsos negativos con nombres de archivo que contienen paréntesis o espacios — cuando eso pasa, mejor consultar la API de Wikimedia directamente con `fetch` en vez de fiarse del script.

### 5.3 Revisión posterior: cambiar texto por símbolo real donde exista

El usuario, tras ver que Daewoo mostraba solo texto, pidió revisar **todas** las marcas de "fácil" (con nombre visible) por si alguna tenía en realidad un símbolo real sin texto que no se había encontrado la primera vez. Se hizo una pasada completa:

**Mejoras encontradas y aplicadas** (recortadas de un logo con texto+símbolo que ya se tenía, usando una máscara circular calculada por análisis de píxeles cuando el símbolo estaba dentro de un círculo con texto en el anillo exterior):
- **Plymouth**: el velero (Mayflower) estaba dentro de un círculo interior, con "PLYMOUTH" en el anillo exterior — aislado con máscara circular medida programáticamente (buscar el radio exacto del círculo interior analizando píxeles fila por fila). Resultado limpio, sin texto. Movido de fácil → difícil.
- **Rover**: foto real del escudo — "ROVER" estaba en una franja separada arriba del barco vikingo dorado — recortada esa franja, queda solo el barco. Movido de fácil → difícil.
- **Daewoo**: el logo de texto plano actual SÍ tiene una versión histórica (1978-1994) que es un símbolo real (óvalo tipo abanico/concha), encontrado en el infobox del artículo general "Daewoo" (no el de "Daewoo Motors"). Recortado el texto, movido de fácil → difícil.

**Confirmado que NO existe símbolo sin texto** (se quedan en fácil, tras búsqueda exhaustiva): Fiat, BMW, Nissan, Ford, Jeep, GMC, Porsche, Alfa Romeo, Lamborghini, Lancia, Peugeot, Land Rover, Mini, Aston Martin, Volvo, Kia, Saab, Isuzu, Daihatsu, Datsun, Scion, Genesis, Haval, BYD, MG, Tata, Mahindra, Lotus, Bugatti, Pagani, TVR, Morgan, Caterham, Abarth, Pontiac, Hummer, Studebaker, Spyker, Borgward, NSU.

**Sobre Fiat en concreto**: el usuario preguntó explícitamente si no sería mejor sustituir el texto plano por "algo como esto" (una imagen que resultó ser un badge circular genérico generado por IA, no un logo real de Fiat ni actual ni histórico). Le expliqué que el texto plano ES el logo oficial actual de Fiat (rediseño 2020) y que la imagen que compartió no era real. Se le dieron 3 opciones (usar el escudo histórico real / dejar el texto actual / inventar uno con IA) y **eligió dejarlo como está** — decisión importante: **no usar logos inventados por IA en ningún caso**, solo logos reales aunque sean de texto.

### 5.4 Estado final: 100/100 guardados en `assets/logos/*.png`

Verificado en navegador que las 100 rutas devuelven 200 y que el juego mezcla marcas antiguas y nuevas correctamente.

---

## 6. Dificultad en el modo Logos (fácil / medio / difícil)

Pedido explícito: igual que "Identifica el coche", con esta lógica de clasificación:
- **Fácil** = el nombre de la marca aparece en el logo (da igual lo rara que sea la marca, si lo puedes leer es fácil).
- **Medio** = solo escudo/símbolo, pero de una marca muy conocida (Mercedes, Toyota, Ferrari, Audi...).
- **Difícil** = solo escudo/símbolo, de una marca poco conocida (Zastava, UAZ, Innocenti, Trabant...).

**Implementación:**
- `js/data.js`: objeto `LOGO_DIFFICULTY` con las 100 marcas mapeadas a `"easy"|"medium"|"hard"`.
- `js/game.js`: `buildQuestions(mode, difficulty)` ahora recibe la dificultad; para `mode==="logo"` filtra `LOGO_BRANDS` por `LOGO_DIFFICULTY[b]===difficulty` antes de barajar.
- El listener del botón "Comenzar" (`document.querySelectorAll(".ignition[data-start]")`) lee el dial activo también para `mode==="logo"` (antes solo lo hacía para `"identify"`).
- HTML: el panel de Logos tiene los mismos 3 diales tipo cuentarrevoluciones que Identificar. **Los subtítulos bajo cada dial se quitaron** a petición del usuario (`.dial-sub` eliminado del panel de logos, pero sigue existiendo en el de Identificar con "±3/±2/±1 años").

**Recuento final tras las mejoras de §5.3**: 41 fácil / 28 medio / 31 difícil = 100.

---

## 7. Estilo visual: brillos, degradados y fondo animado

### 7.1 Primera versión (mockup en Artifact)

El usuario pidió ver primero un mockup ("Salpicadero Glow") antes de tocar código real — patrón ya establecido en la sesión (siempre mockup antes de implementar cambios visuales grandes). Se probaron dos fondos (rejilla técnica vs. plano tipo blueprint de coche) — el usuario prefirió la rejilla.

### 7.2 Implementación en la app real

- Fondo animado (`.app-bg`, fijo a toda la ventana — importante, ver §9): rejilla sutil (`repeating-linear-gradient`) + 3 manchas de luz difuminadas (`.blob-amber`, `.blob-info`, `.blob-amber-2`) + viñeta.
- Brillo ámbar en: título "COCHES", línea decorativa bajo el título, tarjeta de modo abierta, dial de dificultad activo, botón "Comenzar" (con pulso).
- Degradados: reflejo superior sutil en tarjetas (efecto chapa), degradado en el propio botón "Comenzar".

### 7.3 Ajuste de intensidad

El usuario dijo que el brillo estaba demasiado fuerte tras una iteración donde se había subido bastante — se bajó a un punto intermedio (valores finales en `css/styles.css`: buscar `ignitionPulse`, `.dial-card.active`, `.mode-card.open` para los box-shadow actuales).

### 7.4 Evolución del fondo animado (varias iteraciones)

1. **v1**: rejilla + manchas de luz, animación muy lenta (44s la rejilla, 26-38s las manchas) — el usuario dijo que "no se ve que se mueva", aburrido.
2. **v2**: se aceleraron las animaciones (rejilla a 20s, manchas a 14-19s) + se añadió un **barrido tipo aguja de gauge** girando (`conic-gradient` con dos cuñas de luz ámbar/azul rotando). El usuario no quedó convencido de la aguja.
3. **v3 (actual)**: el usuario propuso la idea — **focos de exhibición tipo salón del automóvil**, cayendo desde arriba, parpadeando de forma irregular como si tuvieran la conexión floja (no un pulso uniforme y limpio). Implementado como 3 elementos `.spotlight` (`radial-gradient` elíptico vertical desde arriba) con keyframes de parpadeo distintos e independientes (`flicker1/2/3`, con duraciones distintas 5.3s/6.2s/7.6s y patrones de opacidad irregulares con saltos bruscos, no una onda senoidal limpia).
4. Ajuste puntual: la mancha `.blob-amber` (arriba-izquierda) no parpadeaba, solo se movía — el usuario pidió que parpadeara igual que las demás → se le añadió la misma animación `flicker1`. Tras verlo, el usuario decidió que **mejor quitarla directamente** (el foco `.spotlight-1` de esa esquina ya cumplía la función) — **`blob-amber` fue eliminado por completo** (HTML y CSS).

**Estado actual del fondo**: rejilla + 3 focos parpadeantes (`spotlight-1/2/3`) + 2 manchas de luz que quedan (`blob-info`, `blob-amber-2`) + viñeta. Todo dentro de `.app-bg`, `position:fixed; inset:0` (cubre toda la ventana, no solo la columna de contenido — ver §9 sobre por qué esto es crítico).

Respeta `prefers-reduced-motion: reduce` (desactiva todas las animaciones del fondo).

---

## 8. Feedback de fallo: sacudida + destello rojo (los 3 modos)

Pedido: cuando fallas una respuesta (en cualquiera de los 3 modos), la pantalla se sacude un poco y/o parpadea en rojo. El usuario confirmó: **las dos cosas, en los 3 modos**.

**Implementación** (`js/game.js`, función `triggerFailFeedback()`):
```js
function triggerFailFeedback(){
  const screen = document.querySelector(".screen.active");
  if(screen){
    screen.classList.remove("shake");
    void screen.offsetWidth; // fuerza reflow para poder re-disparar la animación en fallos consecutivos
    screen.classList.add("shake");
  }
  const flash = document.getElementById("fail-flash");
  flash.classList.remove("active");
  void flash.offsetWidth;
  flash.classList.add("active");
}
```
Se llama desde `checkIdentifyAttempt()` (en cualquier fallo, no solo el último) y desde `checkSimpleAnswer()` (sonido/logos).

**⚠️ Bug importante encontrado y su lección** (relevante si se toca esto en el futuro): la sacudida se aplicaba originalmente a `#app` con `transform:translateX(...)`. Aplicar un `transform` a un elemento lo convierte automáticamente en el **contenedor de posicionamiento** de cualquier descendiente `position:fixed` (aunque tenga `overflow:visible`). Como `.app-bg` y `.fail-flash` son `position:fixed` y viven dentro de `#app`, durante los 0.4s de la sacudida quedaban encajonados dentro del ancho de `#app` (la columna de contenido) en vez de cubrir toda la ventana — se veía como si el destello rojo "se hiciera pequeño, tipo móvil" en pantallas anchas. **Solución**: la sacudida se aplica a `.screen.active` (que no envuelve a `.app-bg`/`.fail-flash`, son hermanos dentro de `#app`), no a `#app` mismo. CSS: `.screen.shake{ animation:appShake 0.4s ...; }`.

`.fail-flash` es un `div` fijo (`position:fixed; inset:0; z-index:5; pointer-events:none;`) con `radial-gradient` rojo (`rgba(217,105,90,...)`, el mismo tono que `--bad`) que anima su opacidad con `@keyframes failFlash` (sube y baja rápido).

---

## 9. Fondo a pantalla completa en escritorio (varias iteraciones, importante)

Problema original: en escritorio (pantallas anchas), toda la app vivía en una columna centrada de 480px máximo, con el fondo animado limitado a esa misma columna → se veía como una app móvil flotando en un vacío oscuro sin relación con el resto de la pantalla ancha.

**Fix 1 (aceptado)**: `.app-bg` pasó de `position:absolute` (relativo a `#app`) a `position:fixed; inset:0` (relativo al viewport completo) — así el fondo animado (rejilla, focos, manchas) cubre toda la ventana sin importar el ancho, independientemente de que el contenido siga en su columna. Este fix se mantiene y es la base de todo lo posterior.

**Fix 2 (rechazado)**: para el mismo problema mirado desde la pantalla de juego (no el menú), probé darle a `#app` un aspecto de "marco de móvil" en escritorio: tarjeta centrada con esquinas redondeadas, sombra, altura fija con scroll interno tipo simulador de teléfono. **El usuario lo rechazó explícitamente** ("no quería esto... quería que se viera normal, que se viera pantalla completa").

**Fix 3 (aceptado, actual)**: se quitó el "marco de móvil" y en su lugar el propio `#app` (la columna de contenido) crece de ancho con la pantalla, sin caja ni bordes visibles, fundiéndose con el fondo:
```css
#app{
  width:100%;
  max-width:clamp(480px, 60vw, 880px);
  min-height:100vh;
  ...
}
```
En móvil (`60vw` < `480px` en cualquier móvil real) el `clamp` siempre devuelve el mínimo 480px, pero como `#app` tiene `width:100%` y el viewport móvil ya es más estrecho que eso, el resultado es idéntico a antes del cambio — **móvil no se ve afectado por este clamp en ningún caso**, verificado repetidamente a lo largo de la sesión.

---

## 10. Zoom completo al fallar los 5 intentos (solo modo Identificar)

Pedido: si fallas los 5 intentos en "Identifica el coche", la imagen se aleja del todo (zoom a escala 1) y se ve el coche completo, como premio de consolación — **solo** en ese caso, no en los fallos intermedios ni si aciertas.

**Implementación**: `finishIdentifyQuestion(success)` ahora recibe un booleano:
```js
const img = document.getElementById("quiz-img");
if(img) img.style.transform = success
  ? `scale(${ZOOM_SCHEDULE[state.difficulty][MAX_ATTEMPTS-1]})`  // igual que antes: respeta el tope de dificultad
  : "scale(1)"; // fallo total: se ve el coche entero, salta el tope
```
Se llama `finishIdentifyQuestion(true)` en el caso de acierto y `finishIdentifyQuestion(false)` en el caso de agotar los 5 intentos. La transición ya existente (`transition:transform .5s ease` en `.scan-view img`) hace que el "alejado de cámara" se vea animado y suave.

---

## 11. Scroll automático a la imagen al fallar (solo modo Identificar)

Pedido, tras preguntar mi opinión primero: en **cada fallo** (no solo el último), la pantalla sube sola hasta la imagen, para que el jugador vea el recorte actualizado sin tener que desplazarse a mano (relevante sobre todo en móvil con el teclado abierto rellenando el formulario).

**⚠️ Lección técnica importante**: el método nativo `el.scrollIntoView({behavior:"smooth"})` **no es fiable** — en las pruebas dentro de esta herramienta de navegador automatizado nunca llegaba a moverse, porque `requestAnimationFrame` (y por tanto cualquier animación, incluida la smooth-scroll nativa) **se pausa en pestañas en segundo plano/no visibles** (`document.hidden === true`), algo que puede pasar también en WebViews de Android reales bajo ciertas condiciones. Por eso se implementó a mano con `requestAnimationFrame` + easing manual en vez de depender del comportamiento nativo:
```js
function scrollToStimulus(){
  const el = document.getElementById("stimulus-area");
  if(!el) return;
  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 12);
  const start = window.scrollY;
  const dist = target - start;
  if(Math.abs(dist) < 2) return;
  const duration = 450;
  const startTime = performance.now();
  function step(now){
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, start + dist * eased);
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
```
Se llama desde `checkIdentifyAttempt()` junto a `triggerFailFeedback()`, en el punto común a ambas ramas de fallo (intermedio y último intento).

---

## 12. Proporciones de las tarjetas de modo en escritorio

Efecto secundario del §9 (Fix 3): al crecer el ancho de `#app`, las miniaturas de las tarjetas de modo (`.mode-media`, antes fijas a 104×74px) se veían pequeñas en proporción a la tarjeta ahora más ancha. El usuario lo notó y preguntó si lo había cambiado yo (sí, indirectamente).

**Fix**: tamaños con `clamp()` en vez de píxeles fijos, para que crezcan proporcionalmente con la pantalla sin afectar a móvil (mismo razonamiento que el `clamp` de `#app`):
```css
.mode-media{ width:clamp(104px, 12vw, 136px); height:clamp(74px, 8.5vw, 97px); ... }
.mode-info h2{ font-size:clamp(1.05rem, 1.4vw, 1.22rem); ... }
.mode-info p{ font-size:clamp(0.72rem, 0.95vw, 0.85rem); ... }
.mode-head{ gap:clamp(14px, 1.4vw, 20px); padding:clamp(12px, 1.2vw, 16px); ... }
```

---

## 13. Patrones de trabajo del usuario (importante para continuidad)

- **Siempre pide ver primero mi opinión/propuesta antes de implementar** cambios visuales o de diseño grandes ("tú cómo lo harías", "dime qué opinas", "antes de hacer nada, dime cómo lo harías"). No hay que lanzarse a picar código sin ese paso en temas de diseño.
- **Mockups en Artifact antes de tocar la app real** para cambios visuales grandes (se estableció con "Salpicadero" y se ha repetido varias veces).
- **Siempre verificar en el navegador** (Browser pane) tras cada cambio, en escritorio y en móvil (`resize_window preset:"mobile"`), antes de dar el cambio por bueno — el usuario detecta rápido si no se ha probado.
- **Cache-busting**: todos los `<link>`/`<script>` de `index.html` llevan `?v=N`. Cada vez que se edita CSS/JS hay que subir el número (`sed -i 's/?v=N/?v=N+1/g' index.html`) o el navegador (y el propio Netlify) sirve versión cacheada vieja. **Número actual: v=19** (subir a v=20 en el próximo cambio de CSS/JS).
- **No usar nunca logos/imágenes inventados por IA como si fueran reales** — el usuario lo dejó clarísimo con el caso de Fiat. Todo el contenido del quiz tiene que ser real y verificable.
- **Rechaza soluciones "de más"**: cuando propuse el marco de teléfono en escritorio, lo rechazó por no ser lo que pedía — prefiere la solución más simple y directa a lo que pide literalmente, no una reinterpretación creativa.
- El usuario escribe en español informal, sin tildes muchas veces, mensajes cortos — hay que interpretar bien la intención pero sin sobre-elaborar la respuesta.
- Cuando pide "dame ideas" o pregunta mi opinión, espera 3-5 opciones concretas y una recomendación mía, no una lista interminable.

---

## 14. Pendientes / temporales conocidos

1. **Icono de Porsche en el menú** (`assets/ui/mode-logo.jpg`, marcado con comentario `<!-- TEMPORAL -->` en `index.html`) — el usuario dijo que lo cambiaría más adelante, sigue sin tocar.
2. **Foto c100 (Rolls-Royce Phantom VI)** en el dataset de 100 fotos tiene un problema de fondo confuso (cartel de museo) en el recorte de zoom — se ofreció arreglarlo aparte, el usuario no lo ha pedido todavía.
3. Nada más pendiente a día de hoy (11 sept. 2026) en lo que respecta a UI — el último hilo abierto (fondo animado) se cerró con la versión de "focos de exhibición".

---

## 15. Dónde está cada cosa

- `index.html` — estructura de las 3 pantallas (menú, juego, resultados), fondo animado, dial de dificultad ×2 (identificar y logos).
- `css/styles.css` — todo el sistema de diseño, animaciones de fondo, feedback de fallo, responsive.
- `js/data.js` — `BRAND_MODELS`, `BRANDS`, `ALL_MODELS`, `LOGO_ONLY_BRANDS`, `LOGO_BRANDS`, `LOGO_DIFFICULTY`, `CARS` (100 coches), `COUNTRIES`, `PART_FOCUS`, `ZOOM_SCHEDULE`, etc.
- `js/visuals.js` — `LOGO_FILE_BY_BRAND` (mapa marca→slug), `buildLogoUri()`, generación de imágenes placeholder de coche (`buildCarImageUri`, ya no usada para el modo logos).
- `js/game.js` — toda la lógica de juego: `buildQuestions`, `startRound`, `renderStimulus`, `checkIdentifyAttempt`, `checkSimpleAnswer`, `triggerFailFeedback`, `scrollToStimulus`, `finishIdentifyQuestion`, wiring de eventos al final del archivo.
- `js/autocomplete.js` — lógica de autocompletado genérica usada por marca/modelo/país.
- `js/audio.js` — sonidos del modo "Por sonido".
- `assets/logos/*.png` — los 100 logos reales (500×500, fondo crema `#f3eee3`).
- `assets/ui/*.jpg` — los 3 iconos de modo (imágenes del usuario, ChatGPT-generadas).
- `assets/` (resto) — las 100 fotos de coches reales de la fase anterior.

---

*Documento generado el 11 sept. 2026 a petición del usuario, antes de una compactación de contexto, para no perder el hilo de decisiones tomadas a lo largo de la sesión.*
