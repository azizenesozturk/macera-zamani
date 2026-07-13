
// ---------- 0) DÜZENLEME KİLİDİ (şifre) ----------

let isUnlocked = false;
let pendingUnlockResolve = null;

const unlockModal = document.getElementById('unlock-modal');
const unlockPasswordInput = document.getElementById('unlock-password');
const unlockError = document.getElementById('unlock-error');

function ensureUnlocked() {
    if (isUnlocked) return Promise.resolve(true);

    return new Promise((resolve) => {
        unlockError.textContent = '';
        unlockPasswordInput.value = '';
        unlockModal.classList.remove('hidden');
        unlockPasswordInput.focus();
        pendingUnlockResolve = resolve;
    });
}

document.getElementById('unlock-submit').addEventListener('click', async () => {
    const password = unlockPasswordInput.value;

    const response = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const result = await response.json();

    if (result.unlocked) {
        isUnlocked = true;
        unlockModal.classList.add('hidden');
        if (pendingUnlockResolve) pendingUnlockResolve(true);
    } else {
        unlockError.textContent = result.error || 'Şifre yanlış';
    }
});

document.getElementById('unlock-cancel').addEventListener('click', () => {
    unlockModal.classList.add('hidden');
    if (pendingUnlockResolve) pendingUnlockResolve(false);
});

// ---------- 1) HARİTAYI OLUŞTUR ----------

const map = L.map('map').setView([39.0, 35.0], 6);

const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles © Esri', maxZoom: 19 }
);
satelliteLayer.addTo(map);

const labelsLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19 }
);
labelsLayer.addTo(map);


// ---------- 1.5) KATEGORİ İKONLARI ----------

const categoryEmojis = {
    kamp: '⛺',
    gezi: '🌄',
    piknik: '🍖',
    diger: '📍'
};

const categoryLabels = {
    kamp: 'Kamp Alanı',
    gezi: 'Gezi / Manzara Noktası',
    piknik: 'Piknik / Mangal Alanı',
    diger: 'Diğer'
};

const routeCategoryEmojis = {
    yuruyus: '🥾',
    offroad: '🚙',
    bisiklet: '🚴',
    diger: '🗺️'
};

const routeCategoryLabels = {
    yuruyus: 'Yürüyüş / Hiking',
    offroad: 'Off-road',
    bisiklet: 'Bisiklet',
    diger: 'Diğer'
};

function makeRouteCategoryIcon(category) {
    const emoji = routeCategoryEmojis[category] || routeCategoryEmojis.diger;
    return L.divIcon({
        html: `<div class="category-icon">${emoji}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// İki koordinat arası mesafeyi km cinsinden hesaplar (Haversine formülü)
function haversineDistance([lat1, lng1], [lat2, lng2]) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Bir rotanın tüm noktalarını tek tek toplayıp toplam km'yi bulur
function calculateRouteDistanceKm(points) {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += haversineDistance(points[i], points[i + 1]);
    }
    return total;
}

// Rota ikonlarını (haritayı uzaklaştırınca bile görünür kalsınlar diye) ayrı bir katmanda tutuyoruz
const routeIconLayer = L.layerGroup().addTo(map);

function makeCategoryIcon(category) {
    const emoji = categoryEmojis[category] || categoryEmojis.diger;
    return L.divIcon({
        html: `<div class="category-icon">${emoji}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}


// ---------- 2) DURUM (STATE) DEĞİŞKENLERİ ----------

let mode = 'place';
let pendingLatLng = null;
let routePoints = [];
let routeLine = null;
let routePointMarkers = [];
let myLocationMarker = null;
let allPlaces = [];
let allRoutes = [];
const placeMarkersById = {};
const routeLinesById = {};

// ---------- 3) MOD BUTONLARI ----------

const btnAddPlace = document.getElementById('btn-add-place');
const btnDrawRoute = document.getElementById('btn-draw-route');
const btnFinishRoute = document.getElementById('btn-finish-route');
const btnMyLocation = document.getElementById('btn-my-location');
const coordDisplay = document.getElementById('coord-display');

btnAddPlace.addEventListener('click', () => setMode('place'));
btnDrawRoute.addEventListener('click', () => setMode('route'));

function setMode(newMode) {
    if (mode === 'route' && newMode !== 'route' && routePoints.length > 0) {
        cancelRouteDrawing();
    }
    mode = newMode;
    btnAddPlace.classList.toggle('active', mode === 'place');
    btnDrawRoute.classList.toggle('active', mode === 'route');
    updateFinishButtonVisibility();
}

function updateFinishButtonVisibility() {
    const shouldShow = mode === 'route' && routePoints.length >= 2;
    btnFinishRoute.classList.toggle('hidden', !shouldShow);
}

btnFinishRoute.addEventListener('click', () => {
    if (routePoints.length >= 2) {
        openRouteModal();
    }
});


// ---------- 4) HARİTAYA TIKLAMA OLAYI ----------

map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    coordDisplay.textContent = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (mode === 'place') {
        pendingLatLng = { lat, lng };
        openPlaceModal();
    } else if (mode === 'route') {
        addRoutePoint(lat, lng);
    }
});


