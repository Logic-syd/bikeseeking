import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bike, Check, CheckCheck, ChevronRight, CircleHelp, Flower2, Grid2X2, Heart, Leaf, Lightbulb, RotateCcw, Settings2, ShieldCheck, Sparkles, TrainFront, Undo2, Volume2, X } from 'lucide-react';
import { levels } from './game/levels';
import { isSolved, stepMove } from './game/engine';
import type { Direction, Move } from './game/types';
import type { solve } from './game/solver';
import { copy, format } from './i18n';
import { moveSession, newSession, readSaved, undoSession, writeSaved, type Session } from './session';
import { bell, unlockAudio } from './audio';
import Board, { type Ghost } from './components/Board';
import { BikeArt, BikeLogo, StationScene } from './components/Artwork';
type Screen = 'home' | 'levels' | 'game' | 'complete';
function Modal({children, title, onClose, closeLabel}: {children: ReactNode; title: string; onClose: () => void; closeLabel: string}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current!; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={e => {e.preventDefault();onClose();}} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="dialog-title">
    <div className="modal-inner"><div className="modal-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label={closeLabel}><X size={22}/></button></div>{children}</div>
  </dialog>;
}
export default function App() {
  const [saved] = useState(() => readSaved(levels));
  const [settings, setSettings] = useState(saved.settings);
  const [best, setBest] = useState(saved.best);
  const [session, setSession] = useState<Session>(saved.session ?? newSession(levels[0]));
  const current = useRef(session);
  const [hasSession, setHasSession] = useState(!!saved.session);
  const [screen, setScreen] = useState<Screen>('home');
  const [dialog, setDialog] = useState<'settings'|'restart'|null>(null);
  const [selected, setSelected] = useState<number|null>(null);
  const [locked, setLocked] = useState(false);
  const lock = useRef(false);
  const [ghost, setGhost] = useState<Ghost|null>(null);
  const [hint, setHint] = useState<Move|null>(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const worker = useRef<Worker|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const t = copy[settings.language];
  const level = levels.find(l => l.id === session.levelId)!;
  const completed = Object.keys(best).length;
  const remaining = session.positions.filter(p => p >= 0).length;
  function cancelSearch() { worker.current?.terminate(); worker.current = null; setSearching(false); setHint(null); }
  function clearAnimation() { if (timer.current) clearTimeout(timer.current); timer.current=null; lock.current=false; setLocked(false); setGhost(null); }
  function update(next: Session) { current.current=next; setSession(next); setHasSession(true); }
  function navigate(next: Screen) { cancelSearch(); clearAnimation(); setMessage(''); setSelected(null); setScreen(next); }
  function start(id: number) { cancelSearch(); clearAnimation(); update(newSession(levels.find(l => l.id === id)!)); setSelected(null); setMessage(''); setScreen('game'); }
  function resume() { navigate(isSolved(current.current.positions) ? 'complete' : 'game'); setHasSession(true); }
  useEffect(() => { document.documentElement.lang = settings.language; document.title = 'Rad Raus! — Bike Jam'; }, [settings.language]);
  useEffect(() => { setSaveFailed(!writeSaved({settings,best,session:hasSession?session:null})); }, [settings,best,session,hasSession]);
  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [screen,session.levelId]);
  useEffect(() => () => { worker.current?.terminate(); if(timer.current) clearTimeout(timer.current); }, []);
  function commit(move: Move) {
    if(lock.current || screen !== 'game' || dialog) return;
    const before = current.current;
    const next = moveSession(level,before,move);
    if(next === before) { setMessage(t.blocked); return; }
    cancelSearch(); setMessage('');
    if(settings.sound) unlockAudio();
    update(next);
    const exiting = move.to === -1;
    if(exiting) { setSelected(null); if(settings.sound) bell(); }
    const won = isSolved(next.positions);
    if(won) setBest(scores => ({...scores,[level.id]:Math.min(scores[level.id] ?? Infinity,next.moves)}));
    if(settings.reducedMotion) { if(won) setScreen('complete'); return; }
    lock.current=true; setLocked(true);
    if(exiting) setGhost({move,positions:before.positions});
    timer.current=setTimeout(() => { lock.current=false; setLocked(false); setGhost(null); timer.current=null; if(won) setScreen('complete'); }, exiting?360:150);
  }
  function step(direction: Direction, bike = selected ?? -1) {
    if(bike < 0 || lock.current || dialog || current.current.positions[bike] < 0) return;
    const move = stepMove(level, current.current.positions, bike, direction);
    if (move) commit(move); else setMessage(t.blocked);
  }
  function undo() {
    if(lock.current) return;
    cancelSearch(); setMessage(''); setSelected(null); update(undoSession(current.current));
  }
  function askHint() {
    if(lock.current || searching) return;
    cancelSearch(); setMessage('');
    if(isSolved(current.current.positions)) { setMessage(t.solvedHint); return; }
    setSearching(true);
    const snapshot = current.current;
    const w = new Worker(new URL('./solver.worker.ts', import.meta.url), {type:'module'});
    worker.current=w;
    w.onmessage = (event: MessageEvent<ReturnType<typeof solve>>) => {
      if(worker.current !== w || current.current !== snapshot) return;
      w.terminate(); worker.current=null; setSearching(false);
      const result = event.data;
      if(result.status === 'solved' && result.moves.length) {
        const move = result.moves[0]; setHint(move); setSelected(move.bike);
        const bike = level.bikes[move.bike];
        const negative = move.exit === -1 || move.to >= 0 && move.to < snapshot.positions[move.bike];
        const side = bike.axis === 'h' ? negative?'left':'right' : negative?'top':'bottom';
        setMessage(format(move.to === -1 ? t.hintExit : t.hintMove,{bike:bike.id,direction:t[side],count:Math.abs(move.to-snapshot.positions[move.bike])}));
      } else setMessage(result.status === 'unsolvable' ? t.unsolvable : t.limit);
    };
    w.onerror = () => { if(worker.current === w) {w.terminate();worker.current=null;setSearching(false);setMessage(t.limit);} };
    w.postMessage({level,positions:[...snapshot.positions]});
  }
  const activeBike = selected !== null ? level.bikes[selected] : null;
  const ArrowNegative = activeBike?.axis === 'v' ? ArrowUp : ArrowLeft;
  const ArrowPositive = activeBike?.axis === 'v' ? ArrowDown : ArrowRight;
  const controlsDisabled = selected === null || locked || remaining === 0;
  return <div className={`app ${settings.reducedMotion?'reduce-motion':''}`}>
    <header className="site-header">
      <button className="brand" aria-label="Rad Raus! · Home" onClick={() => navigate('home')}><span className="brand-icon"><BikeLogo/></span><span>rad raus<span className="brand-punctuation">!</span><small>BIKE JAM</small></span></button>
      <div className="header-right"><span className="location"><span className="live-dot"/>{t.station}</span><button className="language-short" onClick={() => {cancelSearch();setMessage('');setSettings({...settings,language:settings.language==='de'?'en':'de'});}} aria-label={settings.language === 'en' ? 'Switch to German' : 'Auf Englisch wechseln'}>{settings.language.toUpperCase()}</button><button className="icon-button" data-testid="open-settings" aria-label={t.settings} onClick={() => {cancelSearch();setDialog('settings');}}><Settings2 size={21}/></button></div>
    </header>
    <main>
      {screen === 'home' && <div className="home-screen">
        <section className="hero"><div className="hero-copy"><span className="eyebrow"><Flower2 size={16}/>{t.tagline}</span><h1>{t.homeTitle.split('\n').map((line,i)=><span key={i}>{i===1?line.replace(/\.$/,''):line}{i===1&&<span className="pink-period">.</span>}</span>)}</h1><p className="hero-description">{t.homeDescription}</p><div className="hero-actions"><button className="primary-button" data-testid="start-game" onClick={resume}>{hasSession?t.continue:t.play}<ArrowRight size={21}/></button><button className="text-button" data-testid="level-select" onClick={() => navigate('levels')}>{t.choose}<Grid2X2 size={17}/></button></div><p className="quiet-note"><Leaf size={15}/>{t.noRush}</p></div>
        <div className="hero-art"><div className="hero-art-circle"/><div className="illustration-label"><span className="live-dot"/> GRÜSS DICH!</div><StationScene className="station-scene"/><div className="scene-caption"><span>48° N / 11° E</span><span>ROSENVIERTEL, MÜNCHEN</span><Heart size={14}/></div></div></section>
        <div className="home-divider"><span>{t.homeNote}</span><div/><span>01 — 15</span></div>
        <section className="feature-row"><article><div className="feature-icon pink"><Bike size={25}/></div><div><span className="feature-number">01</span><h3>{t.how2}</h3><p>{settings.language === 'de' ? 'Vor, zurück. Ganz einfach.' : 'Forward, backward. Simple as that.'}</p></div></article><article><div className="feature-icon mint"><ArrowRight size={25}/></div><div><span className="feature-number">02</span><h3>{t.how3}</h3><p>{settings.language === 'de' ? 'Jedes Rad findet seinen Weg.' : 'A way out for every bicycle.'}</p></div></article><article><div className="feature-icon yellow"><Lightbulb size={25}/></div><div><span className="feature-number">03</span><h3>{t.noRush.split('.')[0]}</h3><p>{settings.language === 'de' ? 'Ein Tipp ist immer in der Nähe.' : 'A little hint is always nearby.'}</p></div></article></section>
      </div>}
      {screen === 'levels' && <section className="levels-screen page-enter"><button className="back-link" onClick={() => navigate('home')}><ArrowLeft size={17}/>{t.home}</button><div className="page-heading"><div><span className="eyebrow">ROSENVIERTEL · 01—15</span><h1>{t.levels}</h1><p>{t.levelsIntro}</p></div><div className="progress-badge"><CheckCheck size={22}/><strong>{completed}<span>/ {levels.length}</span></strong><small>{t.completed}</small></div></div><div className="level-grid">{levels.map(l => <button key={l.id} data-testid={`level-card-${l.id}`} className={`level-card ${best[l.id]?'finished':''} ${session.levelId===l.id?'current':''}`} onClick={() => start(l.id)}><div className="level-card-top"><span className="level-number">{String(l.id).padStart(2,'0')}</span>{best[l.id]?<Check size={20}/>:<ArrowRight size={18}/>}</div><h2>{l.title[settings.language]}</h2><span className={`difficulty ${l.difficulty}`}><i/><i/><i/>{t[l.difficulty]}</span><div className="level-card-footer">{best[l.id]?`${t.best}: ${best[l.id]} ${t.moves.toLowerCase()}`:`${l.bikes.length} ${settings.language==='de'?'Räder':'bikes'}`}<span>{l.bikes.some(b=>b.length===3)?<Bike size={15}/>:<Leaf size={15}/>}</span></div></button>)}</div><p className="bottom-note"><ShieldCheck size={16}/>{t.saved}</p></section>}
      {screen === 'game' && <section className="game-screen page-enter">
        <button className="back-link" data-testid="level-select" onClick={() => navigate('levels')}><ArrowLeft size={17}/>{t.levels}</button>
        <div className="game-heading"><div className="game-title"><span className="level-stamp">{String(level.id).padStart(2,'0')}</span><div><div className="eyebrow">{t.level} {level.id} {t.of} {levels.length}<span className="heading-separator">/</span>{t[level.difficulty]}</div><h1>{level.title[settings.language]}</h1></div></div><div className="game-stats"><div><strong data-testid="moves">{session.moves}</strong><span>{t.moves}</span></div><div><strong>{remaining}<span className="stat-denominator">/{level.bikes.length}</span></strong><span>{t.remaining}</span></div></div></div>
        <div className="play-layout"><div className="play-main"><div className="board-card"><div className="station-strip"><span><TrainFront size={15}/> ROSENVIERTEL</span><span className="parking-sign">P <Bike size={14}/></span><span className="bakery-mini">BACKSTUBE <Heart size={12}/></span></div><Board level={level} positions={session.positions} selected={selected} onSelect={i=>setSelected(i)} onMove={commit} onStep={step} locked={locked||!!dialog} reduced={settings.reducedMotion} hint={hint} ghost={ghost} t={t} onBlocked={()=>setMessage(t.blocked)}/><div className="board-caption"><span className="live-dot"/>{t.bikePark}<span className="board-caption-line"/><span>R / {String(level.id).padStart(2,'0')}</span></div></div>
          <div className="game-toolbar"><button data-testid="undo" disabled={!session.history.length||locked} onClick={undo}><Undo2 size={20}/>{t.undo}</button><button data-testid="restart" disabled={locked} onClick={()=>setDialog('restart')}><RotateCcw size={19}/>{t.restart}</button><button data-testid="hint" disabled={locked||searching} onClick={askHint} className={searching?'searching':''}><Lightbulb size={20}/>{searching?t.thinking:t.hint}</button></div></div>
          <aside className="play-sidebar"><div className="instruction-card"><div className="section-label"><Sparkles size={17}/>{t.how}</div><h2>{level.subtitle[settings.language]}</h2><p>{level.tutorial?t[`tutorial${level.tutorial}`]:t.instructions}</p><div className="instruction-divider"/><div className="legend"><span className="exit-sample"><ArrowRight size={14}/></span><span>{t.exit}</span><span className="fence-sample"/><span>{settings.language==='de'?'Zaun':'Fence'}</span></div></div>
          <div className="control-card"><div className="control-label"><span className={`selection-dot ${activeBike?'active':''}`} style={{background:activeBike?.color}}/>{activeBike?`${activeBike.length===3?t.cargo:t.selected} ${activeBike.id}`:t.select}</div><div className="direction-controls"><button data-testid="move-negative" onClick={()=>step(-1)} disabled={controlsDisabled} aria-label={t.negative}><ArrowNegative size={25}/></button><span className="axis-line">{activeBike?<Bike size={22}/>:<span>↔</span>}</span><button data-testid="move-positive" onClick={()=>step(1)} disabled={controlsDisabled} aria-label={t.positive}><ArrowPositive size={25}/></button></div><p>{t.controls}</p></div>
          <div className={`hint-message ${message?'has-message':''}`} role="status" aria-live="polite" data-testid="hint-message">{message?<><Lightbulb size={18}/><p>{message}</p></>:<><CircleHelp size={16}/><p>{t.keyboard}</p></>}</div>
          <div className="sidebar-flower"><Flower2 size={34} strokeWidth={1.2}/><span>{t.noRush}</span></div></aside></div>
      </section>}
      {screen === 'complete' && <section className="complete-screen page-enter" data-testid="complete"><div className="completion-art"><span className="confetti one">✦</span><span className="confetti two">✦</span><span className="confetti three">✧</span><div className="completion-circle"><BikeArt color="#8abdab"/></div><div className="completion-check"><Check size={23}/></div></div><span className="eyebrow">{t.done} · {t.level} {level.id}</span><h1>{level.id===levels.length&&completed===levels.length?t.allClear:t.clearTitle}</h1><p>{level.id===levels.length&&completed===levels.length?t.allClearText:t.clearText}</p><div className="completion-stats"><div><strong>{session.moves}</strong><span>{t.moves}</span></div><div><strong>{best[level.id]??session.moves}</strong><span>{t.best}</span></div><div><strong>{completed}<small>/{levels.length}</small></strong><span>{t.completed}</span></div></div><div className="complete-actions">{level.id<levels.length?<button className="primary-button" data-testid="next-level" onClick={()=>start(level.id+1)}>{t.next}<ArrowRight size={20}/></button>:<button className="primary-button" onClick={()=>navigate('levels')}>{t.levels}<Grid2X2 size={20}/></button>}<button className="text-button" onClick={()=>start(level.id)}><RotateCcw size={17}/>{t.replay}</button><button className="text-button" data-testid="level-select" onClick={()=>navigate('levels')}>{t.choose}<ChevronRight size={17}/></button></div><div className="completion-scenery"><StationScene/></div></section>}
      {saveFailed&&<p className="save-error" role="status">{t.storageError}</p>}
    </main>
    <footer className="site-footer"><span><Flower2 size={15}/>{t.footnote}</span><span>{t.fictional}<Heart size={13}/></span></footer>
    {dialog==='settings'&&<Modal title={t.settings} closeLabel={t.close} onClose={()=>setDialog(null)}><p className="modal-subtitle">{t.settingsText}</p><div className="setting-row language-setting"><div><span className="setting-name">{t.language}</span></div><div className="language-options"><button aria-pressed={settings.language==='de'} onClick={()=>{setMessage('');setSettings({...settings,language:'de'});}}>Deutsch</button><button aria-pressed={settings.language==='en'} onClick={()=>{setMessage('');setSettings({...settings,language:'en'});}}>English</button></div></div><div className="setting-row"><div><span className="setting-name"><Volume2 size={17}/>{t.sound}</span><p>{t.soundText}</p></div><button role="switch" aria-checked={settings.sound} aria-label={t.sound} className="toggle" onClick={()=>{const sound=!settings.sound;setSettings({...settings,sound});if(sound)unlockAudio();}}><span/></button></div><div className="setting-row"><div><span className="setting-name"><Leaf size={17}/>{t.motion}</span><p>{t.motionText}</p></div><button role="switch" aria-checked={settings.reducedMotion} aria-label={t.motion} className="toggle" onClick={()=>setSettings({...settings,reducedMotion:!settings.reducedMotion})}><span/></button></div><p className="settings-save"><ShieldCheck size={17}/>{t.saved}</p></Modal>}
    {dialog==='restart'&&<Modal title={t.resetTitle} closeLabel={t.close} onClose={()=>setDialog(null)}><p className="modal-subtitle">{t.resetText}</p><div className="restart-actions"><button className="secondary-button" onClick={()=>setDialog(null)}>{t.cancel}</button><button className="primary-button" onClick={()=>{setDialog(null);start(level.id);}}>{t.confirm}<RotateCcw size={17}/></button></div></Modal>}
  </div>;
}
