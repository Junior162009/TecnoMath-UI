(() => {
  'use strict';
  const THEME_KEY='tecnomath:theme'; const root=document.documentElement;
  const GAME_BASE='https://tecnomath.online/';
  const GAME_ROUTES={
    'Math Battle': 'games/jinete11°/index.html',
    'Reino Pixelado': 'games/jolberth11°/index.html',
    'BanderQuiz': 'games/laura10°/index.html',
    'Atrapa el Número': 'games/atrapa-el-n-mero--P053Fq81cfDss2EU5hY/index.html',
    'Cookie Clicker': 'games/cookie-clicker/index.html'
  };
  const saved=()=>{try{const v=localStorage.getItem(THEME_KEY);return v==='dark'||v==='light'?v:null}catch{return null}};
  const system=()=>matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  function applyTheme(theme,persist=true){const value=theme==='dark'?'dark':'light';root.dataset.theme=value;root.style.colorScheme=value;if(document.body)document.body.classList.toggle('tm-dark',value==='dark');if(persist)try{localStorage.setItem(THEME_KEY,value)}catch{}document.querySelectorAll('[data-tm-theme-toggle]').forEach(b=>{const dark=value==='dark';b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Cambiar a modo claro':'Cambiar a modo oscuro');b.title=dark?'Cambiar a modo claro':'Cambiar a modo oscuro';b.textContent=dark?'☀️ Claro':'🌙 Oscuro'})}
  applyTheme(saved()||system(),false);
  function initTheme(){document.querySelectorAll('[data-tm-theme-toggle]').forEach(b=>{if(b.dataset.tmThemeReady)return;b.dataset.tmThemeReady='true';b.addEventListener('click',()=>applyTheme(root.dataset.theme==='dark'?'light':'dark',true))});const media=matchMedia('(prefers-color-scheme: dark)');media.addEventListener?.('change',e=>{if(!saved())applyTheme(e.matches?'dark':'light',false)});applyTheme(root.dataset.theme,false)}
  function toast(message,type='info',duration=3200){let c=document.querySelector('.tm-toast-container');if(!c){c=document.createElement('div');c.className='tm-toast-container';c.setAttribute('aria-live','polite');document.body.appendChild(c)}const i=document.createElement('div');i.className=`tm-toast tm-alert-${type}`;i.setAttribute('role','status');i.textContent=message;c.appendChild(i);setTimeout(()=>i.remove(),duration)}
  function initGameLinks(){
    document.querySelectorAll('.game-card').forEach(card=>{
      const title=card.querySelector('.game-info h3')?.textContent?.trim();
      const route=GAME_ROUTES[title];
      if(!route)return;
      const button=card.querySelector('.game-meta button');
      if(!button||button.dataset.tmGameReady)return;
      button.dataset.tmGameReady='true';
      button.type='button';
      button.addEventListener('click',()=>{window.location.href=GAME_BASE+route});
      button.removeAttribute('onclick');
    });
    document.querySelectorAll('[data-tm-game]').forEach(button=>{
      const key=button.dataset.tmGame?.trim();
      const route=GAME_ROUTES[key];
      if(!route||button.dataset.tmGameReady)return;
      button.dataset.tmGameReady='true';
      button.addEventListener('click',()=>{window.location.href=GAME_BASE+route});
    });
  }
  function initModals(){document.querySelectorAll('[data-tm-modal-open]').forEach(t=>t.addEventListener('click',()=>document.getElementById(t.dataset.tmModalOpen)?.classList.add('is-open')));document.querySelectorAll('[data-tm-modal-close]').forEach(t=>t.addEventListener('click',()=>t.closest('.tm-modal')?.classList.remove('is-open')));document.querySelectorAll('.tm-modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('is-open')}))}
  function initDropdowns(){document.querySelectorAll('[data-tm-dropdown-toggle]').forEach(t=>t.addEventListener('click',e=>{e.stopPropagation();const d=t.closest('.tm-dropdown');document.querySelectorAll('.tm-dropdown.is-open').forEach(x=>{if(x!==d)x.classList.remove('is-open')});d?.classList.toggle('is-open')}));document.addEventListener('click',()=>document.querySelectorAll('.tm-dropdown.is-open').forEach(x=>x.classList.remove('is-open')))}
  function initTabs(){document.querySelectorAll('[data-tm-tabs]').forEach(t=>{const b=t.querySelectorAll('[data-tm-tab]'),p=t.querySelectorAll('[data-tm-panel]');b.forEach(x=>x.addEventListener('click',()=>{b.forEach(y=>y.classList.toggle('is-active',y===x));p.forEach(y=>y.hidden=y.dataset.tmPanel!==x.dataset.tmTab)}))})}
  function initProgress(){document.querySelectorAll('[data-tm-progress]').forEach(b=>{const v=Math.max(0,Math.min(100,Number(b.dataset.tmProgress)||0));b.style.width=`${v}%`;b.setAttribute('aria-valuenow',String(v))})}
  function initSidebar(){document.querySelectorAll('[data-tm-sidebar-toggle]').forEach(b=>b.addEventListener('click',()=>{const t=document.getElementById(b.dataset.tmSidebarToggle);t?.classList.toggle('is-open');b.setAttribute('aria-expanded',String(t?.classList.contains('is-open')))}))}
  window.TecnoMathUI={applyTheme,toast,initModals,initDropdowns,initTabs,initProgress,initSidebar,initGameLinks};
  document.addEventListener('DOMContentLoaded',()=>{initTheme();initModals();initDropdowns();initTabs();initProgress();initSidebar();initGameLinks()});
})();
