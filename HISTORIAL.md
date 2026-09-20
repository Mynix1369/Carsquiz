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
- **Cache-busting**: todos los `<link>`/`<script>` de `index.html` llevan `?v=N`. Cada vez que se edita CSS/JS hay que subir el número (`sed -i 's/?v=N/?v=N+1/g' index.html`) o el navegador sirve versión cacheada vieja. **Número actual: v=28** (subir en el próximo cambio de CSS/JS). Desde que hay despliegue continuo (§21), además hay que hacer `git add`+`commit`+`push` para que Vercel lo publique — el cache-busting por sí solo no sube nada a la web real.
- **No usar nunca logos/imágenes inventados por IA como si fueran reales** — el usuario lo dejó clarísimo con el caso de Fiat. Todo el contenido del quiz tiene que ser real y verificable.
- **Rechaza soluciones "de más"**: cuando propuse el marco de teléfono en escritorio, lo rechazó por no ser lo que pedía — prefiere la solución más simple y directa a lo que pide literalmente, no una reinterpretación creativa.
- El usuario escribe en español informal, sin tildes muchas veces, mensajes cortos — hay que interpretar bien la intención pero sin sobre-elaborar la respuesta.
- Cuando pide "dame ideas" o pregunta mi opinión, espera 3-5 opciones concretas y una recomendación mía, no una lista interminable.

---

## 14. Pendientes / temporales conocidos

Histórico de items ya resueltos, para referencia: icono de Porsche en el menú (resuelto conscientemente, ver §20), modo "Por sonido" con audio sintético (resuelto del todo, ver §22, incluida la ampliación a 60 y el sonido del día con base de datos).

**La lista de pendientes actuales vive en un solo sitio para no duplicar y desincronizar: ver §23 (al final del documento).**

---

## 15. Dónde está cada cosa

- `index.html` — estructura de las pantallas (menú, juego, resultados, clasificación), modal de login, fondo animado, dial de dificultad ×2 (identificar y logos), selector de idioma, insignia de cuenta.
- `css/styles.css` — todo el sistema de diseño, animaciones de fondo, feedback de fallo, responsive, estilos del modal de login y de la clasificación (podio F1).
- `js/data.js` — `BRAND_MODELS`, `BRANDS`, `ALL_MODELS`, `LOGO_ONLY_BRANDS`, `LOGO_BRANDS`, `LOGO_DIFFICULTY`, `CARS` (100 coches), `SOUND_CARS` (60 coches con sonido real, orden del array ya barajado a propósito una vez — ver §22.6/22.7), `COUNTRIES`, `PART_FOCUS`, `ZOOM_SCHEDULE`, `YEAR_TOLERANCE`, `SOUND_YEAR_TOLERANCE`, `DIFFICULTY_MAX_SCORE`, `SOUND_MAX_SCORE`, `SPEED_BONUS`, `SPEED_BONUS_FLOOR`.
- `js/i18n.js` — sistema de idiomas (inglés por defecto / español), `STRINGS`, `translateCountry/Model/Part`, `applyStaticI18n()`. Ver §16.
- `js/visuals.js` — `LOGO_FILE_BY_BRAND` (mapa marca→slug), `buildLogoUri()`, generación de imágenes placeholder de coche (`buildCarImageUri`, ya no usada para el modo logos).
- `js/game.js` — toda la lógica de juego: `buildQuestions`, `startRound` (ambas `async` por el sonido del día, ver §22.7), `renderStimulus`, `checkIdentifyAttempt`, `checkSimpleAnswer`, `triggerFailFeedback`, `scrollToStimulus`, `finishIdentifyQuestion`, `getTodaysSoundCar` (consulta/inserta en Supabase), bono de velocidad (`speedMultiplier`, `startSpeedTimer`), guardado de puntuación (`saveScoreIfLoggedIn`), wiring de eventos al final del archivo.
- `js/autocomplete.js` — lógica de autocompletado genérica usada por marca/modelo/país.
- `js/audio.js` — reproduce el mp3 real del "sonido del día" (ver §22).
- `js/supabase-config.js` — `SUPABASE_URL` / `SUPABASE_ANON_KEY` (públicas a propósito, protegidas por RLS).
- `js/auth.js` — cliente de Supabase, login/registro, perfil de usuario, edición de nombre.
- `js/leaderboard.js` — pantalla de clasificación diaria, pestañas de modo/dificultad, guardado con "mejor puntuación del día".
- **Tablas en Supabase**: `profiles` (nombre público), `scores` (una fila por usuario+modo+dificultad+día, restricción única + política de `UPDATE`), `daily_sound` (`played_on` date PK + `sound_id`, abierta a `anon` porque el modo sonido no exige login — ver §22.7).
- `assets/logos/*.png` — los 100 logos reales (500×500, fondo crema `#f3eee3`).
- `assets/ui/*.png` — los 4 iconos de menú (identificar, sonido, logos, clasificación), con fondo transparente — ver §20.
- `assets/sounds/*.mp3` — los 60 sonidos reales de motor (ver §22), recortados/normalizados con `ffmpeg`.
- `assets/` (resto) — las 100 fotos de coches reales de la fase anterior.

---

## 16. Sistema de idiomas (inglés por defecto / español)

Pedido: opción para cambiar de idioma, con inglés como predeterminado.

**Decisión de arquitectura**: el español se queda como valor **canónico interno** en `data.js` (nombres de marca, modelo, país) — no se duplican los datos en dos idiomas. `js/i18n.js` traduce solo lo necesario para mostrar en pantalla: un diccionario `STRINGS.en/es` para textos fijos, y mapas pequeños (`COUNTRY_EN`, `MODEL_EN`, `PART_EN`) para el puñado de valores de contenido que sí cambian entre idiomas (la mayoría de marcas/modelos son nombres propios válidos en ambos idiomas, no necesitan traducción).

- `localStorage` (`qc_lang`) recuerda el idioma elegido entre visitas.
- Textos estáticos vía `data-i18n="clave"` (se aplican en `applyStaticI18n()`), textos dinámicos vía `t("clave", {variables})`.
- **Validación de respuestas traducida**: en modo Identificar, si el idioma activo es inglés, `checkIdentifyAttempt()` compara lo que escribes contra `translateCountry()`/`translateModel()` del valor correcto, no contra el español canónico — así "United States" cuenta como correcto en inglés igual que "Estados Unidos" en español.
- **Selector de idioma solo en el menú principal** (no dentro de una partida en curso) — decisión deliberada para no tener que re-renderizar contenido de juego a medias generado dinámicamente.
- Las banderitas son **SVG dibujadas a mano**, no emoji — Windows no renderiza banderas emoji como banderas de colores (las muestra como código de país en texto), así que había que evitarlo.

---

## 17. Bono de velocidad estilo Kahoot

Pedido: puntos extra por responder rápido, ajustado a la dificultad.

**Decisión de diseño** (tras preguntar al usuario y que confirmara): la velocidad **no suma puntos aparte**, multiplica los puntos que ya ibas a ganar (×1 si respondes dentro de la ventana "completa", bajando en línea recta hasta ×0.5 en la ventana "cero"). Así el tope de ronda por dificultad (ver §18) se mantiene siempre como techo real, nunca se puede superar ni con máxima velocidad.

- Config en `data.js`: `SPEED_BONUS.identify/logo/sound`, cada uno con `{full, zero}` en segundos por dificultad (más tiempo cuanto más difícil, porque hay más que pensar/escribir). Subidos una vez porque el usuario los encontró demasiado ajustados en la primera versión.
- `SPEED_BONUS_FLOOR = 0.5` (multiplicador mínimo).
- Barra visual (`#speed-bar`, verde) bajo la cabecera del juego, con transición CSS que se vacía durante la ventana de bono completo — se reinicia en cada intento nuevo (`startSpeedTimer()`), no solo al principio de la pregunta.

---

## 18. Topes de puntuación por dificultad en "Identifica el coche"

Pedido: que fácil valga como máximo 100 puntos, medio 200, difícil 300 — para que la dificultad tenga peso real en la puntuación (antes daba igual la dificultad elegida, el tope era siempre 300).

**Técnica usada** (importante si se toca esto): la puntuación se acumula primero **sin escalar** en `state.rawScore` (máx. 50 pts/pregunta, igual que antes), y solo al guardar se convierte a la escala de la dificultad: `state.score = round(state.rawScore * scoreScale)`, donde `scoreScale = DIFFICULTY_MAX_SCORE[dificultad] / (IDENTIFY_ROUND_LENGTH * 50)`. Esto evita que el redondeo por pregunta deje la ronda perfecta corta o pasada del tope (probado: fácil/medio/difícil dan exactamente 100/200/300 en una ronda perfecta, no 99 ni 101).

---

## 19. Clasificación diaria con login (Supabase)

Pedido: tabla de clasificación que pida iniciar sesión, con puntuaciones separadas por día.

### 19.1 Decisiones tomadas (tras preguntar al usuario)

- **Backend**: Supabase (ya tenía cuenta por el proyecto de la clínica veterinaria) — proyecto nuevo y separado, no mezclado con ese otro proyecto.
- **Login**: email+contraseña **y** Google (Google acabó desactivado por un problema práctico, ver §19.4).
- **Anti-trampas**: ninguno a propósito — la puntuación se calcula 100% en el cliente y se manda tal cual, sin validar en servidor. Es una app para jugar con amigos, sin premio real, así que no compensa el esfuerzo extra ahora mismo.

### 19.2 Base de datos

Dos tablas en Supabase (proyecto `ekjqxqdzaaynedvhkwop`), con RLS activado:

- **`profiles`**: `id` (= `auth.users.id`), `display_name`. Políticas: cualquier usuario logueado puede leer todos los perfiles (para mostrar nombres en la clasificación), pero solo puede crear/editar el suyo propio.
- **`scores`**: `user_id`, `mode`, `difficulty` (**siempre con valor**, `'none'` en vez de `null` para el modo sonido — necesario para que la restricción única funcione, ya que en SQL `NULL` nunca es igual a `NULL`), `score`, `played_on` (por defecto `current_date`). Políticas: lectura abierta a logueados, inserción solo de tu propia fila.
- **Restricción única** `(user_id, mode, difficulty, played_on)` — garantiza que solo pueda haber **una fila por jugador y día** en cada combinación de modo+dificultad. Hubo que limpiar duplicados de las pruebas antes de poder crearla (`delete ... using ... where (a.score, a.id) < (b.score, b.id)`, quedándose con la mejor).
- **`saveScoreIfLoggedIn()`** (en `game.js`): antes de guardar, mira si ya hay una fila de hoy para ese modo+dificultad; si la nueva puntuación no mejora la existente, no hace nada; si la mejora (o no había ninguna), hace `upsert` con `onConflict` sobre la restricción única. **Se puede jugar todas las veces que se quiera** — solo se guarda/actualiza si superas tu propio récord del día, y en la clasificación siempre aparece una única fila por jugador.
- ⚠️ **Bug encontrado y corregido**: al principio faltaba la política RLS de `UPDATE` en `scores` (solo había `SELECT` e `INSERT`), así que el `upsert` fallaba silenciosamente en el caso de actualización con error `42501` (row-level security). Añadida la política que faltaba.

