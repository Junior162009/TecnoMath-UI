(() => {
'use strict';

const OWNER = 'Junior162009';
const REPO = 'MindMathArcade';
const BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const norm = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const imageExt = /\.(png|jpe?g|webp|gif|svg|avif)(?:\?.*)?$/i;

async function json(url, fallback) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    return r.ok ? await r.json() : fallback;
  } catch {
    return fallback;
  }
}

async function text(url, fallback = '') {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    return r.ok ? await r.text() : fallback;
  } catch {
    return fallback;
  }
}

function rawAsset(path) {
  return RAW + path.split('/').map(encodeURIComponent).join('/');
}

// Analiza literalmente el nombre/ruta de CADA imagen encontrada dentro del juego.
// Se intenta elegir una portada/logo/thumbnail antes que sprites, fondos técnicos o assets pequeños.
function assetScore(asset, gameName, folder) {
  const path = asset.path;
  const p = norm(path);
  const file = norm(path.split('/').pop());
  const name = norm(gameName);
  const base = norm(folder);
  let score = 0;

  if (p.includes('/' + base + '/')) score += 100;
  if (file.includes(name)) score += 60;

  // Nombres que normalmente representan la imagen principal del juego.
  if (/cover|portada|thumbnail|thumb|preview|banner|hero|poster|card|gamecover/.test(file)) score += 140;
  if (/logo|logotipo|brand/.test(file)) score += 115;
  if (/icon|favicon/.test(file)) score += 55;
  if (/principal|main|front|menu|inicio|start/.test(file)) score += 75;

  // Penalizar assets que no son apropiados como portada.
  if (/sprite|sprites|tiles|tile|sheet|spritesheet|atlas|texture|textures/.test(file)) score -= 100;
  if (/background|bg|fondo|wallpaper/.test(file)) score -= 25;
  if (/player|enemy|enemigo|character|personaje|coin|moneda|button|btn|arrow|heart|life|sound|audio|particle/.test(file)) score -= 70;

  // PNG/JPG/WebP suelen ser los mejores candidatos para una tarjeta.
  if (/\.png$/i.test(path)) score += 18;
  if (/\.jpe?g$/i.test(path)) score += 15;
  if (/\.webp$/i.test(path)) score += 12;
  if (/\.svg$/i.test(path)) score += 8;

  return score;
}

function parseIndexImages(html, gamePath) {
  const found = [];
  const re = /<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["'][^>]*>|<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const rawValue = m[1] || m[2];
    if (!rawValue || rawValue.startsWith('data:')) continue;
    const raw = rawValue.split(',')[0].trim().split(/\s+/)[0];
    try {
      const u = new URL(raw, RAW + gamePath);
      if (imageExt.test(u.pathname)) found.push(u.href);
    } catch {}
  }
  return [...new Set(found)];
}

async function buildTree() {
  const r = await json(`${API}/git/trees/${BRANCH}?recursive=1`, null);
  return r?.tree || [];
}

async function discoverGames() {
  const tree = await buildTree();
  const indexes = tree.filter(x => x.type === 'blob' && /^games\/[^/]+\/index\.html$/i.test(x.path));
  const published = await json(RAW + 'games/published-games.json', []);
  const catalog = await json(RAW + 'data/games.json', []);
  const byUrl = new Map();

  [...(Array.isArray(catalog) ? catalog : []), ...(Array.isArray(published) ? published : [])].forEach(g => {
    if (g?.url) byUrl.set(g.url, g);
  });

  const games = [];

  for (const idx of indexes) {
    const path = idx.path;
    const meta = byUrl.get(path) || {};
    const folder = path.split('/')[1];
    let name = meta.name || folder.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const html = await text(rawAsset(path), '');

    if (html) {
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
      if (title && !meta.name) name = title.replace(/^\p{Extended_Pictographic}\s*/u, '').trim();
    }

    // AQUÍ está el cambio principal: no miramos solo unos cuantos nombres.
    // Recorremos TODOS los blobs que GitHub reporta dentro de la carpeta del juego.
    const allFiles = tree.filter(x => x.type === 'blob' && x.path.startsWith(`games/${folder}/`));
    const allImages = allFiles.filter(x => imageExt.test(x.path));
    const htmlImages = parseIndexImages(html, path);

    let explicit = '';
    if (meta.imageUrl) {
      try { explicit = new URL(meta.imageUrl, RAW).href; } catch {}
    }

    // Si el propio juego declara una imagen de portada/logo, se le da máxima prioridad.
    const htmlLocalImages = htmlImages.filter(url => url.includes(`/games/${encodeURIComponent(folder)}/`) || url.includes(`/games/${folder}/`));
    const ranked = [...allImages].sort((a, b) => assetScore(b, name, folder) - assetScore(a, name, folder));
    const bestAsset = ranked[0] ? rawAsset(ranked[0].path) : '';

    // Prioridad absoluta: catálogo explícito -> imagen usada en HTML -> mejor asset de TODA la carpeta.
    const image = explicit || htmlLocalImages[0] || htmlImages[0] || bestAsset || '';

    games.push({
      ...meta,
      name,
      url: path,
      image,
      imageSource: explicit ? 'catalog' : htmlImages.length ? 'game-html' : bestAsset ? 'folder-scan' : 'none',
      assetCount: allImages.length,
      icon: meta.icon || '🎮'
    });
  }

  const seen = new Set();
  return games.filter(g => {
    if (seen.has(g.url)) return false;
    seen.add(g.url);
    return true;
  });
}

function render(games) {
  const grid = document.querySelector('.game-grid');
  if (!grid) return;
  if (!games.length) {
    grid.innerHTML = '<p class="tm-muted">No se encontraron juegos.</p>';
    return;
  }

  grid.innerHTML = games.map(g => {
    const art = g.image
      ? `<img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="game-art" hidden>${esc(g.icon || '🎮')}</span>`
      : `<span class="game-art">${esc(g.icon || '🎮')}</span>`;

    return `<article class="game-card tm-live-game-card">
      <div class="game-image">${art}<span class="game-badge">${esc(g.category || 'Juego')}</span></div>
      <div class="game-info">
        <h3>${esc(g.name)}</h3>
        <p>${esc(g.desc || g.description || 'Juego educativo de TecnoMath')}</p>
        <div class="game-meta">
          <small>🎮 ${esc(g.deviceCompatibility || 'Web')}</small>
          <button class="tm-btn tm-btn-primary" type="button" data-route="${esc(g.url)}">Jugar</button>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => {
    location.assign(new URL(b.dataset.route, 'https://tecnomath.online/').href);
  }));
}

function styles() {
  if (document.getElementById('tm-games-original-art')) return;
  const s = document.createElement('style');
  s.id = 'tm-games-original-art';
  s.textContent = `
    .tm-live-game-card { overflow: hidden; }
    .tm-live-game-card .game-image { position: relative; min-height: 190px; background: var(--tm-surface-2); overflow: hidden; }
    .tm-live-game-card .game-image img { width: 100%; height: 190px; object-fit: cover; display: block; }
    .tm-live-game-card .game-badge { position: absolute; top: 12px; left: 12px; z-index: 3; }
    .tm-live-game-card .game-art { display: grid; place-items: center; height: 190px; font-size: 4rem; }
  `;
  document.head.appendChild(s);
}

async function init() {
  styles();
  const games = await discoverGames();
  render(games);
  window.TecnoMathGames = games;
  console.info('[TecnoMath] Juegos:', games.length, 'Assets analizados por juego:', games.reduce((n, g) => n + (g.assetCount || 0), 0));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
})();