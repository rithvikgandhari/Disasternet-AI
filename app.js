/**
 * DisasterNet AI — Main Application Logic
 * Pure frontend: no backend required.
 */

// ══════════════════════════════════════════════════
// AUTH SYSTEM
// ══════════════════════════════════════════════════

let currentUser = null;
let loginMethod = 'email'; // 'email' | 'phone'
let sosTimer = null;
let sosCount = 5;
let selectedVehicleId = null;
let mapInstance = null;
let mapMarkers = {}; // { layerName: [L.marker, ...] }
let liveFeedTimer = null;

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('panel-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('panel-register').style.display = tab === 'register' ? 'block' : 'none';
}

function setLoginMethod(method) {
  loginMethod = method;
  document.getElementById('lm-email').classList.toggle('active', method === 'email');
  document.getElementById('lm-phone').classList.toggle('active', method === 'phone');
  document.getElementById('login-email-fields').style.display = method === 'email' ? 'block' : 'none';
  document.getElementById('login-phone-fields').style.display = method === 'phone' ? 'block' : 'none';
}

function handleLogin(e) {
  e.preventDefault();
  let identifier = '';
  if (loginMethod === 'email') {
    identifier = document.getElementById('login-email').value.trim();
    if (!identifier) { showToast('❌', 'Error', 'Please enter your email address.', 'error'); return; }
  } else {
    const code = document.getElementById('login-country').value;
    const num = document.getElementById('login-phone').value.trim();
    if (!num) { showToast('❌', 'Error', 'Please enter your phone number.', 'error'); return; }
    identifier = code + ' ' + num;
  }
  const password = document.getElementById('login-password').value;
  if (!password) { showToast('❌', 'Error', 'Please enter your password.', 'error'); return; }

  const name = loginMethod === 'email'
    ? (identifier.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'User')
    : 'User';

  saveSession({ name: capitalise(name), email: identifier, phone: '', role: 'Citizen', loginMethod });
  hideAuth();
  showToast('✅', 'Welcome back!', `Signed in as ${capitalise(name)}`, 'success');
}

function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const code     = document.getElementById('reg-country').value;
  const phone    = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;

  if (!name || !email || !phone || !password) {
    showToast('❌', 'Missing Fields', 'Please fill in all required fields.', 'error'); return;
  }

  saveSession({ name, email, phone: code + ' ' + phone, role, loginMethod: 'email' });
  hideAuth();
  showToast('🎉', 'Account Created!', `Welcome, ${name}! You are registered as ${role}.`, 'success');
}

function loginAsGuest() {
  saveSession({ name: 'Guest User', email: '', phone: '', role: 'Citizen', loginMethod: 'guest' });
  hideAuth();
  showToast('👤', 'Guest Mode', 'You are browsing as a guest. Some features may be limited.', 'info');
}

function saveSession(user) {
  currentUser = user;
  localStorage.setItem('disasternet_user', JSON.stringify(user));
  applyUserToUI(user);
  initApp();
}

function applyUserToUI(user) {
  const initial = (user.name || 'G')[0].toUpperCase();
  document.getElementById('nav-avatar').textContent = initial;
  document.getElementById('nav-user-name').textContent = user.name || 'Guest';
  document.getElementById('nav-user-role').textContent = user.role || 'Citizen';
}

function hideAuth() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('app-main').style.display = 'block';
  document.getElementById('app-footer').style.display = 'block';
}

function capitalise(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

// ══════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════

function showToast(icon, title, message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-body"><h4>${title}</h4><p>${message}</p></div>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ══════════════════════════════════════════════════
// PAGE NAVIGATION
// ══════════════════════════════════════════════════

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === id);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy-load page content
  const loaders = {
    predict:   renderPredictions,
    incidents: renderIncidents,
    shelters:  renderShelters,
    volunteer: () => { renderVolunteerTasks(); },
    dashboard: renderDashboard,
    map:       initMap,
    evacuate:  renderVehicleGrid,
  };
  if (loaders[id]) loaders[id]();
}

// ══════════════════════════════════════════════════
// HOME — STAT COUNTER ANIMATION
// ══════════════════════════════════════════════════

function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

function animateAllCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    animateCounter(el, parseInt(el.dataset.count, 10));
  });
}

// ══════════════════════════════════════════════════
// AI PREDICTION PAGE
// ══════════════════════════════════════════════════

const PREDICTIONS = [
  { id: 'flood',     emoji: '🌊', name: 'Flood',      score: 78, level: 'Critical', color: '#ef4444',
    factors: ['Heavy rainfall (182mm/24h)', 'River levels critical', 'Low-lying coastal zones', 'Saturated soil'] },
  { id: 'cyclone',   emoji: '🌀', name: 'Cyclone',    score: 62, level: 'High',     color: '#f97316',
    factors: ['Bay of Bengal system active', 'Wind speed 90km/h', 'Coastal proximity', 'Low pressure area'] },
  { id: 'wildfire',  emoji: '🔥', name: 'Wildfire',   score: 34, level: 'Medium',   color: '#f59e0b',
    factors: ['Dry spell 18 days', 'Low humidity 28%', 'Strong winds', 'Dense forest cover'] },
  { id: 'heatwave',  emoji: '🌡️', name: 'Heat Wave',  score: 45, level: 'Medium',   color: '#f59e0b',
    factors: ['Temperature 42°C forecast', 'Urban heat island', 'No rainfall expected', '5-day trend rising'] },
  { id: 'landslide', emoji: '⛰️', name: 'Landslide',  score: 22, level: 'Low',      color: '#22c55e',
    factors: ['Stable slopes', 'Moderate rainfall only', 'No seismic activity', 'Vegetation intact'] },
];