### 19.3 Flujo de guardado si juegas sin sesión iniciada

Botón de resultados **"Save score & view leaderboard"** (antes decía solo "Ver clasificación"): si no has iniciado sesión, abre el login y, en cuanto entras, guarda automáticamente la puntuación de la ronda que acabas de jugar (aunque ya hubiera terminado) antes de llevarte a la clasificación — usando un flag `pendingScoreSave` en `leaderboard.js` que se limpia si cierras el modal sin loguearte, para no arrastrarlo a un login posterior no relacionado.

### 19.4 Login con Google: configurado pero desactivado

Se dejó todo el código listo (botón, flujo OAuth) pero **oculto con `class="hidden"`** porque, al intentar crear las credenciales OAuth en Google Cloud Console con la cuenta del usuario (15 años), Google exigía activar una cuenta de facturación de pago (tarjeta) para continuar — no relacionado con el login en sí, sino con una política de edad de Google Cloud específicamente. Se decidió no meter datos de pago para esto. Queda pendiente por si el usuario quiere retomarlo con una cuenta de Google sin esa restricción, o con un adulto delante.

**Nota de sourcing de rate-limit**: durante las pruebas se agotó varias veces el límite gratuito de envío de correos de confirmación de Supabase — se resolvió desactivando "Confirm email" en Authentication → Settings (registro instantáneo, sin correo de por medio; razonable para una app de amigos sin datos sensibles).

### 19.5 Nombre de usuario

Campo "username" en el formulario de registro (solo visible en modo "Sign up"), guardado en `user_metadata.display_name` de Supabase y usado como nombre del perfil en vez del email. También editable en cualquier momento con el icono de lápiz junto al nombre en la cabecera del menú (edición inline, guarda en `profiles.display_name` al perder el foco o pulsar Enter).

### 19.6 Diseño de la clasificación: estilo podio F1

Pedido explícito de rediseño ("aburrido... tipo la tabla de F1"). Implementado con moderación (sin pasarse de elaborado, para no romper el estilo minimalista del resto de la app): barra de color a la izquierda de cada fila (oro/plata/bronce para el top 3, gris neutro el resto), número de posición más grande y coloreado a juego en el podio, puntuación en una pastilla remarcada. Fila propia marcada con un anillo interior ámbar + etiqueta "YOU"/"TÚ", independiente del color del podio (se pueden combinar si vas primero).

---

## 20. Iconos de menú: de JPG con fondo sólido a PNG transparente

Los 3 iconos originales (identificar/sonido/logos) eran JPG con fondo oscuro sólido "horneado" en la imagen. El usuario los regeneró con fondo transparente real (PNG con canal alfa) y pidió sustituirlos, más uno nuevo a juego para la tarjeta de clasificación (trofeo con degradado dorado-bronce).

- Los 4 archivos venían de la carpeta de Descargas del usuario — **importante**: no hay forma de acceder directamente a una imagen que el usuario pega en el chat (solo se puede "ver" para describirla/recrearla en SVG, no guardarla como archivo). Si el usuario quiere que se use un archivo real, tiene que guardarlo él mismo en el ordenador y pasar la ruta.
- `assets/ui/mode-identify.jpg/mode-sound.jpg/mode-logo.jpg` → `.png` (mismas composiciones, mismo `object-fit:cover` en CSS, sin necesidad de tocarlo — el recorte queda igual, solo cambia que ahora el hueco se rellena con el fondo oscuro de la tarjeta en vez de un color horneado).
- Nuevo `assets/ui/mode-leaderboard.png` (trofeo) sustituye al SVG que se había dibujado a mano como solución provisional para esa tarjeta.
- JPGs viejos borrados del repositorio (`git rm`) al quedar sin uso.

---

## 21. Despliegue: de Netlify Drop a GitHub + Vercel (continuo)

El despliegue anterior (Netlify Drop, §4) exigía subir la carpeta a mano cada vez. El usuario pidió que se actualizara solo.

- Repositorio creado sin querer por el usuario mientras buscaba Supabase (confundió Supabase con GitHub Projects) — se aprovechó ese mismo repo (`Mynix1369/Carsquiz`) en vez de crear uno nuevo, a petición del usuario.
- `git init`, commit inicial con todo el proyecto (excepto un par de PNG sueltos sin usar que había en la raíz), `git remote add origin` + `git push`. Las credenciales de GitHub ya estaban cacheadas en el Git Credential Manager de Windows, no hizo falta login manual.
- Conectado a Vercel (Import Project → repo de GitHub, framework "Other", sin build command). Cada `git push` a `main` despliega solo en 1-2 minutos.
- **URL de producción**: `carsquiz.vercel.app` (también responde en `carsquiz-mr98.vercel.app`, alias del mismo despliegue).
- El sitio de Netlify sigue existiendo pero **ha quedado desactualizado/abandonado** — todo el trabajo desde este punto se publica solo en Vercel.
- Flujo de trabajo establecido de aquí en adelante: editar → probar en local (`preview_start` de este entorno) → `git add` + `git commit` + `git push` → verificar en `carsquiz.vercel.app`.

---

## 22. Modo "Por sonido": rediseñado como reto diario con grabaciones reales

Rediseño grande a petición del usuario: antes generaba pitidos sintéticos (Web Audio API, patrón por hash de `id`+`brand`, sin relación real con el motor) y solo pedía adivinar la marca. Ahora usa grabaciones reales y pide los mismos 4 campos que "Identifica el coche".

### 22.1 Decisiones (tras preguntar al usuario, 3 preguntas concretas)

- **Estructura de la ronda**: como Identificar — una sola "pregunta" (el sonido de hoy), hasta 5 intentos, mismos campos (marca/modelo/país/año), mismo feedback por intento. No hay "8 preguntas por ronda" porque solo hay un sonido al día.
- **Repeticiones**: **un intento real al día, estilo Wordle** — una vez jugado (o simplemente al volver a intentarlo el mismo día), se bloquea hasta el día siguiente. Se avisó de la alternativa (repetible, como el resto de modos) pero se descartó a propósito para que tenga gracia de "reto del día".
- **Dificultad**: sin niveles — un único sonido para todo el mundo cada día, con tolerancia de año fija (±3, el punto intermedio de Identificar) y puntuación máxima fija (100 pts, igual que el tope de "fácil" en Identificar), repartidos 100/80/60/40/20 según el intento.

### 22.2 Sourcing de los sonidos reales

39 grabaciones reales de motor, todas de **Wikimedia Commons** (`Category:Sounds of automobiles` + subcategorías de Porsche y de coches de carreras), con licencias CC BY / CC BY-SA / dominio público — verificadas una a una vía la API de Wikimedia (`imageinfo` con `extmetadata`) antes de descargar, igual que se hizo con los logos.

- La mayoría son de un mismo contribuidor sistemático de Commons (**Edvvc**, CC BY-SA 3.0), que grabó decenas de coches de exhibición (Ferrari, Lamborghini, Porsche, McLaren, Aston Martin...) siempre con el mismo formato — de ahí que hubiera tanto donde elegir.
- **Herramientas usadas** (ninguna estaba instalada, hubo que montarlas): `ffmpeg` vía el paquete npm `ffmpeg-static` (trae un binario portátil de Windows, no hace falta instalar nada a nivel de sistema) para recortar (~8s por clip, evitando el primer medio segundo de silencio), aplicar fade in/out y `loudnorm` (volumen consistente entre clips), y convertir a **mp3 mono 96kbps** — necesario porque el formato original de Commons es `.ogg`/`.opus`, que **no se reproduce en Safari/Chrome de iOS** (sin soporte de Ogg Vorbis en WebKit), a diferencia de mp3 que funciona en todos los navegadores.
- **Países**: limitado a propósito a los 10 países que ya existen en `COUNTRIES` (no se tocó esa lista) — se descartaron candidatos igual de buenos como Spyker (Países Bajos) o Lada (Rusia) por no encajar, en vez de ampliar el sistema de países para esto.
- **Selección de marca/modelo/año**: se sacó de los propios nombres de archivo de Commons (p. ej. `Ferrari 599 GTO.ogg`, `Peugeot 207 S2000 (2010).ogg`), sin inventar nada — mismo principio de "todo tiene que ser real y verificable" que el resto del proyecto.
- **⚠️ Problemas técnicos encontrados al automatizar la descarga/conversión** (documentados por si se repite el proceso):
  - Descargar los 40 archivos en paralelo/rápido disparó un `HTTP 429` (rate limit) de `upload.wikimedia.org` a partir del 11º archivo — solución: reintentos con backoff y una pausa de ~2.5s entre descargas.
  - Un script de bash que mezclaba `node -e "..." | while read ...` con llamadas a `ffmpeg` **dentro** del bucle rompía la lectura del pipe (ffmpeg consume stdin por defecto) — solución: `ffmpeg -nostdin` en todas las llamadas, y volcar la lista a un fichero temporal en vez de leer directamente de un pipe.
  - `grep -P` (regex tipo Perl) fallaba con "supports only unibyte and UTF-8 locales" en este Git Bash de Windows pese a tener `LC_CTYPE=C.UTF-8` — solución: usar `grep -oE` (regex extendida POSIX, sin `\K`) en su lugar.

### 22.3 Rotación diaria (versión inicial, ya sustituida — ver §22.7)

Primera versión de `getTodaysSoundCar()` en `game.js`: `SOUND_CARS[Math.floor(Date.now()/86400000) % SOUND_CARS.length]`. Determinista y sin servidor, todo el mundo calcula el mismo índice a partir de la fecha. **Esta versión se sustituyó más tarde** porque el usuario cayó en la cuenta de un problema: al ser el array de longitud fija, el patrón se repite exactamente igual cada vuelta completa (cada 39, luego 60, días) — cumple el "mínimo de 30 días" pero no es aleatorio a largo plazo, alguien que jugara varios meses acabaría notando el patrón. Ver §22.7 para la solución final (con base de datos).

**Un intento real al día**: se guarda en `localStorage` (`qc_sound_state`, con la fecha y la puntuación) al terminar la ronda. Si vuelves a intentar el mismo modo el mismo día, `startRound()` detecta el estado guardado y muestra directamente la pantalla de resultados de ese intento (con el botón "Jugar otra vez" oculto) en vez de dejar jugar otra vez — funciona **independientemente de si has iniciado sesión**, es una regla del propio juego, no de la cuenta.

### 22.4 Reutilización de la lógica de "Identifica el coche"

