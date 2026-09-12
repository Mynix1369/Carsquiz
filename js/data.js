// Datos de muestra (placeholders). Las imágenes/sonidos son generados por código,
// pero las marcas, modelos, países y años son datos reales para que el autocompletado funcione bien.

function normalize(str){
  return (str||"").toString()
    .trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g,""); // quita acentos
}

// marcas adicionales que solo aparecen en el modo "Logos" (no tienen fotos de coche,
// así que no forman parte de CARS) — algunas sí se usan también en Sonido (a través
// de LOGO_BRANDS, más abajo, en el campo de marca), porque el reto diario incluye
// fabricantes como Bugatti, Koenigsegg o Alpine que Identificar todavía no tiene.
const LOGO_ONLY_BRANDS = [
  "Isuzu", "Daihatsu", "Genesis", "Infiniti", "Acura", "Datsun", "Scion", "SsangYong",
  "Great Wall", "Haval", "BYD", "Geely", "MG", "Chery", "Tata", "Mahindra",
  "Proton", "Lada", "Dacia", "Smart", "Vauxhall", "Lotus", "McLaren", "Bugatti",
  "Koenigsegg", "Pagani", "TVR", "Morgan", "Caterham", "Abarth", "Alpine", "DS",
  "Lincoln", "Pontiac", "Oldsmobile", "Plymouth", "Hummer", "Saturn", "Ram", "DeLorean",
  "Studebaker", "Trabant", "Simca", "Autobianchi", "Holden", "Daewoo", "UAZ", "Innocenti",
  "De Tomaso", "Spyker", "Wiesmann", "Borgward", "NSU", "Rover", "Zastava", "Talbot"
];

// dificultad del modo "Logos": fácil = el nombre de la marca aparece en el propio logo;
// medio = solo el escudo/símbolo, pero de una marca muy conocida; difícil = escudo/símbolo
// de una marca poco conocida.
const LOGO_DIFFICULTY = {
  // ---- fácil: el logo lleva el nombre ----
  "Nissan":"easy", "Ford":"easy", "Dodge":"easy", "GMC":"easy", "Jeep":"easy", "Fiat":"easy",
  "Porsche":"easy", "Alfa Romeo":"easy", "Lamborghini":"easy", "BMW":"easy", "Lancia":"easy",
  "Peugeot":"easy", "Land Rover":"easy", "Mini":"easy", "Aston Martin":"easy", "Volvo":"easy",
  "Kia":"easy", "Saab":"easy", "Isuzu":"easy", "Daihatsu":"easy", "Datsun":"easy", "Scion":"easy",
  "Genesis":"easy", "Haval":"easy", "BYD":"easy", "MG":"easy", "Tata":"easy", "Mahindra":"easy",
  "Lotus":"easy", "Bugatti":"easy", "Pagani":"easy", "TVR":"easy", "Morgan":"easy",
  "Caterham":"easy", "Abarth":"easy", "Pontiac":"easy", "Hummer":"easy",
  "Studebaker":"easy", "Spyker":"easy", "Borgward":"easy", "NSU":"easy",

  // ---- medio: solo escudo/símbolo, pero de marca muy conocida ----
  "Toyota":"medium", "Honda":"medium", "Mazda":"medium", "Subaru":"medium", "Mitsubishi":"medium",
  "Suzuki":"medium", "Chevrolet":"medium", "Volkswagen":"medium", "Mercedes-Benz":"medium",
  "Audi":"medium", "Ferrari":"medium", "Renault":"medium", "Citroën":"medium", "Jaguar":"medium",
  "Tesla":"medium", "Lexus":"medium", "Chrysler":"medium", "Cadillac":"medium", "Hyundai":"medium",
  "Bentley":"medium", "Rolls-Royce":"medium", "Opel":"medium", "Maserati":"medium", "Skoda":"medium",
  "SEAT":"medium", "Infiniti":"medium", "McLaren":"medium", "DeLorean":"medium",

  // ---- difícil: escudo/símbolo de marca poco conocida ----
  "Buick":"hard", "Acura":"hard", "SsangYong":"hard", "Great Wall":"hard", "Geely":"hard",
  "Chery":"hard", "Proton":"hard", "Lada":"hard", "Dacia":"hard", "Smart":"hard", "Vauxhall":"hard",
  "Koenigsegg":"hard", "Alpine":"hard", "DS":"hard", "Lincoln":"hard", "Oldsmobile":"hard",
  "Saturn":"hard", "Ram":"hard", "Trabant":"hard", "Simca":"hard", "Autobianchi":"hard",
  "Holden":"hard", "UAZ":"hard", "Innocenti":"hard", "De Tomaso":"hard", "Wiesmann":"hard",
  "Zastava":"hard", "Talbot":"hard", "Plymouth":"hard", "Rover":"hard", "Daewoo":"hard"
};

const COUNTRIES = [
  "Japón", "Estados Unidos", "Alemania", "Italia", "Francia", "España",
  "Reino Unido", "Suecia", "República Checa", "Corea del Sur",
];

const BRAND_COUNTRY = {
  Toyota:"Japón", Honda:"Japón", Nissan:"Japón", Mazda:"Japón", Subaru:"Japón",
  Mitsubishi:"Japón", Suzuki:"Japón", Lexus:"Japón",
  Ford:"Estados Unidos", Chevrolet:"Estados Unidos", Tesla:"Estados Unidos",
  Chrysler:"Estados Unidos", Dodge:"Estados Unidos", Jeep:"Estados Unidos",
  Cadillac:"Estados Unidos", GMC:"Estados Unidos", Buick:"Estados Unidos",
  Volkswagen:"Alemania", BMW:"Alemania", "Mercedes-Benz":"Alemania", Audi:"Alemania",
  Porsche:"Alemania", Opel:"Alemania",
  Fiat:"Italia", "Alfa Romeo":"Italia", Ferrari:"Italia", Lamborghini:"Italia",
  Maserati:"Italia", Lancia:"Italia",
  Renault:"Francia", Peugeot:"Francia", "Citroën":"Francia",
  SEAT:"España",
  Mini:"Reino Unido", Jaguar:"Reino Unido", "Land Rover":"Reino Unido",
  "Aston Martin":"Reino Unido", Bentley:"Reino Unido", "Rolls-Royce":"Reino Unido",
  Volvo:"Suecia", Saab:"Suecia",
  Skoda:"República Checa",
  Hyundai:"Corea del Sur", Kia:"Corea del Sur",
};

