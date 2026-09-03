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
  const path = asset.path;
  const file = norm(path.split('/').pop());
  const name = norm(gameName);
  const base = norm(folder);
  let score = 0;
  if (file.includes(name)) score += 100;
  if (file.includes(base)) score += 80;
  if (/cover|portada|thumbnail|thumb|preview|banner|hero|poster|card|gamecover/.test(file)) score += 180;
  if (/logo|logotipo|brand/.test(file)) score += 140;
  if (/principal|main|front|menu|inicio|start/.test(file)) score += 90;
  if (/icon|favicon/.test(file)) score += 40;
  if (/sprite|sprites|tiles|tile|sheet|spritesheet|atlas|texture|textures/.test(file)) score -= 150;
  if (/player|enemy|enemigo|character|personaje|coin|moneda|button|btn|arrow|heart|life|particle/.test(file)) score -= 100;
  if (/background|bg|fondo|wallpaper/.test(file)) score -= 35;
  if (/\.png$/i.test(path)) score += 20;
  if (/\.jpe?g$/i.test(path)) score += 18;
  if (/\.webp$/i.test(path)) score += 16;
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

    // Todas las imágenes del juego, no solo las que tienen nombres conocidos.
    const allImages = tree.filter(x => x.type === 'blob' && x.path.startsWith(`games/${folder}/`) && imageExt.test(x.path));
    const htmlImages = parseIndexImages(html, path);
    const ranked = [...allImages].sort((a, b) => assetScore(b, name, folder) - assetScore(a, name, folder));

    let explicit = '';
    if (meta.imageUrl) { try { explicit = new URL(meta.imageUrl, RAW).href; } catch {} }
    const localHtml = htmlImages.filter(url => url.includes(`/games/${encodeURIComponent(folder)}/`) || url.includes(`/games/${folder}/`));
    const candidates = [
      ...(explicit ? [explicit] : []),
      ...localHtml,
      ...htmlImages,
      ...ranked.map(x => rawAsset(x.path))
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    games.push({
      ...meta,
      name,
      url: path,
      image: candidates[0] || '',
      imageCandidates: candidates,
      imageSource: explicit ? 'catalog' : localHtml.length ? 'game-html' : ranked.length ? 'folder-scan' : 'none',
      assetCount: allImages.length,
      icon: meta.icon || '🎮'
    });
  }

  const seen = new Set();
  return games.filter(g => { if (seen.has(g.url)) return false; seen.add(g.url); return true; });
}

function render(games) {
  const grid = document.querySelector('.game-grid');
  if (!grid) return;
  if (!games.length) { grid.innerHTML = '<p class="tm-muted">No se encontraron juegos.</p>'; return; }

  grid.innerHTML = games.map((g, i) => {
    const candidates = JSON.stringify(g.imageCandidates || [g.image || '']).replace(/</g, '\\u003c');
    return `<article class="game-card tm-live-game-card">
      <div class="game-image">
        <div class="game-image-stage" data-candidates='${esc(candidates)}'>
          <img class="game-cover" src="${esc(g.image || '')}" alt="${esc(g.name)}" loading="lazy" decoding="async">
          <span class="game-art-fallback">${esc(g.icon || '🎮')}</span>
        </div>
        <span class="game-badge">${esc(g.category || 'Juego')}</span>
      </div>
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

  grid.querySelectorAll('.game-image-stage').forEach(stage => {
    let candidates = [];
    try { candidates = JSON.parse(stage.dataset.candidates || '[]'); } catch {}
    const img = stage.querySelector('.game-cover');
    const fallback = stage.querySelector('.game-art-fallback');
    let pos = 0;
    const tryNext = () => {
      if (!img || pos >= candidates.length) {
        if (img) img.hidden = true;
        if (fallback) fallback.hidden = false;
        return;
      }
      const next = candidates[pos++];
      if (!next) return tryNext();
      img.hidden = false;
      if (fallback) fallback.hidden = true;
      img.src = next;
    };
    if (img) {
      img.addEventListener('error', tryNext);
      img.addEventListener('load', () => { img.hidden = false; if (fallback) fallback.hidden = true; }, { once: true });
      if (!img.src || img.src.endsWith('/')) tryNext();
    }
  });

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
    .tm-live-game-card .game-image {
      position: relative;
      height: 210px;
      min-height: 210px;
      background: var(--tm-surface-2);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tm-live-game-card .game-image-stage {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 10px;
    }
    .tm-live-game-card .game-cover {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: center center;
    }
    .tm-live-game-card .game-art-fallback {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      font-size: 4rem;
    }
    .tm-live-game-card .game-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 3;
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