En vez de duplicar código, se generalizaron las funciones ya existentes para que sirvan a ambos modos:
- `renderIdentifyForm` / `checkIdentifyAttempt` ahora se usan también para `state.mode === "sound"` (antes solo `renderSimpleForm`/`checkSimpleAnswer`, que ahora quedan solo para el modo Logos).
- Nueva función `currentYearTolerance()`: devuelve `YEAR_TOLERANCE[state.difficulty]` en Identificar o `SOUND_YEAR_TOLERANCE` (fijo, 3) en Sonido — evita duplicar la lógica de tolerancia.
- La escala de puntuación (la técnica del §18, acumular en `rawScore` sin escalar y convertir solo al final) se generalizó con `roundMaxRaw`/`targetMaxScore` en vez de asumir siempre `IDENTIFY_ROUND_LENGTH*50` → `DIFFICULTY_MAX_SCORE`; para sonido es simplemente `50 → 100` (una sola "pregunta").
- `updateScanMeta(q)` (el zoom/crop de la foto) solo se llama si `state.mode === "identify"` — si se llamaba también en modo sonido rompía, porque `ZOOM_SCHEDULE[null]` no existe (el modo sonido no tiene dificultad).
- **⚠️ Bug encontrado en la primera pasada**: se me olvidó actualizar `checkAnswer()` (el router que decide si llamar a `checkIdentifyAttempt` o `checkSimpleAnswer`), así que aunque el formulario ya mostraba los 4 campos correctamente, seguía comprobando y puntuando solo por marca (usando `checkSimpleAnswer`, que ignora modelo/país/año). Se detectó de inmediato al probar en el navegador (el mensaje de "correcto" no era el de Identificar) y se corrigió.
- `js/audio.js` se simplificó del todo: ya no sintetiza nada, solo reproduce el mp3 real de `q.car.sound` con un `<audio>` normal.

### 22.5 Revisión de calidad: modo de prueba temporal + bug grave encontrado

El usuario escuchó los 39 sonidos y reportó varios problemas concretos: el del día (Opel Corsa, un "startup sound" de 4s) apenas se oía acelerar; y al pedir que se revisaran todos, otros 6 salieron mal — 4 **completamente en silencio** (Mercedes-Benz W154, Maserati GranTurismo S, Volkswagen Escarabajo, Honda S2000) y 2 cortados a los ~2 segundos (Scirocco R, Porsche 911R).

**Modo de prueba temporal** (`SOUND_TEST_MODE` en `game.js`, ya eliminado del todo, ver §22.6): mientras se revisaba, se añadió un flag que hacía que cada "Comenzar" en Sonido diera un sonido distinto (en orden s1, s2, s3... a petición del usuario, para poder auditar sistemáticamente) sin bloquear tras jugarlo y sin guardar en la clasificación real, más un botón "Siguiente sonido" que mostraba el nombre del coche en pantalla para no tener que rellenar el formulario cada vez. Patrón reutilizable si hiciera falta auditar contenido de nuevo en el futuro.

**⚠️ Causa real del bug (importante si se vuelve a tocar el pipeline de audio)**: al recortar con `ffmpeg -i origen -ss OFFSET -t DURACION` (seek de **salida**, después de `-i`, elegido originalmente por ser más preciso a nivel de frame), el filtro `afade=t=out:st=X` no reseteaba su reloj interno al punto de corte — seguía contando desde la marca de tiempo **absoluta** del archivo original. Con un `OFFSET` grande (p. ej. 21.5s), el filtro consideraba que el fundido de salida (pensado para “X segundos relativos al recorte”) ya había pasado hacía rato para *todo* el recorte, dejándolo en silencio total; con un `OFFSET` mediano (~5-7s), el fundido se disparaba solo 1-2 segundos después de empezar, cortando el clip antes de tiempo. Los recortes con `OFFSET` casi cero (la mayoría, formato típico de "revienta el motor para la cámara" del contribuidor Edvvc) no lo sufrían, por eso pasó desapercibido en la primera tanda.

**Diagnóstico**: se aisló probando el mismo recorte con y sin cada filtro por separado (`-af "afade=t=out:..."` solo, sin `loudnorm` ni `afade in`) hasta confirmar que el fundido de salida por sí solo ya producía silencio; y comparando `-ss` antes vs. después de `-i` con los mismos parámetros — con `-ss` **antes** de `-i` (seek de entrada, que sí resetea la marca de tiempo a 0 para el stream recortado) el mismo fundido funcionaba bien.

**Arreglo aplicado a los 39 (y reutilizado para los 21 nuevos de §22.6)**: mover `-ss` a antes de `-i` en todos los recortes, y **verificar cada archivo de salida** con `ffmpeg -af volumedetect` tras generarlo (en vez de fiarse de que `ffmpeg` no diera error) — el propio script marca con `⚠️ SILENCIO` cualquier salida con `mean_volume` por debajo de -60dB, para detectar este tipo de fallo automáticamente la próxima vez. Además, para los clips más largos (probablemente con un tramo de ralentí/preparación antes de la parte interesante), en vez de adivinar un punto de corte se escanea el volumen medio en varias ventanas a lo largo de todo el archivo (`ffmpeg -af volumedetect` repetido cada ~10% de la duración) y se elige la ventana más alta.

### 22.6 Ampliación a 60 sonidos

A petición del usuario ("añade hasta que hayan 60"), se sourceó otra tanda de 21 sonidos reales más, mismo proceso (Wikimedia Commons, licencia verificada por API antes de descargar, pipeline corregido de §22.5). Se aprovechó para meter marcas que no estaban representadas todavía en el modo sonido: **Alpine, Bentley, De Tomaso, Pagani, Dodge** — más variedad extra para marcas ya presentes (segundo/tercer Ferrari, Audi, BMW, Ford, Jaguar, Alfa Romeo, Skoda, Toyota, Porsche...). Los 21 pasaron la misma verificación de "no silencio" antes de darlos por buenos. Total: **60 sonidos** en `SOUND_CARS`.

### 22.7 Sonido del día "de verdad" aleatorio: tabla en Supabase

El usuario cayó en la cuenta del problema de fondo de §22.3: con un array de longitud fija recorrido por fecha, el patrón entero se repite igual cada vuelta (cada 60 días desde la ampliación) — cumple "mínimo 30 días" pero no es aleatorio de verdad a largo plazo. Como ya había base de datos montada (Supabase, del sistema de clasificación), se aprovechó para resolverlo bien en vez de con otro parche determinista.

**Solución**: nueva tabla `daily_sound` (`played_on` date como clave primaria, `sound_id`). `getTodaysSoundCar()` (ahora `async`, igual que `buildQuestions()` y `startRound()` que la llaman) hace:
1. Busca si ya hay fila para la fecha de hoy — si la hay, usa ese `sound_id` (así todo el mundo ve el mismo sonido el mismo día).
2. Si no la hay, mira qué `sound_id` han salido en los últimos 30 días (consulta con `played_on >= hoy-30`), calcula el conjunto de sonidos "elegibles" (los que no han salido en ese margen) y elige uno **de verdad al azar** de ahí.
3. Inserta esa elección como la fila de hoy.

**Condición de carrera** (dos personas pidiendo el sonido del día casi a la vez): como `played_on` es la clave primaria, si dos clientes intentan insertar su elección para la misma fecha, el segundo `insert` falla con `23505` (violación de clave única) — se captura ese error concreto y, en vez de tratarlo como un fallo, se vuelve a leer la fila (que ya existe, la insertó el otro cliente primero) y se usa esa. Probado en local forzando el conflicto a mano (insertando dos veces la misma fecha) para confirmar que Supabase responde con ese código exacto.

**Red de seguridad**: si Supabase no está configurado o la consulta falla por cualquier motivo, cae de vuelta al reparto determinista antiguo (`SOUND_CARS[epochDay % length]`) para que el modo sonido nunca se quede sin poder jugarse — mismo patrón defensivo que ya se usa en `auth.js` para cuando `js/supabase-config.js` no tiene credenciales reales.

**Políticas RLS de `daily_sound`**: `SELECT` e `INSERT` abiertas a `anon` además de `authenticated` — a diferencia de `profiles`/`scores`, el modo sonido se puede jugar **sin haber iniciado sesión**, así que esta tabla tiene que ser legible/escribible también para visitantes sin cuenta.

### 22.8 Crédito de la grabación

Al revisar qué le faltaba a la app (pregunta directa del usuario), se detectó que el modo sonido nunca mostraba `q.car.credit` en pantalla — a diferencia de Identificar, que sí muestra el crédito de la foto (`.photo-credit`). Dado que las licencias CC BY / CC BY-SA de Wikimedia **exigen atribución**, esto no era solo un problema de consistencia visual sino un hueco real de cumplimiento de licencia. Arreglado reutilizando la misma clase `.photo-credit` en el bloque de sonido de `renderStimulus()`.

### 22.9 El sonido seguía sonando al salir de la pantalla

Bug reportado por el usuario: si reproducías el sonido del día y salías de esa pantalla (botón "X", o al pasar a resultados) antes de que terminara el clip, se quedaba sonando de fondo — `playCarSound()` (`js/audio.js`) solo paraba el clip **anterior** al arrancar uno nuevo, nunca al abandonar la pantalla sin más.

**Arreglo**: nueva función `stopCarSound()` en `audio.js` (pausa y resetea `currentAudioEl.currentTime`), reutilizada tanto por `playCarSound()` (antes de arrancar un clip nuevo, como ya hacía) como llamada desde `showScreen()` en `game.js` cada vez que la pantalla de destino **no** es `screen-game` — así cualquier forma de salir de la pregunta (salir al menú, terminar la ronda, lo que sea) corta el audio sin tener que acordarse de llamarlo a mano en cada sitio.

### 22.10 Controles de reproducción: play/pausa/repetir, sin autoplay, botón centrado

El usuario pidió dos cambios seguidos sobre el reproductor del modo sonido, hechos "poco a poco" en la misma sesión:

**1. Play/pausa/repetir, sin reproducción automática al entrar.** Hasta ahora `playCarSound(car)` (en `audio.js`) creaba un `Audio` nuevo y lo reproducía inmediatamente en cuanto se entraba en la pregunta, con un único botón de "play" que no reflejaba si estaba sonando o no. Se rediseñó de raíz:
- `audio.js` pasó de una sola función (`playCarSound`) a cuatro: `loadCarSound(car)` (prepara el clip sin reproducirlo, engancha los listeners `play`/`pause`/`ended` a un callback opcional `onAudioStateChange`), `togglePlayPauseCarSound()`, `replayCarSound()` (resetea `currentTime` a 0 y reproduce) y `stopCarSound()` (sin cambios, ver §22.9).
- `renderStimulus()` (en `game.js`, rama de sonido) ahora monta dos botones — `#play-pause-btn` (con dos SVG superpuestos, play/pausa, alternados con la clase `.hidden` existente) y `#replay-btn` — y llama a `loadCarSound(q.car)` en vez de reproducir directamente. `onAudioStateChange` se conecta a una nueva función `updatePlayPauseIcon(state)` que alterna qué icono se ve y actualiza el `title`/`aria-label` según esté sonando, en pausa o haya terminado (evento `ended`).
- Nuevas claves de idioma `playLabel`/`pauseLabel`/`replayLabel` (EN y ES) en `i18n.js`, usadas como accesibilidad (`title`/`aria-label`) de los botones.
- Verificado en el navegador con lecturas directas de `currentAudioEl.paused`/`currentTime`: no suena nada al entrar (`paused:true` desde el principio), el botón de play alterna a pausa y viceversa, repetir vuelve a 0 y reproduce, y al llegar al final el icono vuelve solo a "play" (evento `ended`).

