(() => {
'use strict';

const OWNER = 'Junior162009';
const REPO = 'MindMathArcade';
const BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const imageExt = /\.(png|jpe?g|webp|gif|svg|avif)(?:\?.*)?$/i;

async function json(url, fallback) {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.json() : fallback; }
  catch { return fallback; }
}
async function text(url, fallback = '') {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.text() : fallback; }
  catch { return fallback; }
}
function rawAsset(path) { return RAW + path.split('/').map(encodeURIComponent).join('/'); }

function assetScore(asset, gameName, folder) {
  const file = norm(asset.path.split('/').pop());
  const name = norm(gameName);
  const base = norm(folder);
  let score = 0;
  if (file.includes(name)) score += 100;
  if (file.includes(base)) score += 80;
  if (/cover|portada|thumbnail|thumb|preview|banner|hero|poster|gamecover/.test(file)) score += 180;
  if (/logo|logotipo|brand/.test(file)) score += 140;
  if (/principal|main|front|menu|inicio|start/.test(file)) score += 90;
  if (/icon|favicon/.test(file)) score += 40;
  if (/sprite|sprites|tiles|tile|sheet|spritesheet|atlas|texture|textures/.test(file)) score -= 150;
  if (/player|enemy|enemigo|character|personaje|coin|moneda|button|btn|arrow|heart|life|particle/.test(file)) score -= 100;
  if (/background|bg|fondo|wallpaper/.test(file)) score -= 35;
  if (/\.png$/i.test(asset.path)) score += 20;
  if (/\.jpe?g$/i.test(asset.path)) score += 18;
  if (/\.webp$/i.test(asset.path)) score += 16;
  return score;
}