const LEVEL_BADGE = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-low',
};

function renderPredictions() {
  const grid = document.getElementById('prediction-grid');
  if (!grid) return;
  grid.innerHTML = PREDICTIONS.map(p => `
    <div class="prediction-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span class="prediction-icon">${p.emoji}</span>
        <span class="badge ${LEVEL_BADGE[p.level]}">${p.level}</span>
      </div>
      <h3>${p.name} Risk</h3>
      <div style="display:flex;align-items:center;gap:16px">
        <div class="risk-ring" style="width:80px;height:80px;flex-shrink:0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="33" fill="none" stroke="var(--bg3)" stroke-width="7"/>
            <circle cx="40" cy="40" r="33" fill="none" stroke="${p.color}" stroke-width="7"
              stroke-dasharray="${2 * Math.PI * 33}" stroke-dashoffset="${2 * Math.PI * 33 * (1 - p.score / 100)}"
              stroke-linecap="round"/>
          </svg>
          <div class="ring-val" style="color:${p.color}">${p.score}</div>
          <div class="ring-lbl">/ 100</div>
        </div>
        <div style="flex:1">
          <div class="prediction-bar-label"><span>Risk Score</span></div>
          <div class="progress" style="margin-bottom:8px"><div class="progress-bar" style="width:${p.score}%;background:${p.color}"></div></div>
          <div style="display:flex;flex-direction:column;gap:3px">
            ${p.factors.map(f => `<div style="font-size:11px;color:var(--text-muted)">• ${f}</div>`).join('')}
          </div>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="runAIAnalysis('${p.id}')">
        🧠 AI Deep Analysis
      </button>
    </div>
  `).join('');
}

async function runAIAnalysis(type) {
  const p = PREDICTIONS.find(x => x.id === type);
  if (!p) return;
  showToast('🤖', 'AI Analysing…', `Running IBM Watsonx.ai analysis for ${p.name} risk…`, 'info', 2000);
  try {
    const result = await WatsonX.analyzeDisasterRisk('Mumbai, Maharashtra', { type, score: p.score });
    showToast('✅', `${p.name} Analysis Ready`, result.slice(0, 120) + '…', 'success', 6000);
  } catch {
    showToast('⚠️', 'Demo Mode', 'AI analysis complete — connect IBM Watsonx.ai API key for live data.', 'warning');
  }
}

// ══════════════════════════════════════════════════
// LIVE MAP (Leaflet)
// ══════════════════════════════════════════════════

const MAP_MARKERS_DATA = [
  { layer:'flood',    lat:19.055, lng:72.832, emoji:'🌊', name:'Bandra Flood Zone',   badge:'Critical', color:'#3b82f6' },
  { layer:'flood',    lat:19.018, lng:72.848, emoji:'🌊', name:'Kurla Low-lying Area', badge:'High',     color:'#3b82f6' },
  { layer:'flood',    lat:19.096, lng:72.895, emoji:'🌊', name:'Thane Creek Overflow', badge:'High',     color:'#3b82f6' },
  { layer:'fire',     lat:19.100, lng:72.860, emoji:'🔥', name:'Dharavi Fire Incident',badge:'Active',   color:'#ef4444' },
  { layer:'fire',     lat:19.040, lng:72.810, emoji:'🔥', name:'Mankhurd Fire Zone',   badge:'Contained',color:'#ef4444' },
  { layer:'shelter',  lat:19.076, lng:72.877, emoji:'🏠', name:'BKC Relief Shelter',   badge:'Open',     color:'#22c55e' },
  { layer:'shelter',  lat:19.120, lng:72.850, emoji:'🏠', name:'Andheri Sports Complex',badge:'Open',   color:'#22c55e' },
  { layer:'shelter',  lat:19.020, lng:72.840, emoji:'🏠', name:'Chembur Community Hall',badge:'80%',    color:'#22c55e' },
  { layer:'incident', lat:19.060, lng:72.870, emoji:'⚠️', name:'Road Blockage — LBS Marg',badge:'Open', color:'#f97316' },
  { layer:'incident', lat:19.090, lng:72.900, emoji:'⚠️', name:'Power Outage — Mulund', badge:'Active', color:'#f97316' },
  { layer:'medical',  lat:19.070, lng:72.855, emoji:'🏥', name:'KEM Hospital',          badge:'Open',   color:'#8b5cf6' },
  { layer:'medical',  lat:19.115, lng:72.880, emoji:'🏥', name:'Sion Hospital ER',      badge:'Full',   color:'#8b5cf6' },
  { layer:'rescue',   lat:19.050, lng:72.862, emoji:'🚒', name:'NDRF Team Alpha',       badge:'Active', color:'#14b8a6' },
  { layer:'rescue',   lat:19.083, lng:72.834, emoji:'🚒', name:'Coast Guard Unit 7',    badge:'Patrol', color:'#14b8a6' },
];