**2. Centrar el botón de play, encoger y desplazar el de repetir.** El usuario notó que el conjunto de los dos botones no quedaba centrado en la caja (al estar en una fila `flex` con `gap`, el par entero se centraba, no el botón de play en concreto). Arreglado en `styles.css`: `.sound-controls` pasó a `position:relative` con el botón de play como único elemento en el flujo normal (así `justify-content:center` sí lo centra a él solo), y `.replay-btn` pasó a `position:absolute` (desplazado a la derecha del centro) y se redujo de 44px a 40px. Verificado midiendo con JS que el centro horizontal del botón de play coincide exactamente con el centro de `.sound-box`.

### 22.11 El "un intento al día" del sonido no cruzaba de aparato

El usuario detectó que podía jugar el sonido del día dos veces: una desde el ordenador y otra desde el móvil. Causa: `getSoundPlayState()`/`saveSoundPlayState()` (§22.4) solo miran el `localStorage` del navegador donde se juega — cada aparato tiene el suyo, así que no hay forma de que uno sepa que el otro ya jugó.

**Arreglo**: nueva función `alreadyPlayedSoundToday()` en `game.js`. Si hay sesión iniciada, consulta primero la tabla `scores` (la misma que usa la clasificación) buscando una fila de hoy para ese `user_id` en modo sonido — si existe, se usa esa (viene de cualquier aparato donde ese usuario haya jugado y guardado su puntuación, no solo el actual). Solo si no hay sesión iniciada cae al `localStorage` de siempre, porque sin cuenta no hay manera de identificar al jugador entre aparatos — limitación inherente a que el modo sonido se pueda jugar sin iniciar sesión, no algo que se pueda arreglar del todo sin exigir login.

Probado sustituyendo temporalmente `isLoggedIn`/`currentUser`/`sb` en la consola por versiones simuladas (sin tocar la base de datos real) para forzar los cuatro casos: sin sesión sin registro, sin sesión con registro local, con sesión sin fila en el servidor, y con sesión con fila en el servidor pero `localStorage` vacío (el caso que antes fallaba, simulando "otro aparato") — los cuatro se comportaron como se esperaba.

### 22.12 Clasificación general por modo

El usuario pidió una clasificación general de cada modo, con opción de filtrar por dificultad, señalando el motivo: en "Identifica el coche" difícil da hasta 3x más puntos que fácil por el mismo acierto (100/200/300 de máximo, `DIFFICULTY_MAX_SCORE`), así que comparar puntos en bruto entre dificultades no es justo — quien juega en fácil nunca podría competir con quien juega en difícil aunque lo haga perfecto.

**Primera versión**: nueva pestaña "General" en `leaderboard.js` (ahora la primera y la que se abre por defecto), junto a las ya existentes Fácil/Medio/Difícil. En la vista General, la consulta a `scores` ya no filtra por dificultad — trae todas las filas de hoy para ese modo y convertía cada puntuación a "% de la puntuación máxima posible en su propia dificultad" antes de comparar.

**Ajustes pedidos por el usuario, en dos pasadas**: primero cambiar el "%" por puntos (se probó reescalando cada puntuación a "equivalente en difícil" usando la proporción 100/200/300, para que siguiera siendo justo pero mostrado como puntos normales); después el usuario pidió ir más allá y **quitar el cálculo del todo** — la versión final de "General" no reescala ni normaliza nada: simplemente coge la puntuación en bruto más alta de cada jugador entre fácil/medio/difícil ese día y ordena por ahí. Cada fila sigue mostrando una etiqueta con la dificultad de esa puntuación. Las pestañas Fácil/Medio/Difícil no han cambiado (puntos en bruto, ya son justas dentro de una misma dificultad).

Verificado en las tres versiones con datos simulados (sustituyendo `sb.from` en consola, sin tocar la base de datos real): agrupar por jugador y quedarse con el mejor resultado, con el orden final coincidiendo con lo calculado a mano en cada caso (cinco jugadores de ejemplo), más una captura de pantalla de la pestaña General con el podio y las etiquetas de dificultad.

### 22.13 Puntuación de Logos escalada por dificultad, con bono de tiempo

El usuario pidió que "Logos" tuviera un sistema de puntuación como el de "Identifica el coche": máximo de 100/200/300 según la dificultad, y que contara el tiempo. Hasta ahora `checkSimpleAnswer()` daba siempre `POINTS_SIMPLE` fijo (20 pts) por acierto, así que las 8 preguntas de la ronda valían 160 pts sin importar la dificultad elegida — difícil (logos poco conocidos, sin el nombre de la marca) no daba más recompensa que fácil pese a costar más. El bono de velocidad (`SPEED_BONUS.logo`) ya existía desde antes, pero al aplicarse sobre un máximo fijo no se notaba tanto como en Identificar.

**Arreglo**: se reutiliza directamente `DIFFICULTY_MAX_SCORE` (100/200/300, la misma constante que ya usa Identificar) repartido entre las `SIMPLE_ROUND_LENGTH` (8) preguntas de la ronda, con el mismo patrón de "acumular en bruto y redondear solo al restar del total ya mostrado" que ya se usaba en `checkIdentifyAttempt()` (así una ronda perfecta y rápida cae siempre exacta en el máximo, sin que el redondeo por pregunta la deje corta). `POINTS_SIMPLE` se eliminó por quedar sin uso. En `endRound()`, el cálculo del máximo para mostrar en resultados pasó a tratar "identify" y "logo" igual (`DIFFICULTY_MAX_SCORE[state.difficulty]`).

Verificado en el navegador simulando rondas completas por consola (rellenando la marca correcta y llamando a `checkAnswer()`/`nextQuestion()` para las 8 preguntas): una ronda perfecta y rápida da exactamente 100/200/300 según la dificultad, y forzando `state.attemptStartTime` muy atrás en el tiempo (fuera de la ventana del bono) para simular respuestas lentas, la puntuación cae justo en la mitad del máximo (el suelo del bono, `SPEED_BONUS_FLOOR = 0.5`) — comprobado con capturas de pantalla de la última pregunta y de la pantalla de resultados.

### 22.14 Zoom de móvil pillado al usar el teclado

El usuario reportó el mismo bug que ya había aparecido (y arreglado) en su otro proyecto, la clínica veterinaria: en móvil, al enfocar ciertos campos (p. ej. el de cambiar el nombre de usuario) Safari/Chrome hacían zoom automático y a veces se quedaba pillado al cerrar el teclado, sin volver a la vista normal. Causa: es un comportamiento estándar de los navegadores móviles al enfocar un `<input>` cuya letra mide menos de 16px — y aquí había varios: `.field input` (marca/modelo/país/año, 15.2px), `.account-name-input` (11.2px) y `#auth-email-form input` (login, 14.4px).

**Arreglo**: mismo patrón ya validado en la clínica veterinaria — una regla en `styles.css` con `@media (max-width: 639px){ input, select, textarea{ font-size:16px !important; } }`, para que en pantallas de móvil ningún campo baje de 16px y el navegador no tenga motivo para hacer zoom. Hizo falta `!important` (a diferencia del otro proyecto) porque aquí los inputs afectados ya tenían su propio `font-size` fijado con selectores más específicos que un simple `input`. Deliberadamente **no** se tocó el `<meta viewport>` ni `user-scalable=no`, porque eso desactivaría el pinch-zoom para todo el mundo en vez de arreglar la causa real.

Verificado emulando viewport de móvil (375px) y leyendo `getComputedStyle(...).fontSize` de los tres inputs afectados (16px los tres, antes 15.2/11.2/14.4px) y confirmando que en escritorio no cambia nada (`.field input` sigue en 15.2px fuera del media query).

### 22.15 Idioma inicial según el navegador

El usuario pidió que el idioma por defecto (antes siempre inglés hasta que se tocara el selector EN/ES a mano) se detectara solo la primera vez: español si el navegador es de un país/idioma hispanohablante, inglés para cualquier otro.

**Arreglo**: nueva función `detectBrowserLang()` en `i18n.js` que mira `navigator.language` (el idioma principal configurado en el navegador/sistema) y devuelve `"es"` si empieza por "es" (`es-ES`, `es-MX`, `es-419`...) o `"en"` en cualquier otro caso. La línea `let currentLang = localStorage.getItem("qc_lang") || "en";` pasó a `|| detectBrowserLang()` — la detección solo entra en juego la primera vez, antes de que exista una preferencia guardada; en cuanto el usuario toca el selector EN/ES una vez, esa elección manda siempre a partir de ahí sin importar lo que diga el navegador.

Verificado en el navegador simulando `navigator.language` con `Object.defineProperty` para varios códigos (`es-ES`, `es-MX`, `es-419` → español; `en-US`, `fr-FR`, `de-DE`, `pt-BR`, `ca-ES` → inglés) y confirmando que, con una preferencia ya guardada en `localStorage`, esa preferencia sigue ganando sin importar el idioma del navegador.

---

## 23. Pendientes conocidos a día de hoy (12 sept. 2026, última revisión)

1. **Login con Google** — sigue oculto (`class="hidden"`), ver §19.4. Pendiente de que el usuario decida retomarlo con una cuenta sin restricción de edad para Google Cloud, o dejarlo aparcado.
2. ~~Sitio de Netlify abandonado~~ — **resuelto**, el usuario lo borró (ver §22.20 para el reemplazo: dominio propio `carquiz.app` conectado a Vercel).
3. **Foto c100 (Rolls-Royce Phantom VI)** — fondo de museo confuso en el recorte de zoom, ofrecido arreglar hace tiempo, nunca pedido.
4. ~~Sin probar a fondo en móvil real~~ — el usuario confirmó (13 sept. 2026) que ya la ha probado en su móvil de verdad; de ahí salió el bug del §22.22 (badge de cuenta invisible en pantallas estrechas), ya arreglado.
5. **Objetivo final declarado desde el principio del proyecto** (empaquetar con Capacitor para iOS/Android) — sigue sin empezar. Haría falta antes: icono de la app, manifest, favicon (nada de esto existe todavía) — mencionado también como pendiente de cara a "hacerla pública" (§22.20), junto con probar el registro completo con un usuario real que no sea el propio desarrollador.
6. **Buy Me a Coffee** — el usuario quiere añadir un botón/widget de donaciones; pendiente de que cree la cuenta (posiblemente a nombre de un adulto, por la edad mínima de las pasarelas de pago) y pase el enlace.

### 22.16 Mensaje de fallo de Sonido heredado de Identificar

El usuario recordó que al fallar un intento en "Por sonido" salía el mensaje de "Identifica el coche" ("aquí tienes un poco más de imagen — inténtalo de nuevo"), que no tiene sentido en Sonido porque no hay ninguna imagen que revelar. Causa: `checkIdentifyAttempt()` (compartida entre Identificar y Sonido desde el rediseño de §22.2) mostraba siempre el mismo `msgTryAgain` sin mirar el modo.

