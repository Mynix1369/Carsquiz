// Genera imágenes de muestra (SVG) en tiempo real: una "escena" de coche por cada registro
// y una insignia genérica por marca. Son ilustraciones propias, no fotos ni logos reales,
// pensadas solo para probar el mecanismo del juego (zoom, revelar, etc.).

function svgToDataUri(svg){
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Escena de coche 400x300 (ratio 4:3, igual que el contenedor) con partes en posiciones fijas,
// para que los focos de zoom (PART_FOCUS) coincidan siempre con el mismo sitio.
function buildCarSceneSVG(car){
  const c = colorForBrand(car.brand);
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2b3140"/>
        <stop offset="1" stop-color="#3a4356"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="400" height="220" fill="url(#sky)"/>
    <rect x="0" y="220" width="400" height="80" fill="#20242c"/>
    <rect x="0" y="218" width="400" height="4" fill="#141820"/>

    <!-- carroceria -->
    <rect x="70" y="130" width="260" height="80" rx="24" fill="${c}"/>
    <rect x="140" y="88" width="140" height="52" rx="18" fill="${c}"/>
    <rect x="150" y="98" width="120" height="30" rx="8" fill="#cfe8ff" opacity="0.85"/>

    <!-- parrilla -->
    <rect x="172" y="150" width="56" height="34" rx="4" fill="#161616"/>
    <rect x="178" y="156" width="44" height="4" fill="#555"/>
    <rect x="178" y="164" width="44" height="4" fill="#555"/>
    <rect x="178" y="172" width="44" height="4" fill="#555"/>

    <!-- faros -->
    <circle cx="90" cy="165" r="15" fill="#fff6da" stroke="#d8c98a" stroke-width="2"/>
    <circle cx="310" cy="165" r="15" fill="#fff6da" stroke="#d8c98a" stroke-width="2"/>

    <!-- ruedas -->
    <circle cx="130" cy="215" r="30" fill="#111"/>
    <circle cx="130" cy="215" r="13" fill="#8a8f99"/>
    <circle cx="310" cy="215" r="30" fill="#111"/>
    <circle cx="310" cy="215" r="13" fill="#8a8f99"/>

    <!-- emblema -->
    <circle cx="200" cy="110" r="15" fill="#f2f2f2" stroke="${c}" stroke-width="4"/>
    <text x="200" y="116" font-size="14" font-weight="700" text-anchor="middle" fill="${c}" font-family="Arial">${car.brand[0]}</text>
  </svg>`;
}

function buildCarImageUri(car){
  return svgToDataUri(buildCarSceneSVG(car));
}

const BRAND_COLORS = {};
function colorForBrand(brand){
  if(BRAND_COLORS[brand]) return BRAND_COLORS[brand];
  const h = hashString(brand);
  const hue = h % 360;
  const color = `hsl(${hue} 65% 45%)`;
  BRAND_COLORS[brand] = color;
  return color;
}

const LOGO_FILE_BY_BRAND = {
  "Toyota":"toyota", "Honda":"honda", "Nissan":"nissan", "Mazda":"mazda", "Subaru":"subaru",
  "Mitsubishi":"mitsubishi", "Suzuki":"suzuki", "Lexus":"lexus", "Ford":"ford", "Chevrolet":"chevrolet",
  "Tesla":"tesla", "Chrysler":"chrysler", "Dodge":"dodge", "Jeep":"jeep", "Cadillac":"cadillac",
  "GMC":"gmc", "Buick":"buick", "Volkswagen":"volkswagen", "BMW":"bmw", "Mercedes-Benz":"mercedes-benz",
  "Audi":"audi", "Porsche":"porsche", "Opel":"opel", "Fiat":"fiat", "Alfa Romeo":"alfa-romeo",
  "Ferrari":"ferrari", "Lamborghini":"lamborghini", "Maserati":"maserati", "Lancia":"lancia",
  "Renault":"renault", "Peugeot":"peugeot", "Citroën":"citroen", "SEAT":"seat", "Mini":"mini",
  "Jaguar":"jaguar", "Land Rover":"land-rover", "Aston Martin":"aston-martin", "Bentley":"bentley",
  "Rolls-Royce":"rolls-royce", "Volvo":"volvo", "Saab":"saab", "Skoda":"skoda", "Hyundai":"hyundai",
  "Kia":"kia",

  "Isuzu":"isuzu", "Daihatsu":"daihatsu", "Genesis":"genesis", "Infiniti":"infiniti", "Acura":"acura",
  "Datsun":"datsun", "Scion":"scion", "SsangYong":"ssangyong", "Great Wall":"great-wall", "Haval":"haval",
  "BYD":"byd", "Geely":"geely", "MG":"mg", "Chery":"chery", "Tata":"tata", "Mahindra":"mahindra",
  "Proton":"proton", "Lada":"lada", "Dacia":"dacia", "Smart":"smart", "Vauxhall":"vauxhall",
  "Lotus":"lotus", "McLaren":"mclaren", "Bugatti":"bugatti", "Koenigsegg":"koenigsegg", "Pagani":"pagani",
  "TVR":"tvr", "Morgan":"morgan", "Caterham":"caterham", "Abarth":"abarth", "Alpine":"alpine", "DS":"ds",
  "Lincoln":"lincoln", "Pontiac":"pontiac", "Oldsmobile":"oldsmobile", "Plymouth":"plymouth",
  "Hummer":"hummer", "Saturn":"saturn", "Ram":"ram", "DeLorean":"delorean", "Studebaker":"studebaker",
  "Trabant":"trabant", "Simca":"simca", "Autobianchi":"autobianchi", "Holden":"holden", "Daewoo":"daewoo",
  "UAZ":"uaz", "Innocenti":"innocenti", "De Tomaso":"de-tomaso", "Spyker":"spyker", "Wiesmann":"wiesmann",
  "Borgward":"borgward", "NSU":"nsu", "Rover":"rover", "Zastava":"zastava", "Talbot":"talbot"
};

function buildLogoUri(brand){
  const file = LOGO_FILE_BY_BRAND[brand];
  return `assets/logos/${file}.png`;
}