function makeIcon(emoji, color) {
  return L.divIcon({
    html: `<div style="background:${color};border:2px solid #fff;border-radius:50%;width:32px;height:32px;
           display:flex;align-items:center;justify-content:center;font-size:14px;
           box-shadow:0 2px 8px rgba(0,0,0,0.5)">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: '',
  });
}

function initMap() {
  if (mapInstance) return; // already initialised
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  mapInstance = L.map('map', { zoomControl: true, attributionControl: false }).setView([19.076, 72.877], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(mapInstance);

  L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap' }).addTo(mapInstance);

  // Add all markers
  MAP_MARKERS_DATA.forEach(m => {
    const marker = L.marker([m.lat, m.lng], { icon: makeIcon(m.emoji, m.color) })
      .bindPopup(`<div style="font-family:sans-serif;min-width:160px">
        <div style="font-size:20px;margin-bottom:4px">${m.emoji}</div>
        <strong style="font-size:13px">${m.name}</strong><br>
        <span style="display:inline-block;background:${m.color};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-top:4px">${m.badge}</span>
      </div>`, { maxWidth: 220 });

    if (!mapMarkers[m.layer]) mapMarkers[m.layer] = [];
    mapMarkers[m.layer].push(marker);

    // Show by default for active layers
    const btn = document.querySelector(`[data-layer="${m.layer}"]`);
    if (btn && btn.classList.contains('active')) marker.addTo(mapInstance);
  });

  startLiveFeed();
}

function toggleLayer(layerName, btn) {
  btn.classList.toggle('active');
  const isActive = btn.classList.contains('active');
  const markers = mapMarkers[layerName] || [];
  markers.forEach(m => {
    if (isActive) m.addTo(mapInstance);
    else mapInstance.removeLayer(m);
  });
}

const LIVE_FEED_ITEMS = [
  { color:'#ef4444', text:'🌊 Flood reported — Chunabhatti, depth 0.8m' },
  { color:'#f97316', text:'⚡ Power outage — Andheri East, 1,200 homes' },
  { color:'#22c55e', text:'🏠 Shelter opened — Worli Sea Face, 200 beds' },
  { color:'#3b82f6', text:'🚒 NDRF deployed — Dharavi sector 4' },
  { color:'#8b5cf6', text:'🏥 KEM Hospital ER — critical capacity' },
  { color:'#f59e0b', text:'🌀 Cyclone BOB-07 — 340km from coast' },
  { color:'#14b8a6', text:'🚁 Helicopter rescue — Kurla waterlogged' },
  { color:'#ef4444', text:'🔥 Fire reported — Bhandup industrial zone' },
];

let feedIndex = 0;
function startLiveFeed() {
  renderLiveFeed();
  if (liveFeedTimer) clearInterval(liveFeedTimer);
  liveFeedTimer = setInterval(renderLiveFeed, 8000);
}

function renderLiveFeed() {
  const container = document.getElementById('map-live-feed');
  if (!container) return;
  const items = [];
  for (let i = 0; i < 5; i++) {
    items.push(LIVE_FEED_ITEMS[(feedIndex + i) % LIVE_FEED_ITEMS.length]);
  }
  feedIndex = (feedIndex + 1) % LIVE_FEED_ITEMS.length;
  const now = new Date();
  container.innerHTML = items.map((item, idx) => `
    <div class="live-feed-item">
      <span class="live-dot" style="background:${item.color}"></span>
      <div style="flex:1">
        <div style="font-size:11px;color:var(--text)">${item.text}</div>
        <div style="font-size:10px;color:var(--text-muted)">${formatTime(new Date(now - idx * 73000))}</div>
      </div>
    </div>
  `).join('');
}

function formatTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ══════════════════════════════════════════════════
// INCIDENTS
// ══════════════════════════════════════════════════

const INCIDENTS_DATA = [
  { type:'🌊 Flood',      desc:'Waterlogging on SV Road near Bandra station, knee-deep water',   loc:'Bandra West',   time:'10 min ago', severity:'High',   verified:true  },
  { type:'🔥 Fire',       desc:'Small fire in electrical panel at Dharavi chawl, contained',      loc:'Dharavi',       time:'24 min ago', severity:'Medium', verified:true  },
  { type:'🌳 Fallen Tree', desc:'Large tree fell on road blocking traffic near Shivaji Park',     loc:'Dadar',         time:'35 min ago', severity:'Low',    verified:true  },
  { type:'👤 Missing',    desc:'Elderly woman missing since yesterday evening, last seen near Kurla station',loc:'Kurla', time:'1 hr ago',  severity:'High',   verified:false },
  { type:'⚡ Power Outage',desc:'No electricity in entire Chembur colony E sector since 3 hours', loc:'Chembur',       time:'2 hr ago',   severity:'Medium', verified:true  },
];

function renderIncidents() {
  const feed = document.getElementById('incident-feed');
  if (!feed) return;
  feed.innerHTML = INCIDENTS_DATA.map(i => `
    <div class="incident-card">
      <div class="incident-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <h4>${i.type}</h4>
          <span class="badge ${i.severity === 'High' ? 'badge-high' : i.severity === 'Medium' ? 'badge-medium' : 'badge-low'}">${i.severity}</span>
        </div>
        <p style="font-size:12px;margin-bottom:6px">${i.desc}</p>
        <div class="incident-meta">
          <span style="font-size:11px;color:var(--text-muted)">📍 ${i.loc}</span>
          <span style="font-size:11px;color:var(--text-muted)">🕐 ${i.time}</span>
          <span style="font-size:11px;color:${i.verified ? 'var(--green)' : 'var(--yellow)'}">
            ${i.verified ? '✅ Verified' : '⏳ Pending'}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function submitReport(e) {
  e.preventDefault();
  const type = document.getElementById('inc-type').value;
  const desc = document.getElementById('inc-desc').value.trim();
  if (!desc) { showToast('⚠️', 'Missing Info', 'Please add a description of the incident.', 'warning'); return; }
  showToast('🤖', 'AI Verifying…', 'Analysing your report with IBM Watsonx.ai…', 'info', 2500);
  setTimeout(() => {
    showToast('✅', 'Report Submitted', `Your ${type} report has been verified and sent to response teams.`, 'success');
    document.getElementById('inc-desc').value = '';
    INCIDENTS_DATA.unshift({ type, desc, loc: 'Your Location', time: 'Just now', severity: 'Medium', verified: true });
    renderIncidents();
  }, 2500);
}

function detectGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        document.getElementById('inc-location').value =
          `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`;
        showToast('📍', 'Location Detected', 'GPS coordinates updated.', 'success', 2000);
      },
      () => showToast('📍', 'Using Default', 'GPS unavailable — using Mumbai coordinates.', 'info', 2000)
    );
  }
}

