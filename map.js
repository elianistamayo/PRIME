
const places = [
  {
    name: "Estadio Agustín 'Muquita' Sánchez",
    type: "Football",
    address: "Barrio Colón, La Chorrera",
    description: "Historic football stadium in La Chorrera.",
    lat: 8.879,
    lng: -79.783,
    status: "Football"
  },
  {
    name: "Estadio Mariano Rivera",
    type: "Baseball",
    address: "La Chorrera, Panamá Oeste",
    description: "Baseball stadium in La Chorrera.",
    lat: 8.885,
    lng: -79.784,
    status: "Baseball"
  },
  {
    name: "Complejo Deportivo 28 de Noviembre",
    type: "Multi-sport",
    address: "Barrio Colón, La Chorrera",
    description: "Municipal sports complex.",
    lat: 8.875,
    lng: -79.777,
    status: "Sports complex"
  },
  {
    name: "Complejo Deportivo Municipal de La Chorrera",
    type: "Multi-sport",
    address: "Barrio Balboa, La Chorrera",
    description: "Municipal sports facilities.",
    lat: 8.881,
    lng: -79.789,
    status: "Open-air"
  },
  {
    name: "Canchas Aéreas Panamá Oeste",
    type: "Futsal / Indoor",
    address: "La Chorrera, Panamá Oeste",
    description: "Futsal and recreational sports courts.",
    lat: 8.868,
    lng: -79.796,
    status: "By reservation"
  },
  {
    name: "Smart Fit Costa Verde",
    type: "Fitness / Gym",
    address: "Costa Verde, Panamá Oeste",
    description: "Fitness center and gym.",
    lat: 8.894,
    lng: -79.750,
    status: "Membership"
  },
  {
    name: "FP Gimnasia — La Chorrera",
    type: "Gymnastics",
    address: "La Chorrera, Panamá Oeste",
    description: "Gymnastics training.",
    lat: 8.872,
    lng: -79.781,
    status: "Classes"
  }
];

const colors = {
  "Football": "#12a653",
  "Baseball": "#ed292f",
  "Multi-sport": "#2864f5",
  "Futsal / Indoor": "#fa641c",
  "Fitness / Gym": "#873cff",
  "Gymnastics": "#e82b78"
};

const mapElement = document.getElementById("map");
const mapMessage = document.getElementById("mapMessage");
const search = document.getElementById("search");
const list = document.getElementById("places");
const count = document.getElementById("count");
const filters = document.querySelectorAll(".filter");

let selectedType = null;
let selectedName = null;
let markers = [];

if (typeof L === "undefined") {
  mapMessage.hidden = false;
  mapMessage.textContent =
    "Map library did not load. Check your internet connection.";
} else {
  startMap();
}

function startMap() {
  const map = L.map("map").setView([8.879, -79.783], 13);

  const tileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  );

  tileLayer.on("tileerror", () => {
    mapMessage.hidden = false;
    mapMessage.textContent =
      "Map tiles could not load. Check your internet connection.";
  });

  tileLayer.on("tileload", () => {
    mapMessage.hidden = true;
  });

  tileLayer.addTo(map);

  const markerLayer = L.layerGroup().addTo(map);

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function render() {
    const query = search.value.toLowerCase().trim();

    const filtered = places.filter(place => {
      const text =
        `${place.name} ${place.address} ${place.type}`.toLowerCase();

      return text.includes(query) &&
        (!selectedType || place.type === selectedType);
    });

    list.innerHTML = "";
    markerLayer.clearLayers();
    markers = [];

    count.textContent = `${filtered.length} SPACES`;

    filtered.forEach(place => {
      const color = colors[place.type];

      const card = document.createElement("article");
      card.className = "place-card" +
        (selectedName === place.name ? " selected" : "");

      card.innerHTML = `
        <div class="place-title">
          <span class="dot" style="background:${color}"></span>
          <span>${escapeHTML(place.name)}</span>
        </div>

        <p class="place-address">
          📍 ${escapeHTML(place.address)}
        </p>

        <p class="place-description">
          ${escapeHTML(place.description)}
        </p>

        <div class="tags">
          <span class="tag category" style="background:${color}">
            ${escapeHTML(place.type)}
          </span>
          <span class="tag">${escapeHTML(place.status)}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        selectedName = place.name;
        map.flyTo([place.lat, place.lng], 16);
        render();
        const marker = markers.find(
          item => item.name === place.name
        );
        if (marker) marker.layer.openPopup();
      });

      list.appendChild(card);

      const marker = L.circleMarker(
        [place.lat, place.lng],
        {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 1
        }
      );

      marker.bindPopup(`
        <strong>${escapeHTML(place.name)}</strong><br>
        ${escapeHTML(place.address)}<br>
        ${escapeHTML(place.type)}
      `);

      marker.on("click", () => {
        selectedName = place.name;
        render();
        const current = markers.find(
          item => item.name === place.name
        );
        if (current) current.layer.openPopup();
      });

      marker.addTo(markerLayer);
      markers.push({ name: place.name, layer: marker });
    }
  }

  filters.forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      selectedType = selectedType === type ? null : type;
      selectedName = null;

      filters.forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.type === selectedType
        );
      });

      render();
    });
  });

  search.addEventListener("input", () => {
    selectedName = null;
    render();
  });

  document.getElementById("clear").addEventListener("click", () => {
    search.value = "";
    selectedType = null;
    selectedName = null;
    filters.forEach(button => button.classList.remove("active"));
    render();
    search.focus();
  });

  document.getElementById("showAll").addEventListener("click", () => {
    search.value = "";
    selectedType = null;
    selectedName = null;
    filters.forEach(button => button.classList.remove("active"));
    map.setView([8.879, -79.783], 13);
    render();
  });

  render();

  setTimeout(() => map.invalidateSize(), 300);
}