**Arreglo**: nueva cadena `msgTryAgainSound` (EN/ES) en `i18n.js`, y en `game.js` se elige entre `msgTryAgain`/`msgTryAgainSound` según `state.mode === "sound"`. De paso se revisó el resto de mensajes compartidos (acierto perfecto, sin intentos, resultados) por si tenían el mismo problema — esos ya eran lo bastante genéricos (no mencionan la imagen), así que no hacía falta tocarlos.

Verificado en el navegador forzando una respuesta incorrecta en Sonido (mensaje nuevo, correcto) y en Identificar (mensaje de siempre, sin cambios).

### 22.17 Recortes de "llanta" con llantas no originales

El usuario se fijó en que el modo difícil de Identificar sacaba a menudo el recorte de llanta, y que en varios coches esa llanta no es la de fábrica — un recorte así no ayuda (o despista) a la hora de identificar el coche. Se revisaron los 27 coches con `part:"rueda"` uno a uno, viendo la foto de cada uno.

**6 tenían un problema real** y se reasignaron a otra parte bien visible y de serie en esa misma foto (con nuevas coordenadas de `focus` para apuntar al sitio correcto):
- `c8` BMW Serie 3 (llantas doradas de aftermarket) → parrilla
- `c17` Volvo 240 (llantas de 5 radios no originales del 240) → faro
- `c20` Jeep Wrangler (montaje todoterreno con llantas rojas y suspensión levantada) → retrovisor
- `c55` Nissan Micra (preparado de circuito con llantas de recambio) → retrovisor
- `c76` GMC Yukon (la llanta casi no entraba en el encuadre de la foto) → faro
- `c81` BMW M3 E30 (llantas de aftermarket con marca visible en el propio disco) → faro

Los otros 21 se dejaron igual: llantas de fábrica o de época perfectamente razonables como pista (Fuchs del Porsche 911 clásico, Speedline del Ferrari F40, Rally del Corvette C3, etc.) — no hacía falta tocar nada solo por ser "rueda".

Verificado en el navegador renderizando cada uno de los 6 en dificultad difícil y último intento (máximo zoom) para comprobar que el recorte cae de verdad sobre la parte nueva y no sobre hueco/fondo.

### 22.18 Coche 101: Citroën DS

A petición del usuario ("añádeme un coche más y así hay 101"), se sourceó un coche más para el modo Identificar siguiendo el mismo proceso de siempre: búsqueda en Wikimedia Commons, licencia verificada por la API antes de descargar (CC BY-SA 4.0, autor PlotagonNoah), imagen recortada/redimensionada a 1200×750 para coincidir con el resto de `assets/cars/`. Se añadió **Citroën DS (1969)** — Francia no tenía representación desde hace tiempo con un modelo tan icónico, y sus faros dobles redondos son de fábrica y clarísimamente reconocibles (parte `"faro"`), evitando de paso el problema recién arreglado en el §22.17. Total: **101 coches** en `CARS`.

Verificado en el navegador: el recorte cae bien sobre los faros en dificultad difícil, y una ronda completa a mano confirmó que marca, modelo, país (Francia) y año se validan correctamente.

### 22.19 Autocompletado de modelo: de lista fija a calculado, y con relleno

El usuario preguntó si todos los coches del juego estaban también como opción de autocompletado al escribir el modelo (ponía de ejemplo "Porsche GT3 RS" o "BMW M3 GT2"). Auditando `BRAND_MODELS` (la lista de sugerencias, hasta entonces escrita a mano y pensada solo para Identificar) contra los coches reales de `SOUND_CARS`, salieron **57 de los 60** sin cubrir — justo esos dos ejemplos incluidos. Se validaba bien si se escribían a mano (la comprobación compara texto, no pertenencia a la lista), pero nunca aparecían como sugerencia.

**Primer arreglo**: `BRAND_MODELS`/`BRANDS`/`ALL_MODELS`/`LOGO_BRANDS` pasaron a calcularse al final de `data.js`, a partir de los modelos reales de `CARS` + `SOUND_CARS`, en vez de mantenerse a mano — así un coche nuevo en cualquiera de los dos modos queda cubierto sin tener que acordarse de tocar esta lista aparte (que es justo lo que había fallado). Hizo falta mover la declaración de `BRAND_MODELS` (y de lo que depende de ella, `BRANDS` y `LOGO_BRANDS`) al final del archivo, después de que `CARS` y `SOUND_CARS` ya existan.

**Matiz pedido después**: el usuario aclaró que sí quiere que haya modelos "de relleno" (que nunca sean la respuesta correcta, solo despisten al escribir) y pidió un mínimo de 10 modelos por marca — el cálculo automático por sí solo dejaba a casi todas las marcas muy por debajo (la mayoría con 1-7). Se añadió `FILLER_MODELS`, una lista a mano de modelos reales de producción de cada marca (no inventados) que hoy no salen como coche del juego, fusionada después de los reales; entre los dos, las 53 marcas llegan a 10 modelos o más (525 modelos en total). Los modelos reales siguen garantizados igual que en el primer arreglo — el relleno solo añade alrededor, nunca sustituye.

Verificado en el navegador: comprobación automática de que ninguna marca se queda por debajo de 10, y una ronda completa jugada a mano para confirmar que la comprobación de respuesta sigue funcionando igual.

### 22.20 Dominio propio y correo de producción

El usuario decidió preparar la app para compartirla más ampliamente: comprar un dominio propio y dejar el envío de emails listo para producción, en vez de depender de Vercel/Supabase con sus direcciones por defecto.

**Aclaraciones antes de gastar dinero** (preguntas del usuario, respondidas sin tocar código): Vercel no es el cuello de botella para tráfico alto — es una red global (CDN) con plan gratuito generoso; un hosting compartido barato de GoDaddy habría sido *peor*, no mejor, para tráfico alto. Lo único que hacía falta comprar era el dominio (no un hosting aparte). Se descartó `.win` por su mala fama con los filtros de spam (justo lo contrario de lo que se buscaba) y se valoró `.org` como alternativa sólida antes de que el usuario decidiera por `carquiz.app`. Sobre si el dominio o la cuenta de Buy Me a Coffee podían registrarse siendo menor de edad: se le explicó que la mayoría de registradores y pasarelas de pago exigen 18 años en sus condiciones, y que la vía correcta es que lo registre un padre/madre o tutor a su nombre — no es algo que se pueda resolver por código.

**El límite real de Supabase con emails**: el usuario recordó (correctamente) que ya habían tenido problemas antes con el envío de correos de confirmación — el servicio de email por defecto de Supabase en el plan gratuito está pensado solo para pruebas, con un límite muy bajo (pocos correos por hora), así que en cuanto varias personas se registren el mismo día, la mayoría no recibe el correo. Solución: configurar un proveedor SMTP externo. Se eligió **Resend** (plan gratuito: 3.000 emails/mes) y se guió al usuario paso a paso por su propia cuenta (yo no tengo acceso a ella): crear cuenta, sacar la API key, activar "Custom SMTP" en Supabase (Authentication → Emails → SMTP Settings) con host `smtp.resend.com`, puerto 465, usuario `resend` y la API key como contraseña.

**Primera prueba, con un hallazgo real**: usando el remitente de pruebas de Resend (`onboarding@resend.dev`, sin dominio verificado) el correo se enviaba y Resend lo marcaba como "Delivered", pero nunca aparecía en la bandeja del usuario (ni en spam, ni en ninguna pestaña, ni buscándolo). Explicación: Gmail puede aceptar un correo a nivel técnico y luego descartarlo en silencio sin archivarlo en ningún sitio, cuando desconfía del remitente — y `onboarding@resend.dev` es una dirección compartida por miles de cuentas de prueba, así que tiene mala fama. No era un fallo de la configuración, sino de la reputación de esa dirección concreta.

**Dominio propio comprado y conectado**: el usuario compró `carquiz.app` en Cloudflare. Se conectó a **Vercel** (Project Settings → Domains → Add Existing → registro CNAME en Cloudflare con "Proxy: DNS only", nunca proxied, porque si no da problemas con el certificado de Vercel) y a **Resend** (Domains → Add Domain → botón "Auto configure", que al estar el dominio en Cloudflare añadió los registros MX/TXT de verificación y DKIM/SPF él solo, sin copiar nada a mano). Una vez verificado el dominio en Resend, se cambió el "Sender email" en Supabase de `onboarding@resend.dev` a `noreply@carquiz.app` — con dominio propio, Resend entrega a cualquier email, no solo al del dueño de la cuenta.

**Bug encontrado al probar de verdad**: el enlace del correo de confirmación llevaba a `localhost` en vez de a `carquiz.app`. Causa: el campo **"Site URL"** de Supabase (Authentication → URL Configuration) se había quedado con la dirección de desarrollo local de cuando se creó el proyecto. Arreglado actualizando "Site URL" a `https://carquiz.app` y añadiendo `https://carquiz.app/**` a "Redirect URLs".

Todo este apartado se hizo directamente en los paneles de Vercel/Cloudflare/Resend/Supabase (por el propio usuario, guiado paso a paso) — no hubo cambios de código del repositorio en este punto.

### 22.21 Puntuación perdida al registrarse a mitad de partida

Con el correo ya funcionando de verdad, el usuario probó a registrarse desde la pantalla de resultados para guardar una puntuación, y encontró un bug real: tras confirmar el email, la app lo llevaba al menú principal **sin sesión iniciada** (había que volver a entrar a mano) y la puntuación de la ronda que acababa de jugar se perdía sin más.

**Causa**: `openLeaderboardForRound()` (`leaderboard.js`) solo recordaba "hay una puntuación pendiente de guardar" en una variable en memoria (`pendingScoreSave`). Eso funciona si inicias sesión en la misma pestaña (login normal, o Google) porque `onAuthStateChange` se dispara ahí mismo — pero registrarse exige confirmar el email, y ese enlace abre una página **completamente nueva**, sin memoria de la ronda jugada ni de la variable en cuestión.

**Arreglo**: además de la variable en memoria, la ronda pendiente (`mode`, `difficulty`, `score`, fecha de hoy) se guarda también en `localStorage` justo antes de abrir el formulario de registro (`savePendingScoreForLater()`). En cada carga de la app, dentro de `refreshAuthUI()` (`auth.js`) — que es donde se comprueba si hay sesión iniciada — se llama a la nueva `resumePendingScoreSave()` (`leaderboard.js`): si hay algo pendiente, es de hoy y ya hay sesión, guarda la puntuación y abre la clasificación directamente con el resultado puesto; si no, lo descarta sin más. Es de un solo uso — se borra de `localStorage` se consiga aplicar o no, para que una puntuación vieja no reaparezca de la nada en un inicio de sesión futuro que no tenga nada que ver.

Verificado en el navegador simulando los cuatro casos por consola (sin tocar la base de datos real): puntuación pendiente que se recupera y guarda bien al detectar sesión (incluida la llamada correcta a Supabase con los datos exactos), una "caducada" de otro día que se descarta sin aplicarla, y el caso de que la página cargue antes de que haya sesión — los cuatro se comportaron como se esperaba, y en los tres casos de descarte `localStorage` queda limpio.