function previewPhoto(input) {
  if (input.files && input.files[0]) {
    showToast('📸', 'Photo Uploaded', 'AI image analysis queued.', 'info', 2000);
  }
}

// ══════════════════════════════════════════════════
// SHELTERS
// ══════════════════════════════════════════════════

const SHELTERS_DATA = [
  { name:'BKC Convention Centre', area:'Bandra Kurla Complex', beds:400, used:312, food:true, water:true, medical:true, dist:'1.2 km' },
  { name:'Andheri Sports Complex', area:'Andheri East',         beds:600, used:421, food:true, water:true, medical:false,dist:'3.5 km' },
  { name:'Chembur Community Hall', area:'Chembur',              beds:150, used:145, food:true, water:true, medical:true, dist:'5.8 km' },
  { name:'Dharavi School Ground',  area:'Dharavi',              beds:800, used:234, food:false,water:true, medical:false,dist:'2.1 km' },
  { name:'Mulund Relief Camp',     area:'Mulund West',          beds:250, used:88,  food:true, water:true, medical:true, dist:'8.4 km' },
  { name:'Thane Municipal Shelter',area:'Thane',                beds:1000,used:678, food:true, water:true, medical:true, dist:'12 km' },
];

function renderShelters() {
  const grid = document.getElementById('shelter-grid');
  if (!grid) return;
  grid.innerHTML = SHELTERS_DATA.map(s => {
    const pct = Math.round((s.used / s.beds) * 100);
    const pctColor = pct > 90 ? 'red' : pct > 70 ? 'orange' : 'green';
    return `
      <div class="shelter-card">
        <div class="shelter-header">
          <div>
            <h4>${s.name}</h4>
            <div style="font-size:12px;color:var(--text-muted)">📍 ${s.area} · ${s.dist}</div>
          </div>
          <span class="badge ${pct > 90 ? 'badge-critical' : pct > 70 ? 'badge-high' : 'badge-low'}">${pct < 100 ? pct + '%' : 'FULL'}</span>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span>Capacity</span><span>${s.used} / ${s.beds} beds</span>
          </div>
          <div class="progress"><div class="progress-bar ${pctColor}" style="width:${pct}%"></div></div>
        </div>
        <div class="shelter-meta">
          <span class="shelter-tag ${s.food ? 'ok' : 'full'}">🍱 Food ${s.food ? 'Available' : 'Unavailable'}</span>
          <span class="shelter-tag ${s.water ? 'ok' : 'full'}">💧 Water ${s.water ? 'OK' : 'Low'}</span>
          <span class="shelter-tag ${s.medical ? 'ok' : 'warn'}">🏥 Medical ${s.medical ? 'Yes' : 'No'}</span>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center"
          onclick="showToast('🗺️','Navigation','Opening route to ${s.name}…','info')">
          Get Directions
        </button>
      </div>
    `;
  }).join('');
}

// ══════════════════════════════════════════════════
// EVACUATE — ROUTE PLANNER
// ══════════════════════════════════════════════════

const ROUTES = [
  { label:'🟢 Safest Route', time:'28 min', dist:'14.2 km', hazards:'No flood zones', steps:['Via Western Express Highway','Avoid Bandra-Kurla link road','Take Santacruz bridge','Arrive BKC shelter'], selected:true },
  { label:'🟡 Alternate Route', time:'35 min', dist:'16.8 km', hazards:'Minor waterlogging at 1 point', steps:['Via Eastern freeway','LBS Marg until Kurla','Divert via Nehru Nagar','Enter BKC from north gate'] },
  { label:'🔴 Shortest (Not Recommended)', time:'18 min', dist:'9.4 km', hazards:'Flooded road, debris reported', steps:['Direct via Mahim Causeway','⚠️ Flooded — use with caution'] },
];

function calculateRoutes() {
  const container = document.getElementById('route-options');
  if (!container) return;
  container.innerHTML = '<div style="display:flex;gap:10px;color:var(--text-muted);padding:16px"><div class="loader"></div> Calculating safe routes…</div>';
  setTimeout(() => {
    container.innerHTML = ROUTES.map((r, i) => `
      <div class="route-option ${r.selected ? 'selected' : ''}" onclick="selectRoute(${i})">
        <div class="route-header">
          <div>
            <h4>${r.label}</h4>
            <p style="font-size:12px;margin-top:2px">⚠️ ${r.hazards}</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.1rem;font-weight:700;color:var(--accent)">${r.time}</div>
            <div style="font-size:12px;color:var(--text-muted)">${r.dist}</div>
          </div>
        </div>
        <div class="route-steps">
          ${r.steps.map(s => `<div class="route-step">${s}</div>`).join('')}
        </div>
      </div>
    `).join('');
  }, 1200);
}

function selectRoute(idx) {
  ROUTES.forEach((r, i) => r.selected = (i === idx));
  calculateRoutes();
  showToast('🗺️', 'Route Selected', ROUTES[idx].label + ' — ' + ROUTES[idx].time, 'success', 2500);
}

// ══════════════════════════════════════════════════
// VEHICLE DISPATCH SYSTEM
// ══════════════════════════════════════════════════