// coches "objetivo" que aparecen en las rondas de juego
const CARS = [
  { id:"c1",  brand:"Toyota",       model:"Corolla",      year:1966, part:"faro",
    image:"assets/cars/c1.jpg", focus:{x:69,y:59}, credit:"Foto: Mytho88 (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c2",  brand:"Ford",         model:"Mustang",       year:1964, part:"parrilla",
    image:"assets/cars/c2.jpg", focus:{x:42,y:60}, credit:"Foto: Ermell (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c3",  brand:"Volkswagen",   model:"Escarabajo",     year:1938, part:"rueda",
    image:"assets/cars/c3.jpg", focus:{x:63,y:87}, credit:"Foto: AlfvanBeem (CC0), Wikimedia Commons" },
  { id:"c4",  brand:"Fiat",         model:"500",             year:1957, part:"rueda",
    image:"assets/cars/c4.jpg", focus:{x:21,y:71}, credit:"Foto: nakhon100 (CC-BY 2.0), Wikimedia Commons" },
  { id:"c5",  brand:"Renault",      model:"4",                year:1961, part:"parrilla",
    image:"assets/cars/c5.jpg", focus:{x:13,y:59}, credit:"Foto: Trop86 (CC0), Wikimedia Commons" },
  { id:"c6",  brand:"SEAT",         model:"Ibiza",             year:1984, part:"parrilla",
    image:"assets/cars/c6.jpg", focus:{x:50,y:62}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c7",  brand:"Chevrolet",    model:"Camaro",             year:1966, part:"parrilla",
    image:"assets/cars/c7.jpg", focus:{x:29,y:70}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c8",  brand:"BMW",          model:"Serie 3",             year:1975, part:"parrilla",
    image:"assets/cars/c8.jpg", focus:{x:68,y:60}, credit:"Foto: Charlie (CC-BY 2.0), Wikimedia Commons" },
  { id:"c9",  brand:"Citroën",      model:"2CV",                  year:1948, part:"faro",
    image:"assets/cars/c9.jpg", focus:{x:47,y:55}, credit:"Foto: Chris Whippet (CC-BY-SA 2.0), Wikimedia Commons" },
  { id:"c10", brand:"Mini",         model:"Cooper",                year:1959, part:"parrilla",
    image:"assets/cars/c10.jpg", focus:{x:60,y:80}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c11", brand:"Alfa Romeo",   model:"Giulia",                  year:1962, part:"parrilla",
    image:"assets/cars/c11.jpg", focus:{x:74,y:68}, credit:"Foto: AlfvanBeem (CC0), Wikimedia Commons" },
  { id:"c12", brand:"Porsche",      model:"911",                      year:1963, part:"rueda",
    image:"assets/cars/c12.jpg", focus:{x:67,y:51}, credit:"Foto: Alf van Beem (CC0), Wikimedia Commons" },
  { id:"c13", brand:"BMW",          model:"i8",                        year:2014, part:"rueda",
    image:"assets/cars/c13.jpg", focus:{x:84,y:80}, credit:"Foto: Ermell (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c14", brand:"Audi",         model:"TT",                         year:1998, part:"parrilla",
    image:"assets/cars/c14.jpg", focus:{x:73,y:61}, credit:"Foto: Tokumeigakarinoaoshima (CC0), Wikimedia Commons" },
  { id:"c15", brand:"Peugeot",      model:"205",                         year:1983, part:"rueda",
    image:"assets/cars/c15.jpg", focus:{x:44,y:83}, credit:"Foto: Kieran White (CC-BY 2.0), Wikimedia Commons" },
  { id:"c16", brand:"Skoda",        model:"Octavia",                      year:1996, part:"rueda",
    image:"assets/cars/c16.jpg", focus:{x:41,y:64}, credit:"Foto: Thomas doerfer (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c17", brand:"Volvo",        model:"240",                           year:1974, part:"faro",
    image:"assets/cars/c17.jpg", focus:{x:13,y:63}, credit:"Foto: nakhon100 (CC-BY 2.0), Wikimedia Commons" },
  { id:"c18", brand:"Nissan",       model:"GT-R",                           year:2007, part:"parrilla",
    image:"assets/cars/c18.jpg", focus:{x:57,y:62}, credit:"Foto: 先従隗始 (CC0), Wikimedia Commons" },
  { id:"c19", brand:"Mazda",        model:"MX-5",                            year:1989, part:"espejo",
    image:"assets/cars/c19.jpg", focus:{x:73,y:33}, credit:"Foto: Elise240SX (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c20", brand:"Jeep",         model:"Wrangler",                         year:1986, part:"espejo",
    image:"assets/cars/c20.jpg", focus:{x:40,y:38}, credit:"Foto: Oleg Yunakov (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c21", brand:"Tesla",        model:"Model S",                           year:2012, part:"faro",
    image:"assets/cars/c21.jpg", focus:{x:25,y:57}, credit:"Foto: Ominae (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c22", brand:"Ferrari",      model:"Testarossa",                         year:1984, part:"parrilla",
    image:"assets/cars/c22.jpg", focus:{x:13,y:61}, credit:"Foto: Vauxford (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c23", brand:"Lamborghini",  model:"Countach",                            year:1974, part:"faro",
    image:"assets/cars/c23.jpg", focus:{x:30,y:70}, credit:"Foto: David Merrett (CC-BY 2.0), Wikimedia Commons" },
  { id:"c24", brand:"Hyundai",      model:"Ioniq",                                year:2016, part:"rueda",
    image:"assets/cars/c24.jpg", focus:{x:54,y:80}, credit:"Foto: Damian B Oh (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c25", brand:"Honda",        model:"Civic",       year:1972, part:"faro",
    image:"assets/cars/c25.jpg", focus:{x:9,y:55}, credit:"Foto: Alf van Beem (CC0), Wikimedia Commons" },
  { id:"c26", brand:"Honda",        model:"NSX",          year:1991, part:"faro",
    image:"assets/cars/c26.jpg", focus:{x:69,y:70}, credit:"Foto: 先従隗始 (CC0), Wikimedia Commons" },
  { id:"c27", brand:"Mercedes-Benz",model:"Clase S",       year:1979, part:"parrilla",
    image:"assets/cars/c27.jpg", focus:{x:86,y:53}, credit:"Foto: nakhon100 (CC-BY 2.0), Wikimedia Commons" },
  { id:"c28", brand:"Mercedes-Benz",model:"Clase G",        year:1979, part:"faro",
    image:"assets/cars/c28.jpg", focus:{x:22,y:51}, credit:"Foto: Oleg Yunakov (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c29", brand:"Jaguar",       model:"E-Type",           year:1961, part:"faro",
    image:"assets/cars/c29.jpg", focus:{x:49,y:63}, credit:"Foto: Ermell (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c30", brand:"Land Rover",   model:"Defender",          year:1983, part:"espejo",
    image:"assets/cars/c30.jpg", focus:{x:32,y:30}, credit:"Foto: Christof46 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c31", brand:"Aston Martin", model:"DB9",                 year:2004, part:"parrilla",
    image:"assets/cars/c31.jpg", focus:{x:76,y:64}, credit:"Foto: TKOIII (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c32", brand:"Bentley",      model:"Continental",          year:1952, part:"parrilla",
    image:"assets/cars/c32.jpg", focus:{x:12,y:40}, credit:"Foto: MrWalkr (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c33", brand:"Saab",         model:"900",                   year:1978, part:"faro",
    image:"assets/cars/c33.jpg", focus:{x:18,y:71}, credit:"Foto: nakhon100 (CC-BY 2.0), Wikimedia Commons" },
  { id:"c34", brand:"Kia",          model:"Sportage",               year:1993, part:"rueda",
    image:"assets/cars/c34.jpg", focus:{x:57,y:66}, credit:"Foto: Two hundred percent (CC-BY-SA 2.5), Wikimedia Commons" },
  { id:"c35", brand:"Maserati",     model:"Ghibli",                  year:1967, part:"parrilla",
    image:"assets/cars/c35.jpg", focus:{x:29,y:77}, credit:"Foto: Greg Gjerdingen (CC-BY 2.0), Wikimedia Commons" },
  { id:"c36", brand:"Lancia",       model:"Delta",                    year:1979, part:"faro",
    image:"assets/cars/c36.jpg", focus:{x:8,y:61}, credit:"Foto: Tokumeigakarinoaoshima (CC0), Wikimedia Commons" },
  { id:"c37", brand:"Subaru",       model:"Impreza",                   year:1993, part:"faro",
    image:"assets/cars/c37.jpg", focus:{x:18,y:62}, credit:"Foto: 先従隗始 (CC0), Wikimedia Commons" },
  { id:"c38", brand:"Mitsubishi",   model:"Lancer",                     year:1992, part:"faro",
    image:"assets/cars/c38.jpg", focus:{x:42,y:75}, credit:"Foto: Rutger van der Maar (CC-BY 2.0), Wikimedia Commons" },
  { id:"c39", brand:"Suzuki",       model:"Jimny",                       year:1998, part:"rueda",
    image:"assets/cars/c39.jpg", focus:{x:61,y:82}, credit:"Foto: TTTNIS (CC0), Wikimedia Commons" },
  { id:"c40", brand:"Lexus",        model:"LS",                           year:1989, part:"parrilla",
    image:"assets/cars/c40.jpg", focus:{x:87,y:63}, credit:"Foto: Mohammed Hamad (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c41", brand:"Chrysler",     model:"300",                           year:1955, part:"parrilla",
    image:"assets/cars/c41.jpg", focus:{x:63,y:67}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c42", brand:"Dodge",        model:"Charger",                        year:1968, part:"faro",
    image:"assets/cars/c42.jpg", focus:{x:52,y:67}, credit:"Foto: AlfvanBeem (CC0), Wikimedia Commons" },
  { id:"c43", brand:"Cadillac",     model:"Escalade",                        year:1999, part:"espejo",
    image:"assets/cars/c43.jpg", focus:{x:79,y:30}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c44", brand:"GMC",          model:"Sierra",                           year:1988, part:"faro",
    image:"assets/cars/c44.jpg", focus:{x:21,y:73}, credit:"Foto: order_242 (CC-BY-SA 2.0), Wikimedia Commons" },
  { id:"c45", brand:"Buick",        model:"Regal",                             year:1973, part:"parrilla",
    image:"assets/cars/c45.jpg", focus:{x:87,y:54}, credit:"Foto: Crisco 1492 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c46", brand:"Opel",         model:"Manta",                              year:1970, part:"faro",
    image:"assets/cars/c46.jpg", focus:{x:62,y:59}, credit:"Foto: Alf van Beem (CC0), Wikimedia Commons" },
  { id:"c47", brand:"Toyota",       model:"Land Cruiser",                        year:1980, part:"rueda",
    image:"assets/cars/c47.jpg", focus:{x:44,y:77}, credit:"Foto: Vauxford (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c48", brand:"Porsche",      model:"Cayenne",                              year:2003, part:"parrilla",
    image:"assets/cars/c48.jpg", focus:{x:86,y:69}, credit:"Foto: JanST (CC-BY-SA 2.5), Wikimedia Commons" },
  { id:"c49", brand:"Volkswagen",   model:"Golf",                                  year:1976, part:"faro",
    image:"assets/cars/c49.jpg", focus:{x:68,y:76}, credit:"Foto: Riley (CC-BY 2.0), Wikimedia Commons" },
  { id:"c50", brand:"Ford",         model:"Fiesta",                                year:1976, part:"parrilla",
    image:"assets/cars/c50.jpg", focus:{x:63,y:57}, credit:"Foto: Kieran White (CC-BY 2.0), Wikimedia Commons" },
  { id:"c51", brand:"Toyota",       model:"Supra",       year:1993, part:"faro",
    image:"assets/cars/c51.jpg", focus:{x:15,y:61}, credit:"Foto: Jacob Frey 4A (CC-BY 2.0), Wikimedia Commons" },
  { id:"c52", brand:"Toyota",       model:"Yaris",        year:2000, part:"rueda",
    image:"assets/cars/c52.jpg", focus:{x:22,y:60}, credit:"Foto: Charles (CC-BY 2.0), Wikimedia Commons" },
  { id:"c53", brand:"Honda",        model:"Accord",        year:1990, part:"parrilla",
    image:"assets/cars/c53.jpg", focus:{x:44,y:63}, credit:"Foto: MattiPaavola (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c54", brand:"Honda",        model:"CR-V",            year:2000, part:"espejo",
    image:"assets/cars/c54.jpg", focus:{x:20,y:25}, credit:"Foto: Two hundred percent (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c55", brand:"Nissan",       model:"Micra",            year:1993, part:"espejo",
    image:"assets/cars/c55.jpg", focus:{x:12,y:32}, credit:"Foto: Calreyn88 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c56", brand:"Nissan",       model:"Juke",              year:2011, part:"espejo",
    image:"assets/cars/c56.jpg", focus:{x:78,y:20}, credit:"Foto: Tokumeigakarinoaoshima (CC0), Wikimedia Commons" },
  { id:"c57", brand:"Mazda",        model:"RX-7",               year:1993, part:"faro",
    image:"assets/cars/c57.jpg", focus:{x:35,y:76}, credit:"Foto: Kieran White (CC-BY 2.0), Wikimedia Commons" },
  { id:"c58", brand:"Mazda",        model:"3",                   year:2004, part:"parrilla",
    image:"assets/cars/c58.jpg", focus:{x:16,y:64}, credit:"Foto: Dinkun Chen (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c59", brand:"Subaru",       model:"BRZ",                  year:2013, part:"faro",
    image:"assets/cars/c59.jpg", focus:{x:47,y:55}, credit:"Foto: The359 (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c60", brand:"Subaru",       model:"Forester",              year:1998, part:"rueda",
    image:"assets/cars/c60.jpg", focus:{x:35,y:76}, credit:"Foto: Charles (CC-BY 2.0), Wikimedia Commons" },
  { id:"c61", brand:"Mitsubishi",   model:"Pajero",                 year:1991, part:"faro",
    image:"assets/cars/c61.jpg", focus:{x:41,y:59}, credit:"Foto: Dinkun Chen (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c62", brand:"Mitsubishi",   model:"Eclipse",                 year:1995, part:"rueda",
    image:"assets/cars/c62.jpg", focus:{x:69,y:76}, credit:"Foto: Tirefire5k (dominio público), Wikimedia Commons" },
  { id:"c63", brand:"Suzuki",       model:"Swift",                    year:1985, part:"faro",
    image:"assets/cars/c63.jpg", focus:{x:41,y:61}, credit:"Foto: Oimdudler (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c64", brand:"Suzuki",       model:"Vitara",                    year:1989, part:"rueda",
    image:"assets/cars/c64.jpg", focus:{x:44,y:79}, credit:"Foto: Just a Man (CC-BY 4.0), Wikimedia Commons" },
  { id:"c65", brand:"Lexus",        model:"IS",                          year:2001, part:"faro",
    image:"assets/cars/c65.jpg", focus:{x:40,y:51}, credit:"Foto: FotoSleuth (CC-BY 2.0), Wikimedia Commons" },
  { id:"c66", brand:"Lexus",        model:"RX",                           year:1998, part:"parrilla",
    image:"assets/cars/c66.jpg", focus:{x:78,y:58}, credit:"Foto: OWS Photography (CC-BY 4.0), Wikimedia Commons" },
  { id:"c67", brand:"Ford",         model:"Focus",                         year:1998, part:"rueda",
    image:"assets/cars/c67.jpg", focus:{x:58,y:84}, credit:"Foto: Vauxford (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c68", brand:"Ford",         model:"F-150",                          year:1990, part:"parrilla",
    image:"assets/cars/c68.jpg", focus:{x:8,y:61}, credit:"Foto: Mr.choppers (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c69", brand:"Chevrolet",    model:"Corvette",                        year:1968, part:"rueda",
    image:"assets/cars/c69.jpg", focus:{x:58,y:70}, credit:"Foto: Aos.1905 (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c70", brand:"Chevrolet",    model:"Malibu",                           year:1978, part:"parrilla",
    image:"assets/cars/c70.jpg", focus:{x:26,y:58}, credit:"Foto: Bull-Doser (dominio público), Wikimedia Commons" },
  { id:"c71", brand:"Tesla",        model:"Model 3",                           year:2017, part:"faro",
    image:"assets/cars/c71.jpg", focus:{x:44,y:55}, credit:"Foto: Carlquinn (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c72", brand:"Dodge",        model:"Challenger",                         year:1970, part:"faro",
    image:"assets/cars/c72.jpg", focus:{x:65,y:51}, credit:"Foto: Charles (CC-BY 2.0), Wikimedia Commons" },
  { id:"c73", brand:"Dodge",        model:"Viper",                               year:1992, part:"parrilla",
    image:"assets/cars/c73.jpg", focus:{x:82,y:68}, credit:"Foto: Elise240SX (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c74", brand:"Jeep",         model:"Grand Cherokee",                       year:1993, part:"espejo",
    image:"assets/cars/c74.jpg", focus:{x:65,y:50}, credit:"Foto: Christopher Ziemnowicz (CC0), Wikimedia Commons" },
  { id:"c75", brand:"Cadillac",     model:"CTS",                                   year:2003, part:"parrilla",
    image:"assets/cars/c75.jpg", focus:{x:18,y:65}, credit:"Foto: Rblimas (dominio público), Wikimedia Commons" },
  { id:"c76", brand:"GMC",          model:"Yukon",                                  year:1992, part:"faro",
    image:"assets/cars/c76.jpg", focus:{x:62,y:50}, credit:"Foto: Bull-Doser (dominio público), Wikimedia Commons" },
  { id:"c77", brand:"Volkswagen",   model:"Passat",                                 year:1974, part:"faro",
    image:"assets/cars/c77.jpg", focus:{x:72,y:52}, credit:"Foto: Jeremy, Sydney (CC-BY 2.0), Wikimedia Commons" },
  { id:"c78", brand:"Volkswagen",   model:"Tiguan",                                  year:2007, part:"parrilla",
    image:"assets/cars/c78.jpg", focus:{x:9,y:59}, credit:"Foto: EurovisionNim (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c79", brand:"BMW",          model:"Serie 1",                                  year:2004, part:"faro",
    image:"assets/cars/c79.jpg", focus:{x:68,y:56}, credit:"Foto: Wikimedia Commons (CC-BY-SA 3.0)" },
  { id:"c80", brand:"BMW",          model:"X5",                                        year:1999, part:"rueda",
    image:"assets/cars/c80.jpg", focus:{x:46,y:78}, credit:"Foto: Ethan Llamas (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c81", brand:"BMW",          model:"M3",                                         year:1986, part:"faro",
    image:"assets/cars/c81.jpg", focus:{x:83,y:58}, credit:"Foto: MrWalkr (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c82", brand:"Mercedes-Benz",model:"Clase E",                                     year:1985, part:"parrilla",
    image:"assets/cars/c82.jpg", focus:{x:26,y:57}, credit:"Foto: Ethan Llamas (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c83", brand:"Audi",         model:"A4",                                           year:1994, part:"faro",
    image:"assets/cars/c83.jpg", focus:{x:19,y:52}, credit:"Foto: Vauxford (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c84", brand:"Audi",         model:"R8",                                            year:2006, part:"parrilla",
    image:"assets/cars/c84.jpg", focus:{x:4,y:72}, credit:"Foto: Matti Blume (CC-BY 2.0 de), Wikimedia Commons" },
  { id:"c85", brand:"Porsche",      model:"Panamera",                                      year:2009, part:"faro",
    image:"assets/cars/c85.jpg", focus:{x:28,y:56}, credit:"Foto: Tokumeigakarinoaoshima (CC0), Wikimedia Commons" },
  { id:"c86", brand:"Opel",         model:"Corsa",                                          year:1982, part:"faro",
    image:"assets/cars/c86.jpg", focus:{x:32,y:46}, credit:"Foto: Skonrad (dominio público), Wikimedia Commons" },
  { id:"c87", brand:"Fiat",         model:"Panda",                                           year:1980, part:"faro",
    image:"assets/cars/c87.jpg", focus:{x:29,y:58}, credit:"Foto: Gravitatas (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c88", brand:"Fiat",         model:"124 Spider",                                       year:1966, part:"faro",
    image:"assets/cars/c88.jpg", focus:{x:80,y:46}, credit:"Foto: Mr.choppers (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c89", brand:"Alfa Romeo",   model:"Spider",                                            year:1966, part:"faro",
    image:"assets/cars/c89.jpg", focus:{x:9,y:42}, credit:"Foto: Zairon (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c90", brand:"Ferrari",      model:"F40",                                                year:1987, part:"rueda",
    image:"assets/cars/c90.jpg", focus:{x:52,y:74}, credit:"Foto: Mr.choppers (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c91", brand:"Lamborghini",  model:"Huracán",                                            year:2014, part:"parrilla",
    image:"assets/cars/c91.jpg", focus:{x:59,y:58}, credit:"Foto: Wikimedia Commons (dominio público, CC0)" },
  { id:"c92", brand:"Maserati",     model:"Quattroporte",                                        year:1976, part:"parrilla",
    image:"assets/cars/c92.jpg", focus:{x:41,y:53}, credit:"Foto: Koreller (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c93", brand:"Renault",      model:"5",                                                     year:1972, part:"rueda",
    image:"assets/cars/c93.jpg", focus:{x:41,y:80}, credit:"Foto: Spanish Coches (CC-BY 2.0), Wikimedia Commons" },
  { id:"c94", brand:"Renault",      model:"Twingo",                                                 year:1993, part:"faro",
    image:"assets/cars/c94.jpg", focus:{x:18,y:61}, credit:"Foto: Thomas Doerfer (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c95", brand:"Peugeot",      model:"206",                                                     year:1998, part:"faro",
    image:"assets/cars/c95.jpg", focus:{x:31,y:54}, credit:"Foto: Wikimedia Commons (dominio público, CC0)" },
  { id:"c96", brand:"SEAT",         model:"León",                                                     year:1999, part:"faro",
    image:"assets/cars/c96.jpg", focus:{x:33,y:65}, credit:"Foto: Thomas Doerfer (CC-BY-SA 3.0), Wikimedia Commons" },
  { id:"c97", brand:"Mini",         model:"Countryman",                                                year:2010, part:"rueda",
    image:"assets/cars/c97.jpg", focus:{x:40,y:77}, credit:"Foto: Elise240SX (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c98", brand:"Jaguar",       model:"F-Type",                                                     year:2013, part:"espejo",
    image:"assets/cars/c98.jpg", focus:{x:70,y:32}, credit:"Foto: Elise240SX (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c99", brand:"Land Rover",   model:"Range Rover",                                                 year:1970, part:"rueda",
    image:"assets/cars/c99.jpg", focus:{x:44,y:76}, credit:"Foto: Mr.choppers (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c100",brand:"Rolls-Royce",  model:"Phantom",                                                      year:1975, part:"parrilla",
    image:"assets/cars/c100.jpg", focus:{x:78,y:51}, credit:"Foto: ZidaneHartono (CC-BY-SA 4.0), Wikimedia Commons" },
  { id:"c101",brand:"Citroën",      model:"DS",                                                           year:1969, part:"faro",
    image:"assets/cars/c101.jpg", focus:{x:39,y:61}, credit:"Foto: PlotagonNoah (CC-BY-SA 4.0), Wikimedia Commons" },
].map(c => ({ ...c, country: BRAND_COUNTRY[c.brand] }));