### 22.22 Badge de cuenta invisible en móvil estrecho

El usuario reportó que en móvil no se veía nada del badge de la cuenta (nombre, lápiz de editar, botón de cerrar sesión) — solo en ordenador.

**Causa**: `.account-badge` usa `margin-right:auto` dentro de una fila `flex` con `justify-content:flex-end` para quedar pegado a la izquierda mientras `.lang-switch` (el selector EN/ES) queda a la derecha, todo en una sola línea. En un móvil estrecho los dos juntos no caben, y al no haber `flex-wrap`, el badge se sale por el borde izquierdo de la pantalla — no es que quedara apretado, es que literalmente quedaba fuera del viewport, inaccesible.

**Arreglo**: nueva regla `@media (max-width: 480px)` que añade `flex-wrap:wrap` y centra la fila — si no caben en una línea, cada grupo (badge y selector de idioma) pasa a su propia línea centrada en vez de desbordar.

Verificado emulando viewports de 375px y 320px con el badge forzado a visible por consola (mockeando `currentUser`/`currentProfile`, sin sesión real): en ambos anchos se ve completo y centrado; en escritorio no cambia nada.

### 22.23 Favicon y apoyo económico al proyecto (Ko-fi)

De cara a compartir la app más ampliamente, el usuario pidió un favicon (no existía ninguno) y un botón de donaciones.

**Favicon, primera versión**: se diseñó un icono sencillo (un coche visto de lado, en ámbar sobre el fondo oscuro de la app, a juego con la paleta) como SVG — favicon principal en SVG (los navegadores modernos lo soportan directo) más PNG de respaldo en 16/32px y un `apple-touch-icon` de 180px para iOS. Al generar los PNG surgió un problema técnico interesante: el `ffmpeg` de este proyecto no trae decodificador de SVG, y transcribir el PNG a mano como base64 (probado primero) resultó poco fiable — un archivo de 512×512 se corrompió en la transcripción (el `file` de Linux lo daba por válido con solo mirar la cabecera, pero no se podía abrir de verdad). Se resolvió generándolo con `System.Drawing` de .NET vía PowerShell (dibujando las mismas curvas a mano con `GraphicsPath`), que genera los píxeles directamente en disco sin pasar ningún dato binario grande por en medio.

**Favicon, versión final**: el usuario diseñó su propio logo (un neumático con una "C" estilizada en el centro) y pidió sustituir el mío por el suyo, aunque le avisé de que a 16-32px el dibujo (con el detalle del dibujo del neumático) se lee peor que uno simple — lo probó él mismo en el navegador y decidió quedarse con el suyo de todas formas. Se recortó el margen blanco sobrante de la imagen original (ffmpeg, esta vez con PNG de entrada, sin problema) y se generaron los mismos tamaños (16/32/180/512px); el SVG del coche se eliminó por quedar sin uso.

**Apoyo económico**: el usuario preguntó cómo añadir un botón de Buy Me a Coffee — se le explicó que el dinero lo gestiona esa web entera (nunca pasa por la app ni por Claude), que hace falta conectar un método de cobro propio (Stripe/banco/PayPal según la plataforma), y que por ser menor de edad lo correcto es que la cuenta de cobro esté a nombre de un adulto — igual que con el dominio. Al pedirle Buy Me a Coffee datos de empresa (no quería registrarse como negocio), el usuario cambió a **Ko-fi** (alternativa recomendada por no cobrar comisión propia en donaciones puntuales, a diferencia del ~5% de Buy Me a Coffee) y ya la dejó conectada por su cuenta. Se añadió el enlace en la app en dos sitios a la vez (pedido explícito): un botón integrado en el menú principal a juego con el diseño (`.support-link`, círculo con icono de taza), y el widget flotante oficial de Ko-fi (script `overlay-widget.js`), ambos apuntando a `ko-fi.com/carquiz`.

Verificado en el navegador (escritorio y móvil emulado a 375px) que ambos elementos se ven bien y no rompen el diseño ya arreglado en el §22.22, y que el enlace del botón integrado lleva a la URL correcta con `target="_blank"` y `rel="noopener noreferrer"`.

### 22.24 El widget de Ko-fi no cambiaba de idioma

El usuario notó que, al cambiar la app a inglés, el botón flotante de Ko-fi se quedaba en español ("Apóyanos") — su texto se había puesto una sola vez, fijo, al cargar la página (§22.23), y el script de Ko-fi no tiene ningún sistema de idiomas propio.

**Investigación**: `kofiWidgetOverlay` solo expone un método, `draw()`. Se probó primero quitar del DOM el `<div id="kofi-widget-overlay-...">` que crea la primera vez y volver a llamar a `draw()` — el propio script de Ko-fi lanzaba un error interno (`Cannot set properties of null`), señal de que guarda una referencia a ese div en algún sitio y no la vuelve a buscar. Probando **sin** quitar el div, llamar a `draw()` otra vez con textos distintos sí actualiza el botón que ya existe, sin duplicarlo ni dar error — comportamiento no documentado, pero confirmado a mano en el navegador.

**Arreglo**: la llamada a `kofiWidgetOverlay.draw()` se movió a una función `window.drawKofiWidget()` (en `index.html`) que coge el texto del botón con `t("kofiButtonLabel")`, la misma función de traducción que usa el resto de la app. `applyStaticI18n()` (`i18n.js`) — que ya se ejecuta al cargar la página y cada vez que se cambia de idioma — llama a `window.drawKofiWidget()` al final, así que el botón de Ko-fi seguía el idioma activo sin necesidad de recargar la página.

Verificado en el navegador: al hacer clic en "EN" el botón cambiaba de "Apóyanos" a "Support us" al momento, sin recargar.

---

## 24. Revisión de seguridad completa (13 sept. 2026)

El usuario pidió una revisión de seguridad a fondo, con un objetivo concreto: que nadie pudiera "hackear" la app ni falsear puntuaciones. Se hizo con pruebas reales contra Supabase en producción (usando la misma clave pública `anon` que ya lleva la app, sin iniciar sesión — exactamente lo que vería un visitante cualquiera), no solo lectura de código.

### 24.1 El problema de fondo: las respuestas viajan en el propio código

Como la app es HTML/JS estático sin servidor de juego propio, `data.js` contiene las respuestas correctas de los 3 modos en texto plano (visible con "ver código fuente"). Esto significa que **no existe una forma de impedir al 100% que alguien haga trampa mirando el código antes de responder** sin rehacer la arquitectura para que el servidor sea el árbitro (Edge Functions de Supabase que solo revelen la respuesta correcta después de recibir el intento, y sea el único que pueda escribir en `scores`). Se explicó esto al usuario con el coste real (proyecto de tamaño medio, no un retoque) y, dado que es un juego para jugar con amigos sin premio real, se decidió **no** acometer ese cambio grande por ahora — ver §24.5 para qué se hizo en su lugar.

### 24.2 Hallazgo 1: puntuación arbitraria por consola (confirmado por código, no probado en vivo)

`saveScoreIfLoggedIn()` (`game.js`) calcula la puntuación en el navegador y la manda tal cual a Supabase; la política RLS de `scores` solo comprobaba que la fila fuera del propio usuario (`user_id = auth.uid()`), no que el número tuviera sentido — cualquier jugador con cuenta real podía abrir la consola (F12) y subir un `upsert` con `score: 999999`. No se probó con una cuenta real (crear cuentas de prueba no es algo que deba hacer sin más), pero se dedujo con certeza del propio código + de las políticas documentadas en §19.2.

**Arreglo aplicado** (el usuario lo ejecutó en el SQL Editor de Supabase): dos restricciones `CHECK` en la tabla `scores`:
```sql
alter table scores add constraint score_within_bounds check (
  score >= 0 and score <= case
    when mode = 'sound' then 100
    when mode in ('identify','logo') and difficulty = 'easy' then 100
    when mode in ('identify','logo') and difficulty = 'medium' then 200
    when mode in ('identify','logo') and difficulty = 'hard' then 300
    else 300
  end
);
alter table scores add constraint played_on_is_today check (played_on <= current_date);
```
Verificado indirectamente: tras aplicarlas, `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='scores'::regclass and contype='c'` mostró las dos junto a una `scores_mode_check` preexistente. No se pudo probar en vivo un intento real de inserción con puntuación desorbitada (haría falta una cuenta logueada), pero la restricción a nivel de base de datos se aplica a cualquier `INSERT`/`UPDATE`, venga de donde venga.

**Lo que queda sin cerrar a propósito**: alguien podría seguir "haciendo trampa" reclamando siempre el máximo exacto de su dificultad (100/200/300) — indistinguible de una ronda perfecta jugada de verdad. Aceptado como los límites del modelo actual (ver §24.1).

### 24.3 Hallazgo 2: cualquiera (sin cuenta) podía manipular el sonido del día para todos — confirmado en vivo

Se probó insertar una fila en `daily_sound` sin sesión iniciada (`POST .../rest/v1/daily_sound` con la clave `anon`, sin token de usuario) y **funcionó** (201), incluso con una fecha futura de 2099 y un `sound_id` inventado que no existe en `SOUND_CARS`. Esto permitía a cualquier visitante, sin registrarse, adelantarse e insertar de antemano el sonido que quisiera para cualquier día futuro (o directamente romper el sonido de hoy con un id inválido, que cae al primer sonido del array como reserva, `SOUND_CARS[0]`).

**Causa encontrada**: revisando Authentication → Policies en el panel de Supabase, la tabla tenía **dos políticas de INSERT activas a la vez** — una permisiva antigua (`proponer el sonido del día`, sin restricción, para `anon`+`authenticated`) y la nueva que se había añadido con restricción de fecha (`daily_sound_insert_today_only`). En Postgres/Supabase, si hay varias políticas para la misma acción, basta con que **una sola** lo permita — la vieja seguía dejando pasar cualquier cosa aunque la nueva fuera correcta.

**Arreglo**: `drop policy "proponer el sonido del día" on daily_sound;`, dejando solo la política nueva (que exige `played_on = current_date` y `sound_id` con formato válido `s1`...`s60`).

**Verificado en vivo, dos veces** (antes y después del `drop policy`): el mismo intento de inserción de fecha futura pasó de `201 Created` a `401 / 42501 row-level security policy` tras el arreglo, sin romper la lectura normal del sonido de hoy (`SELECT` sigue abierto a `anon`, como tiene que estar).

**Nota de limpieza**: las pruebas dejaron temporalmente filas de basura en `daily_sound` (fechas de 2099 y, sin querer en una prueba, un `sound_id` inválido para el propio día de hoy) — se borraron con `DELETE` desde el SQL Editor en cuanto se detectaron, antes de que afectaran a ningún jugador real.

### 24.4 Hallazgos menores, corregidos en código

