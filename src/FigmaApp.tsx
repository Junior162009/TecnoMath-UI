import { useMemo, useState } from 'react';
import originalGames from './data/mindmatharcade-games.json';

type Page = 'home' | 'games' | 'rankings' | 'tournaments' | 'community' | 'progress' | 'profile';
type Game = { id:number; title:string; desc:string; cat:string; diff:string; xp:number; icon:string; img?:string; url:string; status:string; plays:number; rating:number; prog:number; authorName:string; sourceType:string };

const GAMES: Game[] = originalGames.map((g, i) => ({
  id:i+1, title:g.name, desc:g.desc, cat:g.category === 'mates' ? 'Matemáticas' : 'Arcade',
  diff:g.category === 'mates' ? 'Medio' : 'Fácil', xp:g.category === 'mates' ? 150 : 100,
  icon:g.icon || '∑', img:g.imageUrl, url:g.url, status:'available', plays:0, rating:4.8, prog:0,
  authorName:g.authorName || 'TecnoMath', sourceType:g.sourceType || 'upload'
}));

const ME = { name:'TechMath_Carlos', level:23, xp:45200, xpCap:50000, coins:3450, rank:47, streak:7, gamesPlayed:142, wins:97, hours:48, friends:38, init:'CM' };
const PLAYERS = [
  ['AK','MathKing_Alex','🇧🇷',52,145230],['PS','ProCalc_Sofia','🇦🇷',49,138750],['NM','NumeroUno_Max','🇲🇽',48,132100],
  ['AL','AlgebraLord','🇨🇴',45,121400],['MZ','MathWizard_Zoe','🇨🇱',44,118200],['CQ','CalcQueen_Mia','🇵🇪',42,109800],
  ['NN','NumberNinja','🇻🇪',41,104300],['PM','PrimeMaster','🇪🇨',39,98700],['CM','TechMath_Carlos','🇨🇴',23,45200]
];
const ACHIEVEMENTS = [['⚡','Primera Victoria','Gana tu primer juego',50,true],['🔥','Racha de Fuego','7 días consecutivos',200,true],['🎯','Precisión Total','100% en nivel difícil',300,true],['🚀','Despegue','Alcanza el nivel 20',500,true],['🏆','Campeón','Gana un torneo oficial',1000,false],['💎','Diamante','Alcanza el nivel 50',2000,false],['👑','Leyenda','Entra al Top 10 global',5000,false],['🌟','Maestro','Completa todos los juegos',10000,false]];
const POSTS = [
  ['AK','MathKing_Alex','hace 12 min','¡Acabo de completar Algebra Blitz en modo Imposible! Tiempo récord: 47 segundos. ¿Alguien puede superarme?',124,38],
  ['PS','ProCalc_Sofia','hace 35 min','Consejo para el torneo de geometría: practiquen Grid Geometry en modo contrarreloj. Ahora soy Top 2 global.',89,21],
  ['CM','TechMath_Carlos','hace 1h','¡Logré la Racha de Fuego! 7 días de práctica consecutiva. La constancia marca la diferencia.',45,12],
  ['CQ','CalcQueen_Mia','hace 2h','Logic Gates es el juego más adictivo de la plataforma. Combina lógica proposicional con puzzles.',203,67]
];

const nav: [Page,string,string][] = [['home','⌂','Inicio'],['games','🎮','Juegos'],['rankings','📊','Ranking'],['tournaments','🏆','Torneos'],['community','🌐','Comunidad'],['progress','📈','Mi progreso'],['profile','👤','Perfil']];
const fmt = (n:number) => n >= 1000 ? `${(n/1000).toFixed(n>=10000?1:2)}K` : `${n}`;

function Avatar({init=ME.init,size=34}:{init?:string;size?:number}) { return <span className="av" style={{width:size,height:size,fontSize:Math.max(10,size/2.8)}}>{init}</span>; }
function XPBar({value,max=100}:{value:number;max?:number}) { return <div className="pb"><div style={{width:`${Math.min(100,value/max*100)}%`}}/></div>; }
function openGame(url:string) { if(url) window.location.href = `https://tecnomath.online/${url}`; }