function parseIndexImages(html, gamePath) {
  const found = [];
  const re = /<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["'][^>]*>|<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const value = m[1] || m[2];
    if (!value || value.startsWith('data:')) continue;
    const raw = value.split(',')[0].trim().split(/\s+/)[0];
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
  [...(Array.isArray(catalog) ? catalog : []), ...(Array.isArray(published) ? published : [])].forEach(g => { if (g?.url) byUrl.set(g.url, g); });

  const games = [];
  for (const idx of indexes) {
    const path = idx.path;
    const folder = path.split('/')[1];
    const meta = byUrl.get(path) || {};
    const html = await text(rawAsset(path), '');
    let name = meta.name || folder.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (html) {
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
      if (title && !meta.name) name = title.replace(/^\p{Extended_Pictographic}\s*/u, '').trim();
    }

    const allImages = tree.filter(x => x.type === 'blob' && x.path.startsWith(`games/${folder}/`) && imageExt.test(x.path));
    const htmlImages = parseIndexImages(html, path);
    const ranked = [...allImages].sort((a, b) => assetScore(b, name, folder) - assetScore(a, name, folder));
    let explicit = '';
    if (meta.imageUrl) { try { explicit = new URL(meta.imageUrl, RAW).href; } catch {} }
    const localHtml = htmlImages.filter(url => url.includes(`/games/${encodeURIComponent(folder)}/`) || url.includes(`/games/${folder}/`));
    const candidates = [...(explicit ? [explicit] : []), ...localHtml, ...htmlImages, ...ranked.map(x => rawAsset(x.path))]
      .filter((v, i, a) => v && a.indexOf(v) === i);

    games.push({ ...meta, name, url: path, image: candidates[0] || '', imageCandidates: candidates, assetCount: allImages.length, icon: meta.icon || '🎮' });
  }

  const seen = new Set();
  return games.filter(g => { if (seen.has(g.url)) return false; seen.add(g.url); return true; });
}

function render(games) {
  const grid = document.querySelector('.game-grid');
  if (!grid) return;
  if (!games.length) { grid.innerHTML = '<p class="tm-muted">No se encontraron juegos.</p>'; return; }

  grid.classList.add('tm-games-modern-grid');
  grid.innerHTML = games.map(g => {
    const candidates = JSON.stringify(g.imageCandidates || [g.image || '']).replace(/</g, '\\u003c');
    return `<article class="game-card tm-live-game-card">
      <div class="game-image">
        <div class="game-image-stage" data-candidates='${esc(candidates)}'>
          <img class="game-cover" src="${esc(g.image || '')}" alt="${esc(g.name)}" loading="lazy" decoding="async">
          <div class="game-cover-placeholder" aria-hidden="true"><span>${esc(g.icon || '🎮')}</span></div>
        </div>
        <span class="game-badge">${esc(g.category || 'Juego')}</span>
      </div>
      <div class="game-info">
        <div class="game-copy">
          <h3>${esc(g.name)}</h3>
          <p>${esc(g.desc || g.description || 'Juego educativo de TecnoMath')}</p>
        </div>
        <div class="game-meta">
          <small>${esc(g.deviceCompatibility || 'Web')}</small>
          <button class="tm-btn tm-btn-primary" type="button" data-route="${esc(g.url)}">Jugar <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.game-image-stage').forEach(stage => {
    let candidates = [];
    try { candidates = JSON.parse(stage.dataset.candidates || '[]'); } catch {}
    const img = stage.querySelector('.game-cover');
    const placeholder = stage.querySelector('.game-cover-placeholder');
    let pos = 0;
    let loaded = false;
    const tryNext = () => {
      if (!img || pos >= candidates.length) {
        if (img) img.hidden = true;
        if (placeholder) placeholder.hidden = false;
        return;
      }
      const next = candidates[pos++];
      if (!next) return tryNext();
      img.hidden = false;
      img.src = next;
    };
    img?.addEventListener('load', () => {
      loaded = true;
      img.hidden = false;
      if (placeholder) placeholder.hidden = true;
    });
    img?.addEventListener('error', () => {
      if (!loaded) tryNext();
    });
    if (!img?.getAttribute('src')) tryNext();
  });

  grid.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => {
    location.assign(new URL(button.dataset.route, 'https://tecnomath.online/').href);
  }));
}

function styles() {
  if (document.getElementById('tm-games-original-art')) return;
  const s = document.createElement('style');
  s.id = 'tm-games-original-art';
  s.textContent = `
    .tm-games-modern-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      gap: 22px !important;
      align-items: stretch;
    }
    .tm-live-game-card {
      min-width: 0;
      overflow: hidden;
      background: var(--tm-surface, #fff) !important;
      border: 1px solid color-mix(in srgb, var(--tm-border) 78%, transparent) !important;
      border-radius: 18px !important;
      box-shadow: 0 2px 10px rgba(15,23,42,.06) !important;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease !important;
    }
    .tm-live-game-card:hover {
      transform: translateY(-5px) !important;
      border-color: color-mix(in srgb, var(--tm-primary) 28%, var(--tm-border)) !important;
      box-shadow: 0 16px 34px rgba(15,23,42,.12) !important;
    }
    .tm-live-game-card .game-image {
      position: relative;
      height: 205px !important;
      min-height: 205px !important;
      background: var(--tm-surface-2) !important;
      overflow: hidden;
      display: block !important;
    }
    .tm-live-game-card .game-image-stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-sizing: border-box;
    }
    .tm-live-game-card .game-image-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.08), transparent 42%);
      pointer-events: none;
    }
    .tm-live-game-card .game-cover {
      position: relative;
      z-index: 1;
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain !important;
      object-position: center !important;
      border-radius: 10px;
      transition: transform 220ms ease;
    }
    .tm-live-game-card:hover .game-cover { transform: scale(1.025); }
    .tm-live-game-card .game-cover-placeholder {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 3.5rem;
    }
    .tm-live-game-card .game-cover-placeholder span {
      width: 74px;
      height: 74px;
      display: grid;
      place-items: center;
      border-radius: 20px;
      background: color-mix(in srgb, var(--tm-primary) 12%, var(--tm-surface));
    }
    .tm-live-game-card .game-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 4;
      background: rgba(255,255,255,.94) !important;
      color: #20262e !important;
      border: 1px solid rgba(0,0,0,.06);
      border-radius: 999px;
      padding: 6px 10px;
      font-size: .68rem;
      font-weight: 850;
      box-shadow: 0 3px 10px rgba(0,0,0,.08);
      backdrop-filter: blur(8px);
    }
    .tm-live-game-card .game-info {
      min-height: 150px;
      padding: 17px 18px 18px !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }
    .tm-live-game-card .game-info h3 {
      margin: 0 0 6px !important;
      font-size: 1.08rem;
      line-height: 1.25;
      letter-spacing: -.015em;
      color: var(--tm-text) !important;
    }
    .tm-live-game-card .game-info p {
      margin: 0 !important;
      color: var(--tm-muted) !important;
      font-size: .9rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tm-live-game-card .game-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 13px;
      border-top: 1px solid color-mix(in srgb, var(--tm-border) 65%, transparent);
    }
    .tm-live-game-card .game-meta small {
      color: var(--tm-muted) !important;
      font-size: .76rem;
      font-weight: 750;
    }
    .tm-live-game-card .game-meta .tm-btn {
      width: auto !important;
      min-height: 38px;
      padding: 8px 13px;
      border-radius: 10px;
      font-size: .82rem;
      white-space: nowrap;
    }
    html[data-theme="dark"] .tm-live-game-card .game-badge {
      background: rgba(24,28,34,.94) !important;
      color: #fff !important;
      border-color: rgba(255,255,255,.08);
    }
    @media (max-width: 640px) {
      .tm-games-modern-grid { grid-template-columns: 1fr !important; }
      .tm-live-game-card .game-image { height: 220px !important; min-height: 220px !important; }
    }
  `;
  document.head.appendChild(s);
}

async function init() {
  styles();
  const games = await discoverGames();
  render(games);
  window.TecnoMathGames = games;
  console.info('[TecnoMath] Juegos:', games.length, 'Assets analizados:', games.reduce((n, g) => n + (g.assetCount || 0), 0));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
})();