- **Auto-XSS en la tabla de intentos**: `renderAttemptsTable()` (`game.js`) insertaba lo que el jugador escribe en marca/modelo/país/año directamente en `innerHTML` sin escapar — quien escribiera código HTML en un campo lo vería ejecutarse en su propia pantalla (no afecta a otros jugadores, la tabla de intentos nunca se guarda ni se comparte). Arreglado con una función `escapeHtml()` nueva que usa un `<div>` intermedio (`div.textContent = str; return div.innerHTML;`) antes de insertar `h.vals[f]`. Verificado en el navegador escribiendo `<img src=x onerror=alert('XSS')>` en el campo de marca: se muestra como texto literal, sin ejecutarse ni dar error en consola.
- **Sin cabeceras de seguridad**: no existía `vercel.json`, así que Vercel no añadía protección contra clickjacking ni otras cabeceras básicas. Se creó `vercel.json` con `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` (bloqueando cámara/micrófono/geolocalización, que la app no usa). Deliberadamente **no** se añadió una CSP completa de `script-src` (habría hecho falta listar cada origen exacto — jsDelivr para `supabase-js`, el script de Ko-fi, Google Fonts, más el script inline de `drawKofiWidget` — con riesgo real de romper algo en producción sin poder probarlo a fondo primero); se dejó solo la protección de "no se puede incrustar esta web en un iframe ajeno", que no tiene ningún efecto secundario.

### 24.5 Resumen de qué se decidió no tocar

Explicado al usuario y aceptado explícitamente: la reescritura para que el servidor (Edge Functions) sea el único árbitro de las respuestas y de la puntuación **no se ha hecho** — es la única forma de cerrar del todo la trampa "leer las respuestas en el código", pero es un cambio de arquitectura grande, y de momento sigue siendo un juego para jugar con amigos sin premio real de por medio. Queda anotado aquí por si en el futuro el proyecto cambia de escala (por ejemplo, si empieza a haber algún tipo de premio o competición seria) y conviene retomarlo.

---

## 25. Testeo funcional completo en escritorio, tablet y móvil (13 sept. 2026)

Pedido explícito, sin relación con la seguridad del §24: revisar la app entera buscando fallos, jugando los 3 modos de principio a fin y probando el diseño en los tres tamaños de pantalla. Se hizo con el Browser pane (`preview_start` con la config `quiz-coches` de `.claude/launch.json`, puerto 3004), usando la consola (`checkAnswer()`/`nextQuestion()` expuestas globalmente, ver §22.13) para avanzar rondas rápido sin perder cobertura real de la lógica.

**Lo que se confirmó que funciona bien** (sin errores de consola en ninguna prueba): autocompletado, la tabla de intentos y el revelado progresivo de zoom en Identificar, los topes de puntuación 100/200/300 en los 3 modos, el bloqueo diario de Sonido (incluido que sigue bloqueado tras recargar la página), el cambio de idioma completo (incluida la pestaña del navegador), el tamaño de letra ≥16px en los campos en móvil (el fix de zoom del teclado sigue funcionando), y que la columna no provoca scroll horizontal en ningún ancho.

**Fallos encontrados y arreglados, los 4 en la misma pasada:**

1. **El widget flotante de Ko-fi tapaba el botón "Comprobar" en móvil** (el más importante de los 4, confirmado tocando de verdad la pantalla, no solo mirando el CSS): el script de Ko-fi (`overlay-widget.js`, §22.23) añade su propio `<div>` a `<body>` con `position:fixed` en la esquina inferior izquierda, fuera de cualquier `.screen` — en anchos de móvil esa esquina coincide justo con el botón "Comprobar"/"Siguiente" de la partida. Se comprobó tocando esa esquina: en vez de comprobar la respuesta, se abría la ventana de donar a Ko-fi.
   **Arreglo**: `showScreen()` (`game.js`) añade/quita una clase `body.in-game` según si la pantalla activa es `screen-game`; en `styles.css`, `body.in-game .floatingchat-container-wrap, body.in-game .floatingchat-container-wrap-mobi{ display:none !important; }` oculta el widget mientras se juega. El botón de apoyo del menú principal (`.support-link`) no se toca, sigue siempre visible. Verificado: `getComputedStyle(...).display` del widget es `"none"` con `body.in-game`, y vuelve a `"block"` en cuanto se sale a menú/resultados.

2. **El título del modal de login se quedaba en "Sign in" al cambiar a modo registro**: `updateAuthFormMode()` (`auth.js`) actualizaba el botón, el texto de abajo y el campo de usuario, pero no el `<h2>` de arriba (tenía `data-i18n="authTitle"` fijo). **Arreglo**: se quitó el `data-i18n` del `<h2>` (ahora `id="auth-title"`) y `updateAuthFormMode()` le pone el texto a mano según el modo — reutiliza la cadena `btnSignUp` ya existente ("Sign up"/"Registrarse") en vez de crear una traducción nueva duplicada. Verificado en los dos idiomas alternando login↔registro.

3. **Los créditos de foto/sonido estaban fijos en español pase lo que pase**: las 161 líneas de atribución en `data.js` (`credit:"Foto: ..."` / `credit:"Sonido: ..."`, exigidas por las licencias CC de Wikimedia Commons) se insertaban tal cual sin pasar por el sistema de idiomas — con la app en inglés seguía poniendo "Foto: X, Wikimedia Commons" en vez de "Photo: X, Wikimedia Commons". Se confirmó que las 161 siguen sin excepción el mismo patrón (`grep` verificó 0 que no empezaran por "Foto: " o "Sonido: "), así que se pudo arreglar sin tocar los datos: nueva `translateCredit()` en `i18n.js` que solo cambia la palabra inicial cuando el idioma activo es inglés (`Foto:`→`Photo:`, `Sonido:`→`Sound:`), dejando intacto el nombre del autor y la licencia. Usada en los dos sitios de `game.js` donde se muestra el crédito (Identificar y Sonido).

4. **En tablet en vertical (768px) la columna se quedaba en su ancho mínimo**, no un fallo funcional pero sí una limitación real: el `clamp(480px, 60vw, 880px)` de `#app` (§9/§12) cae en su mínimo de 480px en todo el rango ~700-900px de ancho, dejando mucho hueco vacío a los lados en una tablet real en vertical. **Arreglo acotado**: `@media (min-width:700px) and (max-width:900px){ #app{ max-width:90vw; } }` — solo ensancha ese rango concreto (768px pasó de 480px a 691px de columna), sin tocar el clamp de siempre ni el aspecto ya aprobado en escritorio o móvil real.

Los 4 arreglos verificados en el navegador (con capturas y lecturas de `getComputedStyle`/clases antes y después) y subidos a producción en el mismo commit.

### 25.1 Corrección: Ko-fi sí se lleva comisión en pagos por PayPal

En §22.23 se anotó que Ko-fi era la alternativa elegida "por no cobrar comisión propia en donaciones puntuales, a diferencia del ~5% de Buy Me a Coffee" — el usuario recibió su primera donación real (1€ por PayPal) y el desglose de la transacción en PayPal mostró: Importe bruto 1,00€, Tarifa de PayPal -0,38€, **Comisión del partner -0,05€** (un 5%), Importe neto 0,57€. La "Comisión del partner" es Ko-fi cobrando su parte a través de la integración con PayPal — así que la afirmación de §22.23 **era incorrecta para pagos vía PayPal** (puede que sí aplique 0% en otras pasarelas, no verificado). Corregido aquí para no repetir el dato erróneo en el futuro.

**Aparte, contexto explicado al usuario sobre por qué se lleva tanto en una donación de 1€ en concreto**: la "Tarifa de PayPal" tiene una parte fija (~0,35€) más un pequeño porcentaje — esa parte fija pesa muchísimo en pagos tan pequeños, pero apenas se nota en donaciones más grandes (con 5€ o 10€ el porcentaje que se queda el usuario sería mucho mayor). No es un porcentaje fijo del 43% para cualquier importe, es específico de que la donación sea de solo 1€.

### 25.2 Cuenta de PayPal para recibir las donaciones: configurada por el padre del usuario

Continuando el hilo del Ko-fi (§22.23/25.1): para poder cobrar de verdad las donaciones hacía falta una cuenta de PayPal verificada, y como PayPal exige mayoría de edad (mismo motivo que ya se explicó con el dominio y con Buy Me a Coffee, ver §22.20/22.23), fue **el padre del usuario quien inició sesión y completó el alta** — no el usuario ni yo. Cuando PayPal pidió elegir un tipo de cuenta ("Corporación/sociedad o Gobierno" / "Comerciante unipersonal, o vendes como actividad secundaria" / "Organización sin ánimo de lucro"), se le explicó al usuario que la opción correcta para un proyecto personal como CarQuiz es **"Comerciante unipersonal"** (no es una empresa registrada ni una entidad benéfica).

**Prueba de donación con un error inicial, ya resuelto**: al intentar hacer una donación de prueba, PayPal dio el error "Estás entrando en la cuenta del vendedor para realizar esta compra" — motivo: el navegador tenía la sesión iniciada con la misma cuenta de PayPal que recibe el dinero (la del padre), y PayPal bloquea pagarte a ti mismo con la cuenta vendedora por seguridad. Se resolvió cerrando esa sesión (o usando otra cuenta/ventana de incógnito) para completar el pago como comprador distinto. La donación de prueba **funcionó correctamente** tras eso — el circuito completo Ko-fi → PayPal → cuenta del padre queda confirmado operativo de principio a fin.

---

## 26. SEO básico: meta tags, robots.txt, sitemap.xml y Google Search Console

De cara a promocionar la app (el usuario se está preparando para publicitarla en Instagram, ver §27), pidió que al buscar "carquiz" en Google saliera su página. El sitio no tenía absolutamente nada pensado para buscadores: `<title>` genérico ("Car Quiz"), sin meta description, sin Open Graph, sin `robots.txt` ni `sitemap.xml`.

**Cambios de código** (`index.html`, `js/i18n.js`): título renombrado a "CarQuiz — Guess the car by photo, sound or logo" / "...Adivina el coche por foto, sonido o logo" (tanto el `<title>` estático como el `pageTitle` de `i18n.js`, que es el que de verdad se aplica al cargar vía `applyStaticI18n()`), meta `description`, `og:*` y `twitter:*` (usando `assets/ui/icon-512.png` como imagen de vista previa al compartir el enlace), `<link rel="canonical">`. Nuevos `robots.txt` (permite todo, apunta al sitemap) y `sitemap.xml` (una sola URL, la home) en la raíz del proyecto.

**Verificación de propiedad en Google Search Console**: el usuario creó la propiedad `https://carquiz.app` y pidió verificación por etiqueta HTML — me pasó el código y se añadió como `<meta name="google-site-verification" content="...">` en el `<head>`. Verificado, sitemap enviado ("Correcto", 1 página descubierta) y solicitada indexación manual de la home vía "Inspección de URLs" para acelerar el proceso frente a esperar el rastreo orgánico.

**Expectativa puesta al usuario**: nada de esto es instantáneo — puede tardar de horas a varios días en indexarse aunque se avise a Google a mano; se le explicó que compartir el enlace en redes (Instagram) también ayuda a que se indexe antes, al generar enlaces externos reales.

