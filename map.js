/* PRIME — mapa interactivo (Leaflet) */

/* ---------- 1. MAPA DE FONDO ----------
   Mapa estándar de OpenStreetMap: no pide clave.
   (Si prefieres CARTO, saca tu clave gratis en carto.com/basemaps/apikey y usa:
    "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=TU_CLAVE"
    con subdomains: "abcd") */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_OPTIONS = {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

/* ---------- 2. CATEGORÍAS ---------- */
const CATEGORIES = [
  { id: "football",   label: "Football",        color: "#16a34a" },
  { id: "baseball",   label: "Baseball",        color: "#dc2626" },
  { id: "multi",      label: "Multi-sport",     color: "#2563eb" },
  { id: "futsal",     label: "Futsal / Indoor", color: "#ea580c" },
  { id: "fitness",    label: "Fitness / Gym",   color: "#7c3aed" },
  { id: "gymnastics", label: "Gymnastics",      color: "#db2777" }
];

/* ---------- 3. LUGARES ----------
   OJO: las coordenadas (lat, lng) son APROXIMADAS.
   Para ponerlas exactas: en Google Maps, clic derecho sobre el lugar,
   toca los números que aparecen y pégalos aquí. */
const SPACES = [
  { id: "agustin", cat: "football", name: 'Estadio Agustín "Muquita" Sánchez',
    address: "Calle Matuna, Barrio Colón, La Chorrera",
    desc: 'Historic football stadium since 1963, known locally as "La Cancha de La Cocobola".',
    tags: ["~5,000"], lat: 8.8815, lng: -79.7795 },

  { id: "mariano", cat: "baseball", name: "Estadio Mariano Rivera",
    address: "La Chorrera, Panamá Oeste (under construction)",
    desc: "New baseball stadium and High Performance Baseball Center under construction in the district of La Chorrera.",
    tags: ["In progress"], lat: 8.8720, lng: -79.7770 },

  { id: "28nov", cat: "multi", name: "Complejo Deportivo 28 de Noviembre",
    address: "Calle 21, Barrio Colón, La Chorrera",
    desc: "Renovated municipal sports complex featuring a synthetic football pitch and a recreational court.",
    tags: ["350 seated"], lat: 8.8790, lng: -79.7810 },

  { id: "municipal", cat: "multi", name: "Complejo Deportivo Municipal de La Chorrera",
    address: "Calle 34 y 35 Sur, Barrio Balboa, La Chorrera",
    desc: "Municipal sports complex in Barrio Balboa, near the Club de Leones de La Chorrera. Hosts local leagues.",
    tags: ["Open-air"], lat: 8.8715, lng: -79.7840 },

  { id: "aereas", cat: "futsal", name: "Canchas Aéreas Panamá Oeste",
    address: "Av. Libertador (frente a la E/S Delta), Barrio Colón, La Chorrera",
    desc: "First rooftop/aerial courts in Panamá Oeste. Rentable futsal courts with an on-site sports bar and restaurant.",
    tags: ["By reservation"], lat: 8.8830, lng: -79.7770 },

  { id: "smartfit", cat: "fitness", name: "Smart Fit Costa Verde",
    address: "C.C. Plaza Central, Vía Interamericana, Costa Verde",
    desc: "Modern fitness center in Plaza Central, Costa Verde. Equipped with cardio machines and free weights.",
    tags: ["Membership"], lat: 8.9160, lng: -79.7670 },

  { id: "fp", cat: "gymnastics", name: "FP Gimnasia — La Chorrera",
    address: "6ta Sur, La Chorrera, Panamá Oeste",
    desc: "Gymnastics training branch of the Federación Panameña de Gimnasia in La Chorrera.",
    tags: ["Class-based"], lat: 8.8765, lng: -79.7845 }
];

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catOf = id => CATEGORIES.find(c => c.id === id);
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* ---------- mapa ---------- */
const map = L.map("map", { zoomControl: true, scrollWheelZoom: true }).setView([8.8804, -79.7835], 14);
L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);

const markers = {};
let activeCat = "all";
let query = "";
let activeId = null;

function pinIcon(color) {
  return L.divIcon({
    className: "pin",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true">
      <path d="M15 1C7.8 1 2 6.8 2 14c0 9.6 13 25 13 25s13-15.4 13-25C28 6.8 22.2 1 15 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="15" cy="14" r="5" fill="#fff"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36]
  });
}