function Sidebar({page,setPage,open}:{page:Page;setPage:(p:Page)=>void;open:boolean}) {
  return <aside className={`sidebar ${open?'mobile-open':''}`}>
    <div className="brand" onClick={()=>setPage('home')}><div className="brand-mark">∑</div><div><div className="brand-name">Tecno<span>Math</span></div><div className="brand-sub">PLATAFORMA EDUCATIVA</div></div></div>
    <div className="side-section">NAVEGACIÓN</div>
    {nav.map(([id,icon,label])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>setPage(id)}><span className="icon">{icon}</span><span>{label}</span>{id==='community'&&<span className="nav-dot"/>}</button>)}
    <div className="sidebar-spacer"/>
    <div className="mini-profile" onClick={()=>setPage('profile')}><Avatar/><div><strong>{ME.name}</strong><span>Nivel {ME.level} · {fmt(ME.xp)} XP</span></div></div>
  </aside>;
}

function TopBar({dark,setDark,onMenu}:{dark:boolean;setDark:(v:boolean)=>void;onMenu:()=>void}) {
  return <header className="topbar"><button className="mobile-menu btn btn-ghost btn-xs" onClick={onMenu}>☰</button><div className="top-search">⌕<input placeholder="Buscar juegos, jugadores, torneos..."/></div><div className="top-actions"><span className="top-xp">⚡ {fmt(ME.xp)}</span><span className="top-coins">◈ {fmt(ME.coins)}</span><button className="btn btn-ghost btn-xs" onClick={()=>setDark(!dark)}>{dark?'☀':'◐'}</button><Avatar/></div></header>;
}

function GameCard({g}:{g:Game}) {
  return <article className="card card-lift gc" style={{overflow:'hidden'}}>
    <div className="gc-img">{g.img ? <img src={g.img} alt={g.title}/> : <div className="math-art">{g.icon}</div>}<span className="chip chip-e" style={{position:'absolute',top:10,left:10}}>Disponible</span><span className="chip chip-v" style={{position:'absolute',top:10,right:10}}>⚡ {g.xp} XP</span></div>
    <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:9,minHeight:205}}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><span className="oxan" style={{fontWeight:700,fontSize:15.5}}>{g.title}</span><span className="chip chip-v" style={{fontSize:10}}>{g.cat}</span></div><p style={{fontSize:13,color:'var(--text2)',lineHeight:1.55,margin:0,flex:1}}>{g.desc}</p><div style={{display:'flex',justifyContent:'space-between'}}><span className="chip chip-m" style={{fontSize:9}}>{g.diff}</span><span className="mono" style={{fontSize:11,color:'var(--text3)'}}>★ {g.rating} · {fmt(g.plays)}</span></div><button className="btn btn-primary" style={{width:'100%'}} onClick={()=>openGame(g.url)}><span>▶</span> Jugar ahora</button></div>
  </article>;
}

function Home({setPage}:{setPage:(p:Page)=>void}) {
  return <><section className="hero"><div className="hero-orb-l"/><div className="hero-orb-r"/><div className="hero-inner"><div className="hero-kicker">BIENVENIDO DE VUELTA, <b>{ME.name.toUpperCase()}</b></div><h1>Domina las matemáticas.<br/><span>Compite. Aprende. Gana.</span></h1><p>Tu plataforma de juegos matemáticos competitivos. Sube de nivel, conquista torneos y demuestra que eres el mejor.</p><div className="hero-actions"><button className="btn-primary" onClick={()=>setPage('games')}>▶ JUGAR AHORA</button><button className="btn-ghost" onClick={()=>setPage('progress')}>📈 VER PROGRESO</button></div></div></section>
    <div className="stat-grid">{[['NIVEL ACTUAL',`${ME.level}`,'+2 esta semana'],['XP TOTAL',fmt(ME.xp),'4,800 para nivel 24'],['RANKING GLOBAL',`#${ME.rank}`,'↑ 6 posiciones'],['RACHA ACTUAL',`${ME.streak} días`,'¡Sigue así! 🔥']].map(x=><div className="stat-card" key={x[0]}><div className="stat-icon">⚡</div><div><div className="stat-label">{x[0]}</div><div className="stat-value">{x[1]}</div><div className="stat-sub">{x[2]}</div></div></div>)}</div>
    <div className="sh"><span>🔥 Juegos destacados</span><button className="see-all" onClick={()=>setPage('games')}>Ver todos →</button></div><div className="game-grid">{GAMES.slice(0,4).map(g=><GameCard key={g.id} g={g}/>)}</div>
    <div className="two-col-home" style={{marginTop:16}}><div className="card tournament-mini"><div className="tour-glow"/><div className="chip chip-e">● EN VIVO</div><h3>Grand Prix de Álgebra</h3><p>2,847 jugadores · Premio: 5,000 XP</p><button className="btn btn-primary btn-xs" onClick={()=>setPage('tournaments')}>Ver torneo →</button></div><div className="card rank-mini"><div className="side-card-title">🏆 Top global <span onClick={()=>setPage('rankings')}>Ver ranking</span></div>{PLAYERS.slice(0,4).map((p,i)=><div className="rank-row" key={p[1]}><b>{i+1}</b><Avatar init={p[0] as string} size={27}/><span><strong>{p[1]}</strong><small>Lv.{p[3]}</small></span><em>{fmt(p[4] as number)} XP</em></div>)}</div></div>
  </>;
}