---

## 27. Promoción en Instagram: guión de Reel y ayuda de edición (no cambios de código)

El usuario decidió promocionar la app abriendo una cuenta de Instagram y publicando un Reel. Todo lo de esta sección es **asesoramiento fuera del repositorio**, sin tocar código — se deja anotado por si en el futuro se retoma la promoción o hace falta el mismo contexto.

- **Guión de Reel** (~35s): gancho sin mostrar la app (pregunta/reto directo a cámara o un recorte de coche muy de cerca) → primer vistazo al menú (fondo animado) → demo real del modo Identificar (fallo con sacudida, revelado progresivo, acierto) → demo de Sonido o Logos → clasificación (podio F1) → cierre con "carquiz.app" / link en bio. Coche de fondo elegido a propósito: el sonido de motor real es el diferenciador frente a otras apps de quiz de coches.
- **Edición en Clipchamp**: se guió paso a paso cómo hacer zoom fluido tipo Ken Burns (keyframes con al menos 1-2s entre ellos), texto en pantalla, narración por voz en off grabada, y **texto a voz con IA** integrado en la propia Clipchamp (más práctico que narrar en directo porque permite generar frase por frase y encajarlas con cada escena del guión).
- **Formato vertical (9:16)**: recomendado grabar directamente en el móvil en vertical para evitar tener que arreglar vídeo horizontal después (recorte/relleno con fondo desenfocado si hiciera falta).
- **Música**: se recomendó estilo "corporate upbeat"/"epic build up" de la biblioteca gratuita de Clipchamp, evitando canciones con letra que compitan con el texto/narración.
- Aparte, se resolvieron dudas puntuales de la plataforma (cómo grabar pantalla según el aparato, cómo descargar un vídeo propio vs. ajeno de Instagram, mejores horas para publicar — orientativo: jueves/viernes sobre las 20:00h en España hasta tener datos reales de audiencia propia en Instagram Insights).

**Aviso dado sobre analítica**: antes de publicar el Reel, se avisó al usuario de que la app no tiene ningún sistema de analítica de visitas (solo Vercel Analytics básico, Search Console —que solo cuenta tráfico de Google— y las tablas de Supabase —que solo cuentan usuarios registrados—), así que el tráfico real que llegue desde Instagram no se puede medir bien todavía. El usuario decidió **dejarlo para más adelante**, no añadir nada por ahora.

---

## 28. Clasificación semanal y mensual, además de la diaria

Pedido explícito, surgido de la conversación sobre cómo enganchar más a la gente: además de la clasificación de "Hoy" (§19.6/22.12), añadir una vista semanal y otra mensual, para incentivar volver varios días seguidos (no solo jugar una vez).

**Decisión de diseño acordada con el usuario antes de tocar código**: la dificultad y el periodo **no se cruzan** — al elegir Semana o Mes, las pestañas Fácil/Medio/Difícil se ocultan (igual que ya pasaba en el modo Sonido, que tampoco tiene dificultad) y la clasificación pasa a tratarse siempre como "general" cruzando dificultades, para no complicar la pantalla con demasiadas combinaciones de pestañas.

**Cómo se calcula el ranking semanal/mensual**: para cada jugador, se **suma su mejor puntuación de cada día que jugó** dentro del periodo (últimos 7 días para semana, últimos 30 para mes — periodo móvil desde hoy hacia atrás, no semana/mes de calendario, así no hace falta gestionar ningún "reinicio"). Es una suma a propósito, no un máximo: así se premia tanto jugar bien como volver varios días, que es justo el objetivo de tener una vista semanal. Si un jugador jugó varias dificultades el mismo día, se coge la mejor de ese día antes de sumarla al total (evita que un mismo día cuente varias veces).

**Implementación** (`leaderboard.js`): nueva variable `lbPeriod` ('day'/'week'/'month'), nueva función `updateDiffTabsVisibility()` (oculta las pestañas de dificultad si el modo es sonido O si el periodo no es "day", centralizando una lógica que antes solo estaba en un sitio). `loadLeaderboard()` cambia de una única consulta con `.eq("played_on", today)` a: si es "hoy", el camino rápido de siempre (top-10 ya ordenado por el servidor cuando hay dificultad concreta, o agrupado en el cliente si es "General"); si es semana/mes, una consulta con `.gte("played_on", fecha_de_corte)` que siempre se agrupa en el cliente en dos pasos — primero el mejor resultado de cada (usuario, día), luego la suma de esos resultados por usuario. Nuevas cadenas en `i18n.js`: `periodDay/periodWeek/periodMonth` (pestañas), `lbEmptyPeriod` (aviso de "nadie ha jugado en este periodo"), y `lbDayPlayed`/`lbDaysPlayed` (singular/plural para la etiqueta "N días" que aparece junto al nombre en vista semanal/mensual — **se detectó y corrigió en la misma sesión** un fallo de pluralización ("1 días" en vez de "1 día") antes de subirlo).

Nuevo apartado visual reutilizado del ya existente: las pestañas de periodo (`leaderboard-period-tabs`/`lb-period`) comparten el mismo estilo CSS que las de modo y dificultad (`.lb-tab, .lb-diff, .lb-period` en una sola regla), cero CSS nuevo aparte de añadir esos selectores a las reglas ya existentes.

Verificado en el navegador simulando datos con `sb.from` sustituido (sin tocar la base de datos real, mismo patrón que en §22.12): un jugador con mejores puntuaciones en 2 días distintos y con distinta dificultad cada día sumó correctamente (150+200=350, quedándose con la mejor dificultad de cada día), ordenó por delante de otro jugador con un solo día de 300 puntos, mostró "2 días"/"1 día" en singular/plural correctamente, y las pestañas de dificultad aparecían/desaparecían bien al cambiar entre Hoy/Semana/Mes y entre modo Identificar/Sonido — probado con clics reales de ratón, no solo por consola, y también con el idioma cambiado a inglés.

---

## 29. Favicon de 96x96 para que Google lo enseñe en resultados de búsqueda

El usuario notó que el resultado de carquiz.app en Google no mostraba ningún icono junto al nombre del sitio (salía un globo genérico). Causa probable: Google recomienda que el favicon tenga un tamaño múltiplo de 48px para poder usarlo en resultados de búsqueda, y los únicos que había (`favicon-16.png`, `favicon-32.png`, del trabajo de favicon del §22.23) no cumplían eso.

**Arreglo**: se generó `assets/ui/favicon-96.png` (96×96) a partir del logo del usuario (`icon-512.png`, ya existente) usando `sharp` instalado al vuelo en una carpeta temporal (mismo patrón puntual que en sesiones anteriores para tareas de imagen — no queda instalado en el proyecto). Se añadió como `<link rel="icon" sizes="96x96">` adicional en `index.html`, sin tocar los de 16/32 que sigue usando la pestaña del navegador.

Se le explicó al usuario que esto tampoco es instantáneo: aunque el título y la descripción ya se habían indexado bien, el icono de búsqueda de Google suele ir varios días por detrás incluso después del arreglo.

---

## 30. Bug: 9 marcas salían duplicadas en Logos (Bugatti y otras 8)

El usuario reportó ver "Bugatti" dos veces en la lista del juego (concretamente, en el autocompletado del modo Logos). Investigado y confirmado con un script rápido en Node cargando `data.js`: **no era solo Bugatti, eran 9 marcas** — Vauxhall, Lotus, McLaren, Bugatti, Koenigsegg, Pagani, Morgan, Alpine y De Tomaso.

**Causa raíz**: cuando se creó `LOGO_ONLY_BRANDS` (§5.2), esas 9 marcas se incluyeron a propósito porque en aquel momento `BRANDS` solo salía de `CARS` (Identificar) y estas marcas ya se querían usar también en Sonido (el propio comentario del código lo explicaba: "el reto diario incluye fabricantes como Bugatti, Koenigsegg o Alpine que Identificar todavía no tiene"). Pero **§22.19 cambió `BRANDS` para que saliera de `CARS` + `SOUND_CARS`** (arreglo del bug de autocompletado de modelos) — desde ese cambio, esas 9 marcas ya entraban solas en `BRANDS` a través de `SOUND_CARS`, así que al construir `LOGO_BRANDS = [...BRANDS, ...LOGO_ONLY_BRANDS]` quedaban contadas dos veces. Un efecto secundario no detectado en su momento de un cambio de hace semanas, no un fallo introducido ahora.

**Arreglo**: se quitaron esas 9 marcas de `LOGO_ONLY_BRANDS` (ya no hace falta tenerlas ahí, `BRANDS` las trae solas) y se actualizó el comentario del array para explicar la regla de mantenimiento: si una marca de `LOGO_ONLY_BRANDS` gana un coche o sonido real más adelante, hay que quitarla de esa lista o vuelve a duplicarse.

Verificado con un script en Node y en el navegador: `LOGO_BRANDS` vuelve a tener exactamente 100 elementos, los 100 distintos, las 100 con dificultad asignada en `LOGO_DIFFICULTY` y con archivo de logo en `LOGO_FILE_BY_BRAND` — y visualmente, escribir "Bug" en el autocompletado de Logos ahora sugiere "Bugatti" una sola vez.

---

*Documento generado el 11 sept. 2026, ampliado el 12 sept. 2026 con todo el trabajo de sesión: idiomas, bono de velocidad, topes de puntuación por dificultad, clasificación diaria con login (Supabase), rediseño de la clasificación estilo podio F1, iconos de menú con transparencia real, despliegue continuo en Vercel vía GitHub, el modo "Por sonido" convertido en reto diario con grabaciones reales de motor (39→60 sonidos, bug de silencio encontrado y corregido, sonido del día resuelto con tabla en Supabase para que sea aleatorio de verdad), el crédito de la grabación en pantalla, el sonido cortándose al salir de la pregunta, los controles de play/pausa/repetir con el botón de play centrado, el "un intento al día" del sonido pasado a comprobarse en el servidor (ya no se podía jugar dos veces entre aparatos), la clasificación general por modo (mejor puntuación entre las tres dificultades, sin normalizar), la puntuación de Logos escalada por dificultad (100/200/300) con bono de tiempo, igual que Identificar, el zoom de móvil pillado al usar el teclado (mismo arreglo que en la clínica veterinaria), el idioma inicial detectado del navegador (español para hispanohablantes, inglés para el resto, hasta que se elija a mano), el mensaje de fallo de Sonido que hablaba de una imagen inexistente, los recortes de "llanta" con llantas no originales corregidos, el coche 101 (Citroën DS), el autocompletado de modelo calculado a partir de los coches reales más relleno hasta un mínimo de 10 por marca, el dominio propio carquiz.app conectado a Vercel con correo de producción vía Resend/SMTP personalizado, la puntuación que se perdía al registrarse a mitad de partida, el badge de cuenta invisible en móvil estrecho, el favicon (con el logo propio del usuario), el botón de apoyo económico vía Ko-fi, y el widget de Ko-fi siguiendo el idioma activo de la app.*