SPACES.forEach(s => {
  const c = catOf(s.cat);
  const m = L.marker([s.lat, s.lng], { icon: pinIcon(c.color), title: s.name, keyboard: true });
  m.bindPopup(
    `<div class="pop" style="--c:${c.color}">
       <span class="k">${esc(c.label)}</span>
       <h4>${esc(s.name)}</h4>
       <div class="a">${esc(s.address)}</div>
       <div class="d">${esc(s.desc)}</div>
       <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}">Open in Google Maps</a>
     </div>`,
    { autoPan: false, closeButton: true, offset: [0, 0] }
  );
  m.on("click", () => select(s.id, false));
  markers[s.id] = m;
});

/* ---------- filtros ---------- */
function visible() {
  const q = norm(query.trim());
  return SPACES.filter(s => {
    const okCat = activeCat === "all" || s.cat === activeCat;
    const okQ = !q || norm(s.name + " " + s.address + " " + s.desc + " " + catOf(s.cat).label).includes(q);
    return okCat && okQ;
  });
}

function renderPills() {
  $("pills").innerHTML =
    `<button type="button" class="pill ${activeCat === "all" ? "on" : ""}" data-c="all" style="--c:#111"><i></i>All</button>` +
    CATEGORIES.map(c =>
      `<button type="button" class="pill ${activeCat === c.id ? "on" : ""}" data-c="${c.id}" style="--c:${c.color}"><i></i>${esc(c.label)}</button>`
    ).join("");
}

function renderList(list) {
  $("count").textContent = list.length + (list.length === 1 ? " SPACE" : " SPACES");
  $("list").innerHTML = list.length
    ? list.map(s => {
        const c = catOf(s.cat);
        return `<div class="card ${s.id === activeId ? "on" : ""}" data-id="${s.id}" role="button" tabindex="0" style="--c:${c.color}">
          <h3><i></i><span>${esc(s.name)}</span></h3>
          <span class="adr">📍 ${esc(s.address)}</span>
          <p>${esc(s.desc)}</p>
          <div class="tags"><span class="tag cat">${esc(c.label)}</span>${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>`;
      }).join("")
    : `<div class="empty">No spaces match your search.</div>`;
}

function renderLegend() {
  $("legend").innerHTML = "<b>LEGEND</b>" +
    CATEGORIES.map(c => `<span style="--c:${c.color}"><i></i>${esc(c.label)}</span>`).join("");
}

function refresh(fit = true) {
  const list = visible();
  const ids = new Set(list.map(s => s.id));

  SPACES.forEach(s => {
    const m = markers[s.id];
    if (ids.has(s.id)) { if (!map.hasLayer(m)) m.addTo(map); }
    else { if (map.hasLayer(m)) map.removeLayer(m); }
  });

  if (activeId && !ids.has(activeId)) { activeId = null; map.closePopup(); }

  renderList(list);

  if (fit && list.length) {
    if (list.length === 1) {
      map.flyTo([list[0].lat, list[0].lng], 16, { duration: .8 });
    } else {
      map.flyToBounds(L.latLngBounds(list.map(s => [s.lat, s.lng])), { padding: [60, 60], maxZoom: 15, duration: .8 });
    }
  }
}

/* ---------- seleccionar un lugar ---------- */
function select(id, fly = true) {
  const s = SPACES.find(x => x.id === id);
  if (!s) return;

  if (activeId && markers[activeId] && markers[activeId]._icon) markers[activeId]._icon.classList.remove("on");
  activeId = id;

  const el = markers[id]._icon;
  if (el) el.classList.add("on");

  document.querySelectorAll(".card").forEach(c => c.classList.toggle("on", c.dataset.id === id));
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });

  if (fly) map.flyTo([s.lat, s.lng], 16, { duration: .9 });
  markers[id].openPopup();
}

/* ---------- eventos ---------- */
$("pills").addEventListener("click", e => {
  const b = e.target.closest(".pill");
  if (!b) return;
  activeCat = b.dataset.c;
  renderPills();
  refresh();
});

$("pl").onclick = () => $("pills").scrollBy({ left: -160, behavior: "smooth" });
$("pr").onclick = () => $("pills").scrollBy({ left: 160, behavior: "smooth" });

$("q").addEventListener("input", e => { query = e.target.value; refresh(); });
$("clear").onclick = () => { $("q").value = ""; query = ""; refresh(); $("q").focus(); };

$("list").addEventListener("click", e => {
  const c = e.target.closest(".card");
  if (c) select(c.dataset.id, true);
});
$("list").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const c = e.target.closest(".card");
  if (c) { e.preventDefault(); select(c.dataset.id, true); }
});

map.on("popupclose", () => {
  if (activeId && markers[activeId] && markers[activeId]._icon) markers[activeId]._icon.classList.remove("on");
});

/* ---------- inicio ---------- */
renderPills();
renderLegend();
refresh(true);
setTimeout(() => map.invalidateSize(), 200);
window.addEventListener("resize", () => map.invalidateSize());