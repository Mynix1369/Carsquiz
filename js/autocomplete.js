// Campo de texto con lista desplegable que filtra opciones mientras escribes.

function filterOptions(list, query, limit = 100){
  const q = normalize(query);
  if(!q) return [...list].sort((a,b) => a.localeCompare(b, "es"));
  const starts = [];
  const contains = [];
  list.forEach(item => {
    const n = normalize(item);
    if(n.startsWith(q)) starts.push(item);
    else if(n.includes(q)) contains.push(item);
  });
  starts.sort((a,b)=>a.localeCompare(b));
  contains.sort((a,b)=>a.localeCompare(b));
  return [...starts, ...contains].slice(0, limit);
}

// wrapperEl: contenedor .autocomplete con un <input> y un <div class="ac-list"> dentro
// getOptions: () => array de strings disponible en ese momento (puede cambiar dinámicamente, ej. según la marca elegida)
function attachAutocomplete(wrapperEl, getOptions, onSelect){
  const input = wrapperEl.querySelector("input");
  const list = wrapperEl.querySelector(".ac-list");
  let activeIndex = -1;

  function render(items){
    list.innerHTML = "";
    activeIndex = -1;
    if(items.length === 0){ list.classList.add("hidden"); return; }
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ac-item";
      row.textContent = item;
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = item;
        list.classList.add("hidden");
        if(onSelect) onSelect(item);
      });
      list.appendChild(row);
    });
    list.classList.remove("hidden");
  }

  input.addEventListener("input", () => {
    render(filterOptions(getOptions(), input.value));
    if(onSelect) onSelect(null); // el usuario está escribiendo, invalida la selección anterior
  });

  input.addEventListener("focus", () => {
    render(filterOptions(getOptions(), input.value));
  });

  input.addEventListener("blur", () => {
    setTimeout(() => list.classList.add("hidden"), 100);
  });

  input.addEventListener("keydown", (e) => {
    const items = Array.from(list.querySelectorAll(".ac-item"));
    if(items.length === 0 || list.classList.contains("hidden")) return;
    if(e.key === "ArrowDown"){
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      items.forEach((it,i)=>it.classList.toggle("active", i===activeIndex));
    } else if(e.key === "ArrowUp"){
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      items.forEach((it,i)=>it.classList.toggle("active", i===activeIndex));
    } else if(e.key === "Enter"){
      if(activeIndex >= 0){
        e.preventDefault();
        items[activeIndex].dispatchEvent(new Event("mousedown"));
      }
    }
  });
}