// posiciones (en % de object-position) para cada tipo de "parte" en la ilustración placeholder.
// Nota: nunca usamos el emblema/logo como "parte" a mostrar, precisamente para poder garantizar
// que no se vea la marca en ningún intento ni dificultad.
const PART_FOCUS = {
  faro:     { x: 22.5, y: 55 },
  parrilla: { x: 50,   y: 56 },
  espejo:   { x: 35,   y: 45 },
  rueda:    { x: 77.5, y: 72 },
};

const PART_LABELS = {
  faro: "faro",
  parrilla: "parrilla",
  espejo: "retrovisor",
  rueda: "llanta",
};

const MAX_ATTEMPTS = 5;

// margen de años que se acepta como válido, según la dificultad
const YEAR_TOLERANCE = { easy: 5, medium: 3, hard: 2 };

// puntuación máxima alcanzable en una ronda perfecta del modo "identifica el coche",
// según la dificultad (para que el fácil no valga lo mismo que el difícil)
const DIFFICULTY_MAX_SCORE = { easy: 100, medium: 200, hard: 300 };

// bono de velocidad (estilo Kahoot): si respondes en menos de "full" segundos te llevas
// el 100% de los puntos de esa respuesta; entre "full" y "zero" el bono baja en línea recta
// hasta SPEED_BONUS_FLOOR. Las ventanas son más largas cuanto más difícil, porque hay más
// que pensar/escribir (identify: 4 campos; logo: solo reconocer y escribir la marca).
const SPEED_BONUS = {
  identify: {
    easy:   { full: 10, zero: 30 },
    medium: { full: 16, zero: 45 },
    hard:   { full: 24, zero: 65 },
  },
  logo: {
    easy:   { full: 5,  zero: 18 },
    medium: { full: 8,  zero: 25 },
    hard:   { full: 12, zero: 35 },
  },
  sound: { full: 30, zero: 75 },
};
const SPEED_BONUS_FLOOR = 0.5;