const VEHICLES = [
  { id:'car',       cls:'car',       emoji:'🚗', name:'Emergency Car',       cap:'Up to 4 passengers',         etaMin:8,  etaMax:12, available:12, color:'#3b82f6' },
  { id:'jeep',      cls:'jeep',      emoji:'🚙', name:'Army Jeep',            cap:'6 passengers + gear',         etaMin:15, etaMax:20, available:8,  color:'#f59e0b' },
  { id:'chopper',   cls:'chopper',   emoji:'🚁', name:'Military Helicopter',  cap:'Emergency airlift, 8 persons',etaMin:20, etaMax:35, available:3,  color:'#8b5cf6' },
  { id:'boat',      cls:'boat',      emoji:'🚤', name:'Rescue Boat',          cap:'Flood rescue, 12 persons',    etaMin:10, etaMax:18, available:6,  color:'#14b8a6' },
  { id:'ambulance', cls:'ambulance', emoji:'🚑', name:'Ambulance',            cap:'Medical emergency',           etaMin:6,  etaMax:10, available:15, color:'#ef4444' },
  { id:'truck',     cls:'truck',     emoji:'🚛', name:'Relief Truck',         cap:'Supplies + 20 persons',       etaMin:25, etaMax:40, available:5,  color:'#f97316' },
];

function renderVehicleGrid() {
  const grid = document.getElementById('vehicle-grid');
  if (!grid || grid.children.length > 0) return; // already rendered
  grid.innerHTML = VEHICLES.map(v => `
    <div class="vehicle-card ${v.cls}" id="vcard-${v.id}" onclick="selectVehicle('${v.id}')">
      <span class="vehicle-emoji">${v.emoji}</span>
      <div class="vehicle-name">${v.name}</div>
      <div class="vehicle-cap">${v.cap}</div>
      <div class="vehicle-eta" style="color:${v.color}">ETA: ${v.etaMin}–${v.etaMax} min</div>
      <div class="vehicle-avail">
        <span class="avail-dot" style="background:${v.available > 5 ? '#22c55e' : v.available > 0 ? '#f59e0b' : '#ef4444'}"></span>
        <span style="color:var(--text-muted)">${v.available} available</span>
      </div>
    </div>
  `).join('');
}

function selectVehicle(vehicleId) {
  selectedVehicleId = vehicleId;
  document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('vcard-' + vehicleId);
  if (card) card.classList.add('selected');
}

function dispatchVehicle() {
  if (!selectedVehicleId) {
    showToast('⚠️', 'Select Vehicle', 'Please select a vehicle type first.', 'warning');
    return;
  }
  const address = document.getElementById('dispatch-address').value.trim();
  const countryCode = document.getElementById('dispatch-country-code').value;
  const phone = document.getElementById('dispatch-phone').value.trim();

  if (!address) { showToast('⚠️', 'Enter Address', 'Please enter your pickup address.', 'warning'); return; }
  if (!phone)   { showToast('⚠️', 'Enter Phone', 'Please enter your contact number.', 'warning'); return; }

  const v = VEHICLES.find(x => x.id === selectedVehicleId);
  openDispatchModal(v, address, countryCode + ' ' + phone);
}

function openDispatchModal(v, address, phone) {
  const modal = document.getElementById('dispatch-modal');
  modal.classList.add('open');

  document.getElementById('dm-vehicle-emoji').textContent = v.emoji;
  document.getElementById('dm-vehicle-name').textContent = v.name;
  document.getElementById('dm-eta').textContent = `${v.etaMin}–${v.etaMax} minutes`;
  document.getElementById('dm-address').textContent = address;
  document.getElementById('dm-phone').textContent = phone;

  // Reset steps
  const steps = ['dstep-1','dstep-2','dstep-3','dstep-4'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('done');
  });
  document.getElementById('dstep-4-text').textContent = 'Estimated arrival pending…';

  // Step 1 already done (shown instantly)
  document.getElementById('dstep-1').classList.add('done');

  // Step 2 — after 1200ms
  setTimeout(() => {
    document.getElementById('dstep-2').classList.add('done');
    document.getElementById('dstep-2-icon').textContent = '✅';
  }, 1200);

  // Step 3 — active/pulsing after 2400ms
  setTimeout(() => {
    const s3 = document.getElementById('dstep-3');
    s3.classList.add('done');
    document.getElementById('dstep-3-icon').textContent = '🚗';
    // Add pulse style
    s3.style.border = '1px solid rgba(59,130,246,0.4)';
    s3.style.background = 'rgba(59,130,246,0.06)';
  }, 2400);

  // Step 4 — show ETA after 3600ms
  setTimeout(() => {
    const s4 = document.getElementById('dstep-4');
    s4.classList.add('done');
    document.getElementById('dstep-4-icon').textContent = '⏱';
    document.getElementById('dstep-4-text').textContent = `Estimated arrival: ${v.etaMin}–${v.etaMax} minutes`;
    showToast('🚨', 'Vehicle Dispatched!', `${v.emoji} ${v.name} is on the way. ETA: ${v.etaMin}–${v.etaMax} min`, 'success', 5000);
  }, 3600);
}

function closeDispatchModal() {
  document.getElementById('dispatch-modal').classList.remove('open');
}

// ══════════════════════════════════════════════════
// VOLUNTEER
// ══════════════════════════════════════════════════

