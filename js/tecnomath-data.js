(() => {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCf0YVT4fQ5emX4R2LdUXU3FxjBTtY7Gzc',
    authDomain: 'tecnomath-sync-6058a.firebaseapp.com',
    databaseURL: 'https://tecnomath-sync-6058a-default-rtdb.firebaseio.com',
    projectId: 'tecnomath-sync-6058a',
    storageBucket: 'tecnomath-sync-6058a.firebasestorage.app',
    messagingSenderId: '237823560752',
    appId: '1:237823560752:web:adc1e5b396b5a0e0d671f5'
  };

  const BASE = 'https://tecnomath.online/';
  const RAW = 'https://raw.githubusercontent.com/Junior162009/MindMathArcade/main/';
  const IMAGE_MAP = {
    'BanderQuiz': RAW + 'img/banderquiz.png',
    'Eco Recolector': RAW + 'img/ecorecolector.png',
    'Animalandia': RAW + 'img/animalandia.png',
    'BitRush': RAW + 'img/bitrush.jpeg'
  };

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const num = value => Number(value || 0);
  const dateValue = value => {
    if (!value) return 0;
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (value.seconds) return value.seconds * 1000;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  const formatDate = value => {
    const t = dateValue(value);
    return t ? new Intl.DateTimeFormat('es-CO', { day:'2-digit', month:'short', year:'numeric' }).format(t) : 'Sin fecha';
  };
  const statusOf = t => {
    const now = Date.now();
    const start = dateValue(t.startAt);
    const end = dateValue(t.endAt);
    if (t.status) return String(t.status).toLowerCase();
    if (start && now < start) return 'upcoming';
    if (end && now > end) return 'finished';
    return 'active';
  };
  const statusLabel = s => ({ active:'🟢 EN VIVO', upcoming:'🟡 PRÓXIMO', finished:'⚪ FINALIZADO' }[s] || String(s).toUpperCase());

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function loadFirebase() {
    if (!window.firebase) {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');
    }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return { auth: firebase.auth(), db: firebase.database(), firestore: firebase.firestore() };
  }

  async function loadGames() {
    const fromJson = await fetch(RAW + 'data/games.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []);
    const fromFirebase = await fetch(BASE + 'data/games.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []);
    const list = Array.isArray(fromJson) ? fromJson : (Array.isArray(fromFirebase) ? fromFirebase : []);
    const merged = new Map();
    list.forEach(g => {
      if (!g?.name || !g?.url) return;
      merged.set(g.name.toLowerCase(), { ...g });
    });
    try {
      const { db } = await loadFirebase();
      const snap = await db.ref('publishedGames').once('value');
      Object.values(snap.val() || {}).forEach(g => {
        if (!g?.name && !g?.title) return;
        const item = { ...g, name: g.name || g.title, url: g.url || g.gameUrl || g.path };
        if (!item.url) return;
        const key = item.name.toLowerCase();
        merged.set(key, { ...(merged.get(key) || {}), ...item });
      });
    } catch (e) { console.warn('[TecnoMath] No se pudo leer publishedGames:', e); }
    return [...merged.values()];
  }

  function gameImage(game) {
    const explicit = game.imageUrl || game.image || game.thumbnail || game.cover;
    if (explicit) return /^https?:/i.test(explicit) ? explicit : new URL(explicit.replace(/^\//,''), BASE).href;
    return IMAGE_MAP[game.name] || '';
  }

  function gameTheme(name) {
    const n = String(name).toLowerCase();
    if (n.includes('battle') || n.includes('math')) return 'math';
    if (n.includes('band')) return 'flags';
    if (n.includes('cookie') || n.includes('arcade')) return 'kingdom';
    return 'kingdom';
  }

  function renderGames(games) {
    const grid = document.querySelector('.game-grid');
    if (!grid) return;
    if (!games.length) return;
    grid.innerHTML = games.map((g, i) => {
      const name = esc(g.name || 'Juego TecnoMath');
      const desc = esc(g.desc || g.description || 'Una experiencia educativa de TecnoMath.');
      const image = gameImage(g);
      const route = g.url || '';
      const category = esc(g.category || 'juego');
      const art = esc(g.icon || ['🎮','🧠','🏰','🌎','⚡'][i % 5]);
      const safeRoute = esc(route);
      return `<article class="game-card tm-live-game-card" data-live-game="${name}">
        <div class="game-image ${gameTheme(name)}" style="${image ? `background-image:url('${image}');background-size:cover;background-position:center;` : ''}">
          <span class="game-badge">${category}</span>
          ${image ? '<span class="tm-game-image-shade"></span>' : `<span class="game-art">${art}</span>`}
        </div>
        <div class="game-info">
          <h3>${name}</h3>
          <p>${desc}</p>
          <div class="game-meta"><small>🎮 ${esc(g.deviceCompatibility || 'Web')} · ${esc(g.authorName || 'TecnoMath')}</small><button class="tm-btn tm-btn-primary" type="button" data-live-game-route="${safeRoute}">Jugar</button></div>
        </div>
      </article>`;
    }).join('');
    grid.querySelectorAll('[data-live-game-route]').forEach(btn => btn.addEventListener('click', () => {
      const route = btn.dataset.liveGameRoute;
      if (route) location.assign(new URL(route, BASE).href);
    }));
  }

  function ensureDataStyles() {
    if (document.getElementById('tm-live-data-styles')) return;
    const style = document.createElement('style');
    style.id = 'tm-live-data-styles';
    style.textContent = `
      .tm-live-game-card .game-image{background-color:var(--tm-surface-2);background-repeat:no-repeat;}
      .tm-game-image-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.42));}
      .tm-data-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;}
      .tm-data-panel{padding:22px;border:1px solid var(--tm-border);border-radius:16px;background:var(--tm-surface);color:var(--tm-text);}
      .tm-data-panel h3{margin:0 0 6px}.tm-data-panel p{color:var(--tm-muted);margin:0 0 16px}
      .tm-live-rank{display:grid;gap:8px}.tm-live-rank-item{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--tm-border);border-radius:11px;background:var(--tm-surface-2)}
      .tm-live-rank-item small{display:block;color:var(--tm-muted)}.tm-live-rank-item strong:last-child{font-variant-numeric:tabular-nums}
      .tm-tournament-list{display:grid;gap:10px}.tm-tournament{padding:14px;border:1px solid var(--tm-border);border-radius:12px;background:var(--tm-surface-2)}.tm-tournament-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.tm-tournament h4{margin:0}.tm-tournament-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;color:var(--tm-muted);font-size:.82rem}.tm-data-empty{padding:16px;border:1px dashed var(--tm-border);border-radius:12px;color:var(--tm-muted)}
      .tm-data-loading{opacity:.65;animation:tmPulse 1.2s ease-in-out infinite alternate}@keyframes tmPulse{to{opacity:.35}}
      @media(max-width:800px){.tm-data-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addDataPanels() {
    if (document.getElementById('tm-live-data')) return;
    const gamesSection = document.querySelector('#juegos')?.closest('.app-section');
    if (!gamesSection) return;
    const section = document.createElement('section');
    section.className = 'app-section';
    section.id = 'tm-live-data';
    section.innerHTML = `<div class="tm-container"><div class="section-head"><div><h2>🏆 Competición en TecnoMath</h2><p>Datos reales de rankings y torneos sincronizados con MindMathArcade.</p></div><span class="tm-badge tm-badge-success">● EN VIVO</span></div><div class="tm-data-grid"><article class="tm-data-panel"><h3>🌎 Ranking global</h3><p>Los mejores jugadores según la puntuación registrada.</p><div id="tm-live-ranking" class="tm-live-rank tm-data-loading"><div class="tm-data-empty">Cargando ranking…</div></div></article><article class="tm-data-panel"><h3>🏟️ Torneos</h3><p>Eventos actuales, próximos y finalizados.</p><div id="tm-live-tournaments" class="tm-tournament-list tm-data-loading"><div class="tm-data-empty">Cargando torneos…</div></div></article></div></div>`;
    gamesSection.after(section);
  }

  async function loadRanking(fire) {
    const box = document.getElementById('tm-live-ranking');
    if (!box) return;
    try {
      const snap = await fire.firestore.collection('leaderboards').doc('global').collection('players').limit(50).get();
      const rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      rows.sort((a,b) => num(b.score ?? b.points ?? b.totalScore ?? b.xp) - num(a.score ?? a.points ?? a.totalScore ?? a.xp));
      if (!rows.length) throw new Error('empty');
      box.classList.remove('tm-data-loading');
      box.innerHTML = rows.slice(0,10).map((r,i) => `<div class="tm-live-rank-item"><strong>${['🥇','🥈','🥉'][i] || `#${i+1}`}</strong><span>${esc(r.displayName || r.username || r.name || `Jugador ${i+1}`)}<small>Nivel ${esc(r.level ?? r.nivel ?? '—')}</small></span><strong>${num(r.score ?? r.points ?? r.totalScore ?? r.xp).toLocaleString('es-CO')}</strong></div>`).join('');
    } catch (e) {
      box.classList.remove('tm-data-loading');
      box.innerHTML = `<div class="tm-data-empty">El ranking necesita una sesión activa para consultar los jugadores.</div>`;
    }
  }

  async function loadTournaments(fire) {
    const box = document.getElementById('tm-live-tournaments');
    if (!box) return;
    try {
      const snap = await fire.firestore.collection('tournaments').orderBy('startAt', 'asc').limit(20).get();
      const rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      rows.sort((a,b) => {
        const order = {active:0, upcoming:1, finished:2};
        return (order[statusOf(a)] ?? 3) - (order[statusOf(b)] ?? 3) || dateValue(a.startAt)-dateValue(b.startAt);
      });
      box.classList.remove('tm-data-loading');
      if (!rows.length) { box.innerHTML = '<div class="tm-data-empty">No hay torneos registrados todavía.</div>'; return; }
      box.innerHTML = rows.slice(0,6).map(t => {
        const s = statusOf(t);
        return `<div class="tm-tournament"><div class="tm-tournament-top"><h4>${esc(t.name || t.title || 'Torneo TecnoMath')}</h4><span class="tm-badge">${statusLabel(s)}</span></div><div class="tm-tournament-meta"><span>📅 ${formatDate(t.startAt)}</span>${t.endAt ? `<span>→ ${formatDate(t.endAt)}</span>` : ''}<span>🎮 ${esc(t.gameName || t.game || 'TecnoMath')}</span></div></div>`;
      }).join('');
    } catch (e) {
      box.classList.remove('tm-data-loading');
      box.innerHTML = '<div class="tm-data-empty">No se pudieron consultar los torneos. Inicia sesión para acceder a la competición.</div>';
    }
  }

  async function init() {
    ensureDataStyles();
    addDataPanels();
    const games = await loadGames();
    renderGames(games);
    try {
      const fire = await loadFirebase();
      if (!fire.auth.currentUser) {
        try { await fire.auth.signInAnonymously(); } catch (e) { console.warn('[TecnoMath] Auth anónima no disponible:', e); }
      }
      await Promise.all([loadRanking(fire), loadTournaments(fire)]);
    } catch (e) {
      console.warn('[TecnoMath] Firebase no disponible:', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