// margen de años y puntuación máxima del "sonido del día" (sin niveles de dificultad:
// todo el mundo escucha el mismo sonido, con la misma tolerancia)
const SOUND_YEAR_TOLERANCE = 3;
const SOUND_MAX_SCORE = 100;

// sonidos reales de motor (Wikimedia Commons, CC BY / CC BY-SA / dominio público). Cada día
// se elige uno solo (ver getTodaysSoundCar() en game.js): el orden de este array ya está
// barajado una vez a propósito, así que recorrerlo en orden con la fecha da una sensación
// aleatoria (no sale en el mismo orden s1,s2,s3...) y, al ser una vuelta completa a la
// lista, garantiza 60 días como mínimo entre dos apariciones del mismo sonido (por encima
// del mínimo de 30 días pedido).
const SOUND_CARS = [
  { id:"s54", brand:"Morgan", model:"Super Aero", year:1928, country:"Reino Unido",
    sound:"assets/sounds/s54.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s9", brand:"Ferrari", model:"458 Italia", year:2009, country:"Italia",
    sound:"assets/sounds/s9.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s28", brand:"Peugeot", model:"207 S2000", year:2010, country:"Francia",
    sound:"assets/sounds/s28.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s26", brand:"Audi", model:"R8 LMS", year:2010, country:"Alemania",
    sound:"assets/sounds/s26.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s41", brand:"Bentley", model:"Speed 8", year:2003, country:"Reino Unido",
    sound:"assets/sounds/s41.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s52", brand:"Maserati", model:"250F", year:1957, country:"Italia",
    sound:"assets/sounds/s52.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s6", brand:"Aston Martin", model:"V12 Vantage", year:2009, country:"Reino Unido",
    sound:"assets/sounds/s6.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s60", brand:"Ferrari", model:"250 GT Breadvan", year:1961, country:"Italia",
    sound:"assets/sounds/s60.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s17", brand:"Volvo", model:"C30 Polestar", year:2010, country:"Suecia",
    sound:"assets/sounds/s17.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s2", brand:"Tesla", model:"Roadster", year:2008, country:"Estados Unidos",
    sound:"assets/sounds/s2.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s56", brand:"Porsche", model:"Boxster 987 S", year:2007, country:"Alemania",
    sound:"assets/sounds/s56.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s58", brand:"Toyota", model:"Celica GT-Four ST205", year:1995, country:"Japón",
    sound:"assets/sounds/s58.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s34", brand:"Alfa Romeo", model:"Tipo 33/2", year:1968, country:"Italia",
    sound:"assets/sounds/s34.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s49", brand:"Chevrolet", model:"Corvette Grand Sport", year:1963, country:"Estados Unidos",
    sound:"assets/sounds/s49.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s16", brand:"Lamborghini", model:"Aventador", year:2011, country:"Italia",
    sound:"assets/sounds/s16.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s46", brand:"Audi", model:"Sport Quattro S1", year:1985, country:"Alemania",
    sound:"assets/sounds/s46.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s50", brand:"Ferrari", model:"F430", year:2010, country:"Italia",
    sound:"assets/sounds/s50.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s55", brand:"Peugeot", model:"908 HDi FAP", year:2009, country:"Francia",
    sound:"assets/sounds/s55.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s27", brand:"BMW", model:"M3 GT2", year:2010, country:"Alemania",
    sound:"assets/sounds/s27.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s12", brand:"Lexus", model:"LFA", year:2010, country:"Japón",
    sound:"assets/sounds/s12.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s33", brand:"Lotus", model:"Evora", year:2009, country:"Reino Unido",
    sound:"assets/sounds/s33.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s11", brand:"Lamborghini", model:"Gallardo Superleggera", year:2010, country:"Italia",
    sound:"assets/sounds/s11.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s38", brand:"Mitsubishi", model:"Lancer Evolution IX", year:2005, country:"Japón",
    sound:"assets/sounds/s38.mp3", credit:"Sonido: Antti Leppänen (CC BY 4.0), Wikimedia Commons" },
  { id:"s53", brand:"Mercedes-Benz", model:"CLK LM", year:1998, country:"Alemania",
    sound:"assets/sounds/s53.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s57", brand:"Skoda", model:"Fabia R5", year:2023, country:"República Checa",
    sound:"assets/sounds/s57.mp3", credit:"Sonido: Antti Leppänen (CC BY 4.0), Wikimedia Commons" },
  { id:"s36", brand:"Volkswagen", model:"Escarabajo", year:1970, country:"Alemania",
    sound:"assets/sounds/s36.mp3", credit:"Sonido: Work With Sounds / Technical Museum of Slovenia (CC BY 4.0), Wikimedia Commons" },
  { id:"s43", brand:"Pagani", model:"Zonda R", year:2009, country:"Italia",
    sound:"assets/sounds/s43.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s13", brand:"McLaren", model:"MP4-12C", year:2011, country:"Reino Unido",
    sound:"assets/sounds/s13.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s37", brand:"Toyota", model:"Corolla AE86", year:1985, country:"Japón",
    sound:"assets/sounds/s37.mp3", credit:"Sonido: Antti Leppänen (CC BY 4.0), Wikimedia Commons" },
  { id:"s40", brand:"Alpine", model:"A443", year:1978, country:"Francia",
    sound:"assets/sounds/s40.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s30", brand:"Skoda", model:"Fabia S2000", year:2010, country:"República Checa",
    sound:"assets/sounds/s30.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s24", brand:"Morgan", model:"Aero SuperSports", year:2010, country:"Reino Unido",
    sound:"assets/sounds/s24.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s8", brand:"Chevrolet", model:"Corvette ZR1", year:2009, country:"Estados Unidos",
    sound:"assets/sounds/s8.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s25", brand:"Jaguar", model:"D-Type", year:1956, country:"Reino Unido",
    sound:"assets/sounds/s25.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s39", brand:"Nissan", model:"Micra K13", year:2010, country:"Japón",
    sound:"assets/sounds/s39.mp3", credit:"Sonido: Oq10pass (CC0), Wikimedia Commons" },
  { id:"s31", brand:"Citroën", model:"GT", year:2008, country:"Francia",
    sound:"assets/sounds/s31.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s4", brand:"Jaguar", model:"XKR", year:2009, country:"Reino Unido",
    sound:"assets/sounds/s4.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s42", brand:"De Tomaso", model:"Pantera", year:1974, country:"Italia",
    sound:"assets/sounds/s42.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s44", brand:"Dodge", model:"Challenger", year:2015, country:"Estados Unidos",
    sound:"assets/sounds/s44.mp3", credit:"Sonido: Axepas12 (CC BY-SA 4.0), Wikimedia Commons" },
  { id:"s15", brand:"Porsche", model:"911 GT3 RS", year:2006, country:"Alemania",
    sound:"assets/sounds/s15.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s32", brand:"Koenigsegg", model:"Agera", year:2010, country:"Suecia",
    sound:"assets/sounds/s32.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s47", brand:"BMW", model:"V12 LMR", year:1999, country:"Alemania",
    sound:"assets/sounds/s47.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s23", brand:"Bugatti", model:"Veyron Grand Sport", year:2009, country:"Francia",
    sound:"assets/sounds/s23.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s59", brand:"Alfa Romeo", model:"155 DTM", year:1993, country:"Italia",
    sound:"assets/sounds/s59.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s10", brand:"Ferrari", model:"599 GTO", year:2010, country:"Italia",
    sound:"assets/sounds/s10.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s21", brand:"Mercedes-Benz", model:"W154", year:1938, country:"Alemania",
    sound:"assets/sounds/s21.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s22", brand:"Vauxhall", model:"VXR8 Bathurst S", year:2010, country:"Reino Unido",
    sound:"assets/sounds/s22.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s5", brand:"Nissan", model:"GT-R SpecV", year:2009, country:"Japón",
    sound:"assets/sounds/s5.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s35", brand:"Volkswagen", model:"Scirocco R", year:2010, country:"Alemania",
    sound:"assets/sounds/s35.mp3", credit:"Sonido: myvolkswagen (Public domain), Wikimedia Commons" },
  { id:"s48", brand:"Bugatti", model:"Type 51", year:1931, country:"Francia",
    sound:"assets/sounds/s48.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s3", brand:"Porsche", model:"911 R", year:1967, country:"Alemania",
    sound:"assets/sounds/s3.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s19", brand:"Ferrari", model:"F355", year:1994, country:"Italia",
    sound:"assets/sounds/s19.mp3", credit:"Sonido: enginemusic (CC BY 3.0), Wikimedia Commons" },
  { id:"s18", brand:"Honda", model:"S2000", year:2002, country:"Japón",
    sound:"assets/sounds/s18.mp3", credit:"Sonido: Tyler Riddle (CC BY 3.0), Wikimedia Commons" },
  { id:"s1", brand:"Ford", model:"Focus RS", year:2009, country:"Estados Unidos",
    sound:"assets/sounds/s1.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s7", brand:"Aston Martin", model:"Rapide", year:2010, country:"Reino Unido",
    sound:"assets/sounds/s7.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s14", brand:"Mercedes-Benz", model:"SLS AMG", year:2010, country:"Alemania",
    sound:"assets/sounds/s14.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s51", brand:"Jaguar", model:"XJR-9", year:1987, country:"Reino Unido",
    sound:"assets/sounds/s51.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s20", brand:"Maserati", model:"GranTurismo S", year:2008, country:"Italia",
    sound:"assets/sounds/s20.mp3", credit:"Sonido: lmartins (CC BY 4.0), Wikimedia Commons" },
  { id:"s45", brand:"Ford", model:"RS200", year:1986, country:"Estados Unidos",
    sound:"assets/sounds/s45.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
  { id:"s29", brand:"Renault", model:"5 Maxi Turbo", year:1985, country:"Francia",
    sound:"assets/sounds/s29.mp3", credit:"Sonido: Edvvc (CC BY-SA 3.0), Wikimedia Commons" },
];

// BRAND_MODELS (el autocompletado de "modelo" de Identificar y Sonido) parte de los
// coches reales de CARS + SOUND_CARS, en vez de mantenerse solo a mano: una lista
// escrita a mano se queda desincronizada en cuanto se añade un coche nuevo a
// cualquiera de los dos modos — de hecho así se encontró que 57 de los 60 coches de
// Sonido (los de motorsport/edición especial, tipo "911 GT3 RS" o "M3 GT2") no salían
// como sugerencia porque la lista original solo se había pensado para Identificar.
// Calculándolo así, cualquier coche que se añada en el futuro queda cubierto solo.
const BRAND_MODELS = {};
[...CARS, ...SOUND_CARS].forEach(({ brand, model }) => {
  if(!BRAND_MODELS[brand]) BRAND_MODELS[brand] = [];
  if(!BRAND_MODELS[brand].includes(model)) BRAND_MODELS[brand].push(model);
});

// además de los modelos que realmente salen a jugar, conviene tener "de relleno" para
// que el autocompletado no se quede corto ni delate la respuesta con muy pocas
// opciones — modelos reales de cada marca que hoy no aparecen en ningún coche del
// juego. Se añaden después de los reales y solo si no estaban ya, para que cada marca
// llegue a un mínimo de 10 opciones de modelo.
const FILLER_MODELS = {
  "Alfa Romeo": ["Giulietta", "156", "159", "Brera", "GTV", "MiTo"],
  "Alpine": ["A110", "A310", "A610", "GTA", "A108", "V6 Turbo", "A310 V6", "A106", "A210"],
  "Aston Martin": ["DB5", "DB7", "Vantage", "Vanquish", "DBX", "Valkyrie", "DB11"],
  "Audi": ["A3", "A6", "Q5", "Q7", "e-tron", "S4", "RS6"],
  "BMW": ["Serie 5", "Serie 7", "M5", "Z4", "X3", "X1"],
  "Bentley": ["Continental GT", "Bentayga", "Flying Spur", "Mulsanne", "Arnage", "Brooklands", "Azure", "Turbo R"],
  "Bugatti": ["Chiron", "EB110", "Veyron", "Divo", "Type 35", "Type 57", "Royale", "Baby II"],
  "Buick": ["Riviera", "Skylark", "LeSabre", "Century", "Roadmaster", "Electra", "GNX", "Encore", "Envision"],
  "Cadillac": ["DeVille", "Seville", "Eldorado", "ATS", "XT4", "CT5", "Fleetwood", "Allante"],
  "Chevrolet": ["Impala", "Bel Air", "Silverado", "Suburban", "Blazer"],
  "Chrysler": ["PT Cruiser", "Sebring", "300M", "Town & Country", "Voyager", "Crossfire", "LHS", "Concorde", "Imperial"],
  "Citroën": ["C3", "C4", "Berlingo", "DS3", "Xsara", "Saxo", "Picasso"],
  "De Tomaso": ["Mangusta", "Vallelunga", "Guarà", "Deauville", "Longchamp", "Bigua", "Pantera GT5", "Nomad", "P72"],
  "Dodge": ["Ram", "Durango", "Journey", "Neon", "Dart", "Nitro", "Avenger"],
  "Ferrari": ["488", "Portofino", "Roma"],
  "Fiat": ["Punto", "Tipo", "600", "Multipla", "Uno", "Cinquecento", "Doblò"],
  "Ford": ["Escort", "Ka", "Puma", "Ranger"],
  "GMC": ["Suburban", "Canyon", "Acadia", "Terrain", "Envoy", "Jimmy", "Savana", "Hummer EV"],
  "Honda": ["Jazz", "Fit", "HR-V", "Prelude", "Integra"],
  "Hyundai": ["i20", "Tucson", "Santa Fe", "Elantra", "Kona", "Accent", "Sonata", "Veloster", "Genesis Coupe"],
  "Jaguar": ["XE", "XF", "XJ", "S-Type", "I-Pace"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Gladiator", "Wagoneer", "Commander", "Patriot", "CJ-5"],
  "Kia": ["Rio", "Ceed", "Picanto", "Optima", "Soul", "Stinger", "Niro", "Telluride", "Seltos"],
  "Koenigsegg": ["CCX", "Regera", "Jesko", "One:1", "CC8S", "Gemera", "CCR", "Agera R", "Agera RS"],
  "Lamborghini": ["Diablo", "Murciélago", "Urus", "Miura", "Espada", "Jalpa"],
  "Lancia": ["Ypsilon", "Stratos", "Fulvia", "Beta", "Thema", "Dedra", "Kappa", "Musa", "Thesis"],
  "Land Rover": ["Discovery", "Evoque", "Freelander", "Discovery Sport", "Velar", "Series I", "LR3", "LR4"],
  "Lexus": ["RX", "GS", "ES", "NX", "UX", "CT", "LC500"],
  "Lotus": ["Elise", "Exige", "Esprit", "Europa", "Elan", "Emira", "Elite", "Excel", "Carlton"],
  "Maserati": ["Levante", "GranTurismo", "Bora", "Merak", "Biturbo", "MC20"],
  "Mazda": ["CX-5", "2", "6", "CX-30", "CX-9", "Tribute", "626"],
  "McLaren": ["720S", "570S", "P1", "F1", "650S", "Senna", "GT", "Artura", "675LT"],
  "Mercedes-Benz": ["Clase A", "GLA", "GLC", "EQS"],
  "Mini": ["Clubman", "Paceman", "Coupe", "Roadster", "Traveller", "Moke", "Cooper S", "One"],
  "Mitsubishi": ["Outlander", "Colt", "Galant", "ASX", "Mirage", "3000GT"],
  "Morgan": ["Plus 4", "Plus 8", "Roadster", "3 Wheeler", "4/4", "Plus Six", "Aero 8", "Eva GT"],
  "Nissan": ["Qashqai", "Leaf", "350Z", "Sentra", "Altima"],
  "Opel": ["Astra", "Insignia", "Kadett", "Vectra", "Ampera", "Zafira", "Mokka", "Meriva"],
  "Pagani": ["Huayra", "Utopia", "Zonda F", "Zonda C12", "Huayra BC", "Huayra R", "Zonda Cinque", "Zonda S", "Zonda Tricolore"],
  "Peugeot": ["208", "308", "3008", "106", "306", "405"],
  "Porsche": ["Macan", "718 Cayman", "Taycan", "928"],
  "Renault": ["Clio", "Megane", "Captur", "Scenic", "Kadjar", "Espace"],
  "Rolls-Royce": ["Ghost", "Cullinan", "Silver Shadow", "Silver Cloud", "Wraith", "Corniche", "Dawn", "Silver Spirit", "Camargue"],
  "SEAT": ["Arona", "Ateca", "Marbella", "Toledo", "Alhambra", "Cordoba", "Panda", "Ronda"],
  "Saab": ["9-3", "9-5", "99", "96", "9000", "Sonett", "90", "9-2X", "9-4X"],
  "Skoda": ["Fabia", "Superb", "Kodiaq", "Rapid", "Yeti", "Karoq", "Roomster"],
  "Subaru": ["Outback", "Legacy", "WRX", "XV", "Ascent", "Tribeca", "Baja"],
  "Suzuki": ["Ignis", "Alto", "Baleno", "Grand Vitara", "Celerio", "SX4", "Splash"],
  "Tesla": ["Model X", "Model Y", "Cybertruck", "Semi", "Model S Plaid", "Model 3 Performance", "Model X Plaid"],
  "Toyota": ["Camry", "RAV4", "Hilux", "Prius"],
  "Vauxhall": ["Astra", "Corsa", "Insignia", "Nova", "Cavalier", "Viva", "Chevette", "Vectra", "Zafira"],
  "Volkswagen": ["Polo", "Up!", "Jetta", "Touareg", "Sharan"],
  "Volvo": ["XC60", "XC90", "S60", "V40", "850", "940", "Amazon", "PV544"],
};
Object.entries(FILLER_MODELS).forEach(([brand, models]) => {
  if(!BRAND_MODELS[brand]) BRAND_MODELS[brand] = [];
  models.forEach(model => {
    if(!BRAND_MODELS[brand].includes(model)) BRAND_MODELS[brand].push(model);
  });
});

const BRANDS = Object.keys(BRAND_MODELS);

// lista plana de modelos (para autocompletar cuando aún no se ha elegido marca)
const ALL_MODELS = [...new Set(Object.values(BRAND_MODELS).flat())];

const LOGO_BRANDS = [...BRANDS, ...LOGO_ONLY_BRANDS];

// nivel de zoom en cada intento (1 = imagen completa). Empieza muy recortado y se va revelando.
// Fácil: llega casi a ver el coche entero. Medio: se queda a media revelación. Difícil: siempre
// se queda muy recortado (nunca se acerca a ver el coche completo ni, por tanto, el logo/emblema).
const ZOOM_SCHEDULE = {
  easy:   [1.8, 1.6, 1.4, 1.2, 1.0],
  medium: [3.0, 2.6, 2.3, 2.0, 1.8],
  hard:   [5.0, 4.4, 3.9, 3.4, 3.0],
};