const VOLUNTEER_TASKS = [
  { icon:'🌊', title:'Flood Evacuation Assistance', loc:'Bandra West',   urgency:'Urgent',  people:'Need 5 more' },
  { icon:'🍱', title:'Food Distribution — Dharavi', loc:'Dharavi',       urgency:'Active',  people:'Need 8 more' },
  { icon:'🏥', title:'First Aid Support at KEM',    loc:'Parel',         urgency:'Urgent',  people:'Need 3 more' },
  { icon:'📦', title:'Relief Supply Logistics',     loc:'BKC Shelter',   urgency:'Active',  people:'Need 10 more' },
  { icon:'📡', title:'Communication Coordination',  loc:'EOC Mumbai',    urgency:'Normal',  people:'Need 2 more' },
];

function renderVolunteerTasks() {
  const list = document.getElementById('volunteer-tasks');
  if (!list) return;
  list.innerHTML = VOLUNTEER_TASKS.map((t, i) => `
    <div class="volunteer-task">
      <div class="task-icon">${t.icon}</div>
      <div class="task-body">
        <h4>${t.title}</h4>
        <p>📍 ${t.loc} · ${t.people}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <span class="badge ${t.urgency === 'Urgent' ? 'badge-critical' : 'badge-info'}">${t.urgency}</span>
        <button class="btn btn-success btn-sm" onclick="acceptTask(${i},this)">Accept</button>
      </div>
    </div>
  `).join('');
}

function acceptTask(idx, btn) {
  btn.disabled = true;
  btn.textContent = '✅ Accepted';
  btn.classList.remove('btn-success');
  btn.classList.add('btn-ghost');
  showToast('✅', 'Task Accepted', `You accepted: ${VOLUNTEER_TASKS[idx].title}`, 'success');
}

function registerVolunteer(e) {
  e.preventDefault();
  const name  = document.getElementById('vol-name').value.trim();
  const phone = document.getElementById('vol-phone').value.trim();
  if (!name || !phone) { showToast('⚠️', 'Missing Fields', 'Please fill all fields.', 'warning'); return; }
  showToast('🙋', 'Registered!', `Welcome, ${name}! You are now a registered volunteer.`, 'success');
  e.target.reset();
}

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════

const DASH_KPI = [
  { icon:'🚨', label:'Active Disasters',    value:247,  change:'+18', up:true,  color:'rgba(239,68,68,0.15)',    textColor:'var(--red)' },
  { icon:'🏠', label:'People Sheltered',    value:12480,change:'+1.2k',up:true, color:'rgba(34,197,94,0.15)',    textColor:'var(--green)' },
  { icon:'🚒', label:'Rescue Operations',   value:89,   change:'+12', up:true,  color:'rgba(59,130,246,0.15)',   textColor:'var(--accent)' },
  { icon:'🙋', label:'Volunteers Deployed', value:1634, change:'+340',up:true,  color:'rgba(139,92,246,0.15)',   textColor:'var(--purple)' },
];

const RESOURCES = [
  { label:'Rescue Boats',      value:42,  max:60, color:'#3b82f6' },
  { label:'Relief Trucks',     value:128, max:200,color:'#22c55e' },
  { label:'Medical Teams',     value:67,  max:100,color:'#ef4444' },
  { label:'Helicopters',       value:14,  max:20, color:'#8b5cf6' },
  { label:'Emergency Food',    value:78,  max:100,color:'#f59e0b' },
  { label:'Shelter Beds',      value:8240,max:12000,color:'#14b8a6' },
];

const RESCUE_TEAMS = [
  { name:'NDRF Team Alpha',      loc:'Bandra',    status:'active',   members:12 },
  { name:'SDRF Unit 3',          loc:'Dharavi',   status:'active',   members:8  },
  { name:'Coast Guard Alpha',    loc:'Sea coast', status:'active',   members:15 },
  { name:'Fire Brigade Unit 7',  loc:'Kurla',     status:'standby',  members:6  },
  { name:'Army Column 4',        loc:'Andheri',   status:'standby',  members:20 },
  { name:'Police Rescue Wing',   loc:'Chembur',   status:'active',   members:10 },
];

const DISTRICTS = [
  { name:'Mumbai City',   risk:'Critical', incidents:89, evacuated:4200, shelters:8,  teams:12 },
  { name:'Mumbai Suburbs',risk:'High',     incidents:67, evacuated:3100, shelters:14, teams:18 },
  { name:'Thane',         risk:'High',     incidents:42, evacuated:2200, shelters:9,  teams:8  },
  { name:'Raigad',        risk:'Medium',   incidents:28, evacuated:1400, shelters:6,  teams:5  },
  { name:'Palghar',       risk:'Medium',   incidents:21, evacuated:890,  shelters:4,  teams:4  },
];

const AI_INTEL = [
  { emoji:'🌊', title:'Flood Peak Prediction', text:'Mithi River expected to peak at 5.2m in 4–6 hours. Recommend pre-emptive evacuation of Zones A–C in Kurla.', badge:'High Confidence' },
  { emoji:'🏥', title:'Medical Resource Demand', text:'Hospital capacity projected at 112% in 8 hours. Activating 3 field medical stations at BKC, Dharavi, Chembur.', badge:'Action Required' },
  { emoji:'🚁', title:'Aerial Rescue Priority', text:'AI identifies 3 isolated clusters in Bandra, Kurla, Chembur. Recommending helicopter deployment sequence for maximum coverage.', badge:'Optimised' },
];