function GamesPage() { const [q,setQ]=useState(''); const [cat,setCat]=useState('Todos'); const filtered=useMemo(()=>GAMES.filter(g=>(g.title.toLowerCase().includes(q.toLowerCase())||g.desc.toLowerCase().includes(q.toLowerCase()))&&(cat==='Todos'||g.cat===cat)),[q,cat]); return <><div className="page-head"><h1>🎮 Biblioteca de juegos</h1><p>Los juegos reales de MindMathArcade, integrados en la nueva interfaz de TecnoMath.</p></div><div style={{display:'flex',gap:10,marginBottom:18}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar juego..." style={{flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 13px',color:'var(--text)',outline:0}}/><div className="filters" style={{margin:0}}>{['Todos','Matemáticas','Arcade'].map(c=><button key={c} className={`filter-btn ${cat===c?'sel':''}`} onClick={()=>setCat(c)}>{c}</button>)}</div></div><div className="game-grid">{filtered.map(g=><GameCard key={g.id} g={g}/>)}</div></>; }

function Rankings() { return <><div className="page-head"><h1>📊 Ranking global</h1><p>Los mejores jugadores de TecnoMath.</p></div><div className="podium">{[1,0,2].map(i=><div className="podium-col" key={i}><Avatar init={PLAYERS[i][0] as string} size={i===0?58:48}/><b>{PLAYERS[i][1]}</b><span>{fmt(PLAYERS[i][4] as number)} XP</span><div className="pbar" style={{height:i===0?190:i===1?145:125}}><span>#{i+1}</span></div></div>)}</div><div className="card leaderboard">{PLAYERS.map((p,i)=><div className="leader-row" key={p[1]}><b>#{i+1}</b><div className="leader-player"><Avatar init={p[0] as string}/><span><strong>{p[1]} {p[2]}</strong><small>Nivel {p[3]}</small></span></div><span className="mono">{fmt(p[4] as number)} XP</span><span>{i<3?'🏆':'⭐'}</span></div>)}</div></>; }

function Tournaments({setPage}:{setPage:(p:Page)=>void}) { const tours=[['Grand Prix de Álgebra','EN VIVO','2,847','5,000 XP','Álgebra'],['Olimpiada de Geometría','PRÓXIMO','542','8,000 XP','Geometría'],['Copa Cálculo Infinito','PRÓXIMO','128','15,000 XP','Cálculo'],['Torneo Aritmética Veloz','FINALIZADO','4,200','3,000 XP','Aritmética']]; return <><div className="page-head"><h1>🏆 Torneos</h1><p>Compite, gana XP y demuestra tu nivel.</p></div><div className="tour-grid">{tours.map((t,i)=><div className={`card tour-card ${i===3?'ended':''}`} key={t[0]}><div className="tour-img"><div className="math-art">{['Σ','◇','∫','×'][i]}</div><span className="tour-status">● {t[1]}</span></div><div className="tour-body"><span className="tour-cat">{t[4]}</span><h2>{t[0]}</h2><p>👥 {t[2]} participantes</p><div className="tour-prizes"><span>⚡ {t[3]}</span><span>◈ {i===0?'2,500':i===1?'4,000':i===2?'7,500':'1,500'} monedas</span></div><button className="btn btn-primary full">{i===0?'Participar ahora':i===3?'Ver resultados':'Ver torneo'}</button></div></div>)}</div></>; }

function Community() { const [posts,setPosts]=useState(POSTS); return <><div className="page-head"><h1>🌐 Comunidad</h1><p>Comparte logros, consejos y desafíos con otros jugadores.</p></div><div className="community-layout"><div><div className="card compose"><Avatar/><button onClick={()=>setPosts([['CM','TechMath_Carlos','ahora','¡Nuevo reto para la comunidad! ¿Quién se apunta?',0,0],...posts])}>Comparte algo con la comunidad...</button></div><div className="feed">{posts.map((p,i)=><article className="post" key={i}><div className="post-head"><Avatar init={p[0] as string}/><div><strong>{p[1]}</strong><span>Nivel {i===2?23:49} · {p[2]}</span></div></div><p className="post-text">{p[3]}</p><div className="post-actions">♥ {p[4]} &nbsp;&nbsp; 💬 {p[5]} &nbsp;&nbsp; ↗ Compartir</div></article>)}</div></div><aside className="card community-side"><div className="side-card-title">🟢 Jugadores online <span>127</span></div>{PLAYERS.slice(1,6).map(p=><div className="online-row" key={p[1]}><div className="odot"/><Avatar init={p[0] as string} size={27}/><div><b>{p[1]}</b><small>Jugando ahora</small></div></div>)}</aside></div></>; }

function Progress() { return <><div className="page-head"><h1>📈 Mi progreso</h1><p>Tu evolución matemática en TecnoMath.</p></div><div className="card progress-hero"><div className="level-ring"><div><strong>23</strong><span>NIVEL</span></div></div><div style={{flex:1}}><div className="stat-label">PROGRESO AL SIGUIENTE NIVEL</div><h2 className="oxan" style={{fontSize:28,margin:'5px 0'}}>45,200 / 50,000 XP</h2><XPBar value={ME.xp} max={ME.xpCap}/><p style={{color:'var(--text3)',fontSize:11,marginTop:8}}>4,800 XP restantes · ¡Vas excelente!</p></div></div><div className="progress-grid"><div className="card" style={{padding:20}}><div className="side-card-title">🏅 Estadísticas</div>{[['Partidas jugadas',ME.gamesPlayed],['Victorias',ME.wins],['Horas de juego',ME.hours],['Amigos',ME.friends]].map(x=><div className="rank-row" key={x[0]}><span><strong>{x[0]}</strong></span><em>{x[1]}</em></div>)}</div><div className="card" style={{padding:20}}><div className="side-card-title">🎖️ Logros</div><div className="ach-grid">{ACHIEVEMENTS.map(a=><div className={`ach-card ${a[4]?'':'locked'}`} key={a[1]}><div className="ach-icon">{a[0]}</div><b>{a[1]}</b><span>{a[2]}</span><small>+{a[3]} XP</small></div>)}</div></div></div></>; }

function Profile() { return <><div className="page-head"><h1>👤 Perfil</h1><p>Tu identidad y estadísticas en TecnoMath.</p></div><div className="card" style={{padding:24,display:'flex',gap:18,alignItems:'center'}}><Avatar size={78}/><div style={{flex:1}}><h2 className="oxan" style={{fontSize:25}}>TechMath_Carlos</h2><p style={{color:'var(--text3)',margin:'4px 0'}}>Nivel 23 · Miembro desde Enero 2024</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span className="chip chip-v">🇨🇴 Colombia</span><span className="chip chip-e">🔥 {ME.streak} días de racha</span><span className="chip chip-g">#47 global</span></div></div><button className="btn btn-primary">Editar perfil</button></div><div className="stat-grid" style={{marginTop:16}}>{[['XP TOTAL',fmt(ME.xp)],['MONEDAS',fmt(ME.coins)],['VICTORIAS',ME.wins],['AMIGOS',ME.friends]].map(x=><div className="stat-card" key={x[0]}><div><div className="stat-label">{x[0]}</div><div className="stat-value">{x[1]}</div></div></div>)}</div></>; }

export default function FigmaApp() {
  const [page,setPage]=useState<Page>('home'); const [dark,setDark]=useState(true); const [side,setSide]=useState(false);
  const go=(p:Page)=>{setPage(p);setSide(false);window.scrollTo({top:0,behavior:'smooth'});};
  const content={home:<Home setPage={go}/>,games:<GamesPage/>,rankings:<Rankings/>,tournaments:<Tournaments setPage={go}/>,community:<Community/>,progress:<Progress/>,profile:<Profile/>}[page];
  document.documentElement.className=dark?'':'light';
  return <div className="app-shell"><Sidebar page={page} setPage={go} open={side}/><div className="main-area"><TopBar dark={dark} setDark={setDark} onMenu={()=>setSide(!side)}/><div className="content">{content}</div></div></div>;
}
