
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



// ---------- ORTAK KATEGORİLER (hem Yer hem Rota için) ----------
const CATEGORIES = [
    {
        key: 'kamp',
        label: 'Kamp Alanı',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="4" r="2"/><path d="m14 5 3-3 3 3"/><path d="m14 10 3-3 3 3"/><path d="M17 14V2"/><path d="M17 14H7l-5 8h20Z"/><path d="M8 14v8"/><path d="m9 14 5 8"/></svg>'
    },
    {
        key: 'yuruyus',
        label: 'Doğa Yürüyüşü',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7C16.1046 7 17 6.10457 17 5C17 3.89543 16.1046 3 15 3C13.8954 3 13 3.89543 13 5C13 6.10457 13.8954 7 15 7Z"/><path d="M12.6133 8.26691L9.30505 12.4021L13.4403 16.5374L11.3727 21.0861"/><path d="M6.4104 9.5075L9.79728 6.19931L12.6132 8.26692L15.508 11.5752H19.2297"/><path d="M8.89152 15.7103L7.65095 16.5374H4.34277"/></svg>'
    },
    {
        key: 'piknik',
        label: 'Mangal / Piknik Yeri',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3"/><path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"/><circle cx="12.5" cy="8.5" r="2.5"/></svg>'
    },
    {
        key: 'gitmek',
        label: 'Gitmeyi Düşündüğüm Yer',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>'
    },
    {
        key: 'diger',
        label: 'Diğer',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'
    },
];

function getCategory(key) {
    return CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
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

function makeCategoryIcon(categoryKey) {
    const cat = getCategory(categoryKey);
    return L.divIcon({
        html: `<div class="category-icon">${cat.icon}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}


// ---------- 2) DURUM (STATE) DEĞİŞKENLERİ ----------

let mode = 'browse';
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

const btnBrowse = document.getElementById('btn-browse');
const btnAddPlace = document.getElementById('btn-add-place');
const btnDrawRoute = document.getElementById('btn-draw-route');
const btnFinishRoute = document.getElementById('btn-finish-route');
const btnCancelRoute = document.getElementById('btn-cancel-route');
const btnMyLocation = document.getElementById('btn-my-location');
const coordDisplay = document.getElementById('coord-display');

btnBrowse.addEventListener('click', () => setMode('browse'));
btnAddPlace.addEventListener('click', () => setMode('place'));
btnDrawRoute.addEventListener('click', () => setMode('route'));

function setMode(newMode) {
    if (mode === 'route' && newMode !== 'route' && routePoints.length > 0) {
        cancelRouteDrawing();
    }
    mode = newMode;
    btnBrowse.classList.toggle('active', mode === 'browse');
    btnAddPlace.classList.toggle('active', mode === 'place');
    btnDrawRoute.classList.toggle('active', mode === 'route');
    updateFinishButtonVisibility();
}

function updateFinishButtonVisibility() {
    const canFinish = mode === 'route' && routePoints.length >= 2;
    const hasPoints = mode === 'route' && routePoints.length >= 1;
    btnFinishRoute.classList.toggle('hidden', !canFinish);
    btnCancelRoute.classList.toggle('hidden', !hasPoints);
}

btnFinishRoute.addEventListener('click', () => {
    if (routePoints.length >= 2) {
        openRouteModal();
    }
});

btnCancelRoute.addEventListener('click', () => {
    cancelRouteDrawing();
});

map.on('click', (e) => {
    if (mode === 'browse') return; // Gezin modunda tıklama hiçbir şey yapmaz

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
    const category = getCustomSelectValue('place-category-select');

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

    const categoryLabel = getCategory(place.category).label;

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
    const category = getCustomSelectValue('route-category-select');

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
        const categoryLabel = getCategory(route.category).label;

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
        const icon = L.marker(midPoint, { icon: makeCategoryIcon(route.category) });
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
        const icon = getCategory(place.category).icon;
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <div class="item-title"><span class="sidebar-item-icon">${icon}</span>${escapeHtml(place.name)}</div>
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
        const icon = getCategory(route.category).icon;
        const distanceKm = calculateRouteDistanceKm(route.points);
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <div class="item-title"><span class="sidebar-item-icon">${icon}</span>${escapeHtml(route.name)}</div>
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

function syncToolbarOffset() {
    const tabbar = document.getElementById('bottom-tabbar');
    if (tabbar) {
        document.documentElement.style.setProperty('--tabbar-height', tabbar.offsetHeight + 'px');
    }
}
window.addEventListener('load', syncToolbarOffset);
window.addEventListener('resize', syncToolbarOffset);

// ---------- ÖZEL AÇILIR MENÜ (SVG ikonlu) ----------
function buildCustomSelect(containerId, defaultKey) {
    const container = document.getElementById(containerId);
    container.dataset.value = defaultKey;

    const trigger = container.querySelector('.custom-select-trigger');
    const optionsBox = container.querySelector('.custom-select-options');

    function renderTrigger() {
        const cat = getCategory(container.dataset.value);
        trigger.innerHTML = `
            <span class="custom-select-icon">${cat.icon}</span>
            <span class="custom-select-label">${cat.label}</span>
            <svg class="custom-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        `;
    }

    function renderOptions() {
        optionsBox.innerHTML = CATEGORIES.map(cat => `
            <div class="custom-select-option" data-key="${cat.key}">
                <span class="custom-select-icon">${cat.icon}</span>
                <span>${cat.label}</span>
            </div>
        `).join('');
        optionsBox.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.addEventListener('click', () => {
                container.dataset.value = opt.dataset.key;
                renderTrigger();
                optionsBox.classList.add('hidden');
            });
        });
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-options').forEach(box => {
            if (box !== optionsBox) box.classList.add('hidden');
        });
        optionsBox.classList.toggle('hidden');
    });

    document.addEventListener('click', () => optionsBox.classList.add('hidden'));

    renderTrigger();
    renderOptions();
}

function getCustomSelectValue(containerId) {
    return document.getElementById(containerId).dataset.value;
}

buildCustomSelect('place-category-select', 'kamp');
buildCustomSelect('route-category-select', 'yuruyus');