function renderDashboard() {
  // KPI cards
  const kpiEl = document.getElementById('dash-kpi');
  if (kpiEl && !kpiEl.dataset.rendered) {
    kpiEl.dataset.rendered = '1';
    kpiEl.innerHTML = DASH_KPI.map(k => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${k.color}">${k.icon}</div>
        <div class="stat-value" style="color:${k.textColor}">${k.value.toLocaleString()}</div>
        <div class="stat-label">${k.label}</div>
        <div class="stat-change up">${k.change} this hour</div>
      </div>
    `).join('');
  }

  // Resource chart
  const rcEl = document.getElementById('resource-chart');
  if (rcEl && !rcEl.dataset.rendered) {
    rcEl.dataset.rendered = '1';
    rcEl.innerHTML = RESOURCES.map(r => {
      const pct = Math.round((r.value / r.max) * 100);
      return `
        <div class="chart-row">
          <div class="chart-label">${r.label}</div>
          <div class="chart-bar-bg">
            <div class="chart-fill" style="width:${pct}%;background:${r.color}">${pct}%</div>
          </div>
          <div class="chart-val" style="color:${r.color}">${r.value.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  // Heatmap
  renderHeatmap();

  // Rescue teams
  const rtEl = document.getElementById('rescue-teams-list');
  if (rtEl && !rtEl.dataset.rendered) {
    rtEl.dataset.rendered = '1';
    rtEl.innerHTML = RESCUE_TEAMS.map(t => `
      <div class="rescue-team-row">
        <span class="team-status ${t.status}"></span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${t.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">📍 ${t.loc} · ${t.members} members</div>
        </div>
        <span class="badge ${t.status === 'active' ? 'badge-low' : 'badge-medium'}">${t.status}</span>
      </div>
    `).join('');
  }

  // Mini charts
  renderMiniChart('chart-incidents', [24,38,29,55,67,82,89], '#ef4444');
  renderMiniChart('chart-shelter',   [3200,4100,5500,7200,9400,11000,12480], '#22c55e');
  renderMiniChart('chart-rescue',    [40,55,62,70,80,84,89], '#3b82f6');

  // District table
  const dtEl = document.getElementById('district-table');
  if (dtEl && !dtEl.dataset.rendered) {
    dtEl.dataset.rendered = '1';
    dtEl.innerHTML = DISTRICTS.map(d => `
      <tr>
        <td style="font-weight:600">${d.name}</td>
        <td><span class="badge ${d.risk === 'Critical' ? 'badge-critical' : d.risk === 'High' ? 'badge-high' : 'badge-medium'}">${d.risk}</span></td>
        <td>${d.incidents}</td>
        <td>${d.evacuated.toLocaleString()}</td>
        <td>${d.shelters}</td>
        <td>${d.teams}</td>
        <td><span class="badge badge-info">Active</span></td>
      </tr>
    `).join('');
  }

  // AI Intel
  const aiEl = document.getElementById('ai-intel-grid');
  if (aiEl && !aiEl.dataset.rendered) {
    aiEl.dataset.rendered = '1';
    aiEl.innerHTML = AI_INTEL.map(a => `
      <div class="card card-sm">
        <div style="font-size:1.8rem;margin-bottom:8px">${a.emoji}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h4 style="font-size:0.85rem">${a.title}</h4>
          <span class="badge badge-purple" style="font-size:10px">${a.badge}</span>
        </div>
        <p style="font-size:12px">${a.text}</p>
      </div>
    `).join('');
  }
}

function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = '1';
  const colors = ['#22c55e','#22c55e','#f59e0b','#f59e0b','#f97316','#f97316','#ef4444','#ef4444','#dc2626','#f59e0b'];
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    const rand = Math.random();
    const color = rand < 0.25 ? '#22c55e' : rand < 0.50 ? '#f59e0b' : rand < 0.75 ? '#f97316' : rand < 0.90 ? '#ef4444' : '#dc2626';
    cell.style.background = color;
    cell.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
    cell.title = `Zone ${i + 1}`;
    grid.appendChild(cell);
  }
}

function renderMiniChart(containerId, data, color) {
  const el = document.getElementById(containerId);
  if (!el || el.dataset.rendered) return;
  el.dataset.rendered = '1';
  const max = Math.max(...data);
  el.innerHTML = data.map(v => {
    const h = Math.max(8, Math.round((v / max) * 48));
    return `<div class="mini-bar" style="height:${h}px;background:${color};opacity:${0.5 + (v/max)*0.5}"></div>`;
  }).join('');
}

function startDashTicker() {
  // CSS animation handles the ticker — nothing to do in JS
}

// ══════════════════════════════════════════════════
// DAMAGE ASSESSMENT
// ══════════════════════════════════════════════════

async function runDamageAssessment() {
  const type     = document.getElementById('assess-type').value;
  const area     = document.getElementById('assess-area').value;
  const pop      = document.getElementById('assess-pop').value;
  const duration = document.getElementById('assess-duration').value;

  const output = document.getElementById('assess-output');
  output.innerHTML = `<div class="card" style="text-align:center;padding:40px">
    <div class="loader" style="width:32px;height:32px;margin:0 auto 16px;border-width:3px"></div>
    <p>IBM Watsonx.ai is processing your assessment…</p>
  </div>`;

  showToast('🧠', 'AI Running…', 'Watsonx.ai is generating damage assessment…', 'info', 3000);

  try {
    await WatsonX.assessDamage(type, area, pop);
  } catch (_) {}

  setTimeout(() => {
    output.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>🔍 AI Assessment Results — ${type}</h3>
            <span class="watsonx-badge">IBM Watsonx.ai</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
              { label:'Affected Population',    value:'~' + Math.round(pop * 0.38).toLocaleString(), color:'var(--red)' },
              { label:'Infrastructure Damage',   value:'34%',  color:'var(--orange)' },
              { label:'Economic Impact',         value:'$' + Math.round(area * 4.2).toFixed(0) + 'M – $' + Math.round(area * 5.5).toFixed(0) + 'M', color:'var(--yellow)' },
              { label:'Displaced Persons',       value:Math.round(pop * 0.12).toLocaleString(), color:'var(--accent)' },
            ].map(row => `
              <div class="damage-row">
                <div class="damage-label">${row.label}</div>
                <div class="damage-bar-wrap"><div class="progress"><div class="progress-bar blue" style="width:65%"></div></div></div>
                <div class="damage-value" style="color:${row.color}">${row.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <h4 style="margin-bottom:12px">🗓️ Recovery Timeline</h4>
          <div class="timeline">
            ${[
              { dot:'bg:var(--red)',    emoji:'🚨', phase:'Immediate Response',    time:'0–72 hours', desc:'Search & rescue, medical, water, food' },
              { dot:'bg:var(--yellow)',emoji:'🏕️', phase:'Relief Operations',     time:'Week 1–4',   desc:'Shelter, supply distribution, damage survey' },
              { dot:'bg:var(--accent)',emoji:'🔧', phase:'Early Recovery',         time:'Month 1–3',  desc:'Infrastructure repair, school reopen' },
              { dot:'bg:var(--green)', emoji:'🏗️', phase:'Full Reconstruction',   time:'Month 3–12', desc:'Permanent housing, livelihood restoration' },
            ].map(t => `
              <div class="tl-item">
                <div class="tl-dot" style="background:var(--bg3);border:2px solid var(--border)">${t.emoji}</div>
                <div class="tl-body">
                  <h4>${t.phase} <span style="color:var(--text-muted);font-size:12px;font-weight:400">· ${t.time}</span></h4>
                  <p>${t.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    showToast('✅', 'Assessment Complete', `${type} damage assessment ready.`, 'success');
  }, 3000);
}

// ══════════════════════════════════════════════════
// SOS SYSTEM
// ══════════════════════════════════════════════════

function triggerSOS() {
  sosCount = 5;
  document.getElementById('sos-countdown').textContent = sosCount;
  document.getElementById('sos-sec').textContent = sosCount;
  document.getElementById('sos-modal').classList.add('open');
  clearInterval(sosTimer);
  sosTimer = setInterval(() => {
    sosCount--;
    document.getElementById('sos-countdown').textContent = sosCount;
    document.getElementById('sos-sec').textContent = sosCount;
    if (sosCount <= 0) { clearInterval(sosTimer); activateSOS(); }
  }, 1000);
}

function cancelSOS() {
  clearInterval(sosTimer);
  document.getElementById('sos-modal').classList.remove('open');
}

function activateSOS() {
  clearInterval(sosTimer);
  document.getElementById('sos-modal').classList.remove('open');
  showToast('🆘', 'SOS ACTIVATED', 'Live location sent to rescue teams & emergency contacts!', 'error', 8000);
}

// ══════════════════════════════════════════════════
// AI CHAT
// ══════════════════════════════════════════════════

function appendMessage(role, text, containerId = 'chat-messages') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-bubble">${text}</div>
    <div class="msg-time">${now}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendMessage('user', text);

  const thinking = document.createElement('div');
  thinking.className = 'msg bot';
  thinking.innerHTML = '<div class="msg-bubble"><div class="loader"></div></div>';
  const msgs = document.getElementById('chat-messages');
  msgs.appendChild(thinking);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const reply = await WatsonX.chatQuery(text, 'DisasterNet AI Emergency Response. Location: Mumbai. Active flood and cyclone alerts.');
    thinking.remove();
    appendMessage('bot', reply);
  } catch {
    thinking.remove();
    appendMessage('bot', 'I am monitoring the situation. Current flood risk is HIGH in your area. Please stay on higher ground and follow official evacuation orders.');
  }
}

function initBotGreeting() {
  setTimeout(() => {
    appendMessage('bot', '👋 Hello! I am DisasterNet AI powered by IBM Watsonx.ai. I have detected active flood alerts in Mumbai. How can I assist you with evacuation, shelters, or safety guidance?');
  }, 800);
}

// ══════════════════════════════════════════════════
// INIT APP (called after login)
// ══════════════════════════════════════════════════

function initApp() {
  showPage('home');
  animateAllCounters();
  initBotGreeting();
  calculateRoutes(); // pre-calculate routes for evacuate page
}

// ══════════════════════════════════════════════════
// DOM CONTENT LOADED — WIRE EVERYTHING
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Check for existing session ──
  const stored = localStorage.getItem('disasternet_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      currentUser = user;
      applyUserToUI(user);
      hideAuth();
      initApp();
    } catch (_) {
      localStorage.removeItem('disasternet_user');
    }
  }
  // If no session: auth overlay is already visible (default state)

  // ── Nav link clicks ──
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => showPage(link.dataset.page));
  });

  // ── SOS button ──
  const sosBtn = document.getElementById('sos-trigger');
  if (sosBtn) sosBtn.addEventListener('click', triggerSOS);

  // ── Chat: Enter key ──
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });

  // ── Dispatch modal: close on backdrop click ──
  document.getElementById('dispatch-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('dispatch-modal')) closeDispatchModal();
  });

  // ── SOS modal: close on backdrop click ──
  document.getElementById('sos-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('sos-modal')) cancelSOS();
  });

  // ── Map: reinitialise on tab switch (Leaflet needs visible container) ──
  document.querySelector('[data-page="map"]')?.addEventListener('click', () => {
    setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 100);
  });

  // ── Evacuate page: render vehicle grid when tab clicked ──
  document.querySelector('[data-page="evacuate"]')?.addEventListener('click', renderVehicleGrid);

  // ── Shelter search input ──
  const shelterSearch = document.getElementById('shelter-search');
  if (shelterSearch) {
    shelterSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#shelter-grid .shelter-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

});