// ---------- 5) YER EKLEME MODALI ----------

const placeModal = document.getElementById('place-modal');
const placeNameInput = document.getElementById('place-name');
const placeDescInput = document.getElementById('place-desc');
const placeCategoryInput = document.getElementById('place-category');

function openPlaceModal() {
    placeNameInput.value = '';
    placeDescInput.value = '';
    placeCategoryInput.value = 'kamp';
    placeModal.classList.remove('hidden');
    placeNameInput.focus();
}

function closePlaceModal() {
    placeModal.classList.add('hidden');
    pendingLatLng = null;
}

document.getElementById('place-cancel').addEventListener('click', closePlaceModal);

document.getElementById('place-save').addEventListener('click', async () => {
    const name = placeNameInput.value.trim();
    const description = placeDescInput.value.trim();
    const category = placeCategoryInput.value;

    if (!name || !pendingLatLng) return;
    const unlocked = await ensureUnlocked();
    if (!unlocked) return;

    const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            description,
            category,
            lat: pendingLatLng.lat,
            lng: pendingLatLng.lng
        })
    });

    const saved = await response.json();
    addPlaceMarkerToMap(saved);
    closePlaceModal();
});


// ---------- 6) HARİTAYA YER MARKER'I EKLEME ----------

function addPlaceMarkerToMap(place) {
    const marker = L.marker([place.lat, place.lng], {
        icon: makeCategoryIcon(place.category)
    }).addTo(map);

    const categoryLabel = categoryLabels[place.category] || categoryLabels.diger;

    marker.bindPopup(`
        <b>${escapeHtml(place.name)}</b><br>
        <small>${categoryLabel}</small><br>
        ${escapeHtml(place.description || '')}<br>
        <small>${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}</small><br>
        <button onclick="deletePlace(${place.id})">Sil</button>
    `);
    placeMarkersById[place.id] = marker;
}

async function deletePlace(id) {
    const unlocked = await ensureUnlocked();
    if (!unlocked) return;
    await fetch(`/api/places/${id}`, { method: 'DELETE' });
    loadPlaces();
}

async function deleteRoute(id) {
    const unlocked = await ensureUnlocked();
    if (!unlocked) return;
    await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    loadRoutes();
}

// ---------- 7) ROTA ÇİZME ----------

function addRoutePoint(lat, lng) {
    routePoints.push([lat, lng]);

    const pointMarker = L.circleMarker([lat, lng], { radius: 5, color: '#f97316' }).addTo(map);
    routePointMarkers.push(pointMarker);

    if (routeLine) {
        map.removeLayer(routeLine);
    }
    if (routePoints.length >= 2) {
        routeLine = L.polyline(routePoints, { color: '#f97316', weight: 4 }).addTo(map);
    }

    updateFinishButtonVisibility();

    if (routePoints.length >= 2) {
        coordDisplay.textContent = `Rota: ${routePoints.length} nokta seçildi — bitirmek için "Rotayı Bitir" butonuna bas`;
    }
}

function cancelRouteDrawing() {
    routePoints = [];
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    routePointMarkers.forEach((m) => map.removeLayer(m));
    routePointMarkers = [];
    updateFinishButtonVisibility();
}


// ---------- 8) ROTA KAYDETME MODALI ----------

const routeModal = document.getElementById('route-modal');
const routeNameInput = document.getElementById('route-name');
const routeDescInput = document.getElementById('route-desc');

function openRouteModal() {
    routeNameInput.value = '';
    routeDescInput.value = '';
    routeModal.classList.remove('hidden');
    routeNameInput.focus();
}

function closeRouteModal() {
    routeModal.classList.add('hidden');
}

document.getElementById('route-cancel').addEventListener('click', () => {
    closeRouteModal();
    cancelRouteDrawing();
});

document.getElementById('route-save').addEventListener('click', async () => {
    const name = routeNameInput.value.trim();
    const description = routeDescInput.value.trim();
    const category = document.getElementById('route-category').value;

    if (!name || routePoints.length < 2) return;
    const unlocked = await ensureUnlocked();
    if (!unlocked) return;

    await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, points: routePoints })
    });

    closeRouteModal();

    routePoints = [];
    routePointMarkers.forEach((m) => map.removeLayer(m));
    routePointMarkers = [];
    updateFinishButtonVisibility();

    loadRoutes();
});


// ---------- 9) KONUMUM (Geolocation) ----------

btnMyLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Tarayıcın konum özelliğini desteklemiyor.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            map.setView([latitude, longitude], 14);

            if (myLocationMarker) {
                map.removeLayer(myLocationMarker);
            }
            myLocationMarker = L.marker([latitude, longitude], { title: 'Buradasın' })
                .addTo(map)
                .bindPopup('📍 Buradasın')
                .openPopup();

            coordDisplay.textContent = `Konumun: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        },
        (error) => {
            alert('Konum alınamadı: ' + error.message);
        }
    );
});


// ---------- 10) SAYFA AÇILINCA KAYITLI VERİLERİ YÜKLE ----------

async function loadPlaces() {
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer !== myLocationMarker) {
            map.removeLayer(layer);
        }
    });

    const response = await fetch('/api/places');
    const places = await response.json();
    allPlaces = places;
    places.forEach(addPlaceMarkerToMap);
    renderSidebar();
}

async function loadRoutes() {
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
    routeIconLayer.clearLayers();

    const response = await fetch('/api/routes');
    const routes = await response.json();
    routes.forEach((route) => {
        const distanceKm = calculateRouteDistanceKm(route.points);
        const categoryLabel = routeCategoryLabels[route.category] || routeCategoryLabels.diger;

        const popupHtml = `
            <b>${escapeHtml(route.name)}</b><br>
            <small>${categoryLabel}</small><br>
            ${escapeHtml(route.description || '')}<br>
            <small>${distanceKm.toFixed(2)} km</small><br>
            <button onclick="deleteRoute(${route.id})">Sil</button>
        `;

        // Çizgi
        const line = L.polyline(route.points, { color: '#f97316', weight: 4 });
        line.bindPopup(popupHtml);
        line.addTo(map);

        // Rotanın ortasına, uzaklaştırınca bile görünen bir ikon koy
        const midPoint = route.points[Math.floor(route.points.length / 2)];
        const icon = L.marker(midPoint, { icon: makeRouteCategoryIcon(route.category) });
        icon.bindPopup(popupHtml);
        routeIconLayer.addLayer(icon);
        routeLinesById[route.id] = { line, points: route.points };
    });
    allRoutes = routes;
    renderSidebar();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- 11) SAĞ PANEL (Kayıtlarım) ----------

const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarSearch = document.getElementById('sidebar-search');
const sidebarPlacesList = document.getElementById('sidebar-places-list');
const sidebarRoutesList = document.getElementById('sidebar-routes-list');

btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
});

sidebarClose.addEventListener('click', () => {
    sidebar.classList.add('hidden');
});

sidebarSearch.addEventListener('input', renderSidebar);

function renderSidebar() {
    const query = sidebarSearch.value.trim().toLowerCase();

    // --- Yerler listesi ---
    const filteredPlaces = allPlaces.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
    );

    sidebarPlacesList.innerHTML = '';
    filteredPlaces.forEach((place) => {
        const emoji = categoryEmojis[place.category] || categoryEmojis.diger;
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <div class="item-title">${emoji} ${escapeHtml(place.name)}</div>
            <div class="item-meta">${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</div>
        `;
        div.addEventListener('click', () => {
            map.setView([place.lat, place.lng], 15);
            const marker = placeMarkersById[place.id];
            if (marker) marker.openPopup();
        });
        sidebarPlacesList.appendChild(div);
    });

    if (filteredPlaces.length === 0) {
        sidebarPlacesList.innerHTML = '<div class="item-meta">Sonuç yok</div>';
    }

    // --- Rotalar listesi ---
    const filteredRoutes = allRoutes.filter((r) =>
        r.name.toLowerCase().includes(query) ||
        (r.description || '').toLowerCase().includes(query)
    );

    sidebarRoutesList.innerHTML = '';
    filteredRoutes.forEach((route) => {
        const emoji = routeCategoryEmojis[route.category] || routeCategoryEmojis.diger;
        const distanceKm = calculateRouteDistanceKm(route.points);
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <div class="item-title">${emoji} ${escapeHtml(route.name)}</div>
            <div class="item-meta">${distanceKm.toFixed(2)} km</div>
        `;
        div.addEventListener('click', () => {
            const entry = routeLinesById[route.id];
            if (entry) {
                map.fitBounds(entry.line.getBounds());
                entry.line.openPopup();
            }
        });
        sidebarRoutesList.appendChild(div);
    });

    if (filteredRoutes.length === 0) {
        sidebarRoutesList.innerHTML = '<div class="item-meta">Sonuç yok</div>';
    }
}

loadPlaces();
loadRoutes();