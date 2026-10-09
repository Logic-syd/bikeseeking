import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { getRange } from '../game/engine';
import type { Level, Move, Side, Direction } from '../game/types';
import type { Copy } from '../i18n';
import { BikeArt, TreeArt, BollardArt } from './Artwork';
export interface Ghost { move: Move; positions: number[] }
interface Props {
  level: Level; positions: number[]; selected: number | null; onSelect: (bike: number) => void;
  onMove: (move: Move) => void; onStep: (direction: Direction, bike?: number) => void;
  locked: boolean; reduced: boolean; hint: Move | null; ghost: Ghost | null; t: Copy; onBlocked: () => void;
}
interface Drag { bike: number; pointer: number; origin: number; delta: number; cell: number; positions: number[] }
export function SideArrow({side, size = 18}: {side: Side; size?: number}) {
  const Icon = {left: ArrowLeft, right: ArrowRight, top: ArrowUp, bottom: ArrowDown}[side];
  return <Icon size={size} strokeWidth={2.3}/>;
}
export default function Board({level, positions, selected, onSelect, onMove, onStep, locked, reduced, hint, ghost, t, onBlocked}: Props) {
  const board = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const cancel = () => { dragRef.current = null; setDrag(null); };
  useEffect(() => { cancel(); }, [positions, level.id, locked]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const activeRange = selected !== null && positions[selected] >= 0 ? getRange(level, positions, selected) : null;
  const cellPercent = 100 / level.size;
  function styleFor(bike: number, position: number): CSSProperties {
    const b = level.bikes[bike];
    return { left: `${(b.axis === 'h' ? position : b.lane) * cellPercent}%`, top: `${(b.axis === 'v' ? position : b.lane) * cellPercent}%`, width: `${(b.axis === 'h' ? b.length : 1) * cellPercent}%`, height: `${(b.axis === 'v' ? b.length : 1) * cellPercent}%` };
  }
  function candidate(d: Drag): {move: Move; offset: number; blocked: boolean} {
    const b = level.bikes[d.bike], start = positions[d.bike];
    const range = getRange(level, positions, d.bike);
    const raw = start + d.delta / d.cell;
    if (range.exitNegative && raw < -0.5) return {move: {bike: d.bike, to: -1, exit: -1}, offset: Math.max(-b.length, raw) - start, blocked: false};
    if (range.exitPositive && raw > level.size - b.length + 0.5) return {move: {bike: d.bike, to: -1, exit: 1}, offset: Math.min(level.size, raw) - start, blocked: false};
    return { move: {bike: d.bike, to: Math.max(range.min, Math.min(range.max, Math.round(raw)))}, offset: Math.max(range.min, Math.min(range.max, raw)) - start, blocked: raw < range.min - 0.22 && !range.exitNegative || raw > range.max + 0.22 && !range.exitPositive };
  }
  function begin(event: ReactPointerEvent<HTMLButtonElement>, bike: number) {
    if (locked || !event.isPrimary || event.button !== 0 || dragRef.current) return;
    event.preventDefault();
    event.currentTarget.focus({preventScroll: true}); onSelect(bike);
    const b = level.bikes[bike];
    const d: Drag = {bike, pointer: event.pointerId, origin: b.axis === 'h' ? event.clientX : event.clientY, delta: 0, cell: board.current!.getBoundingClientRect().width / level.size, positions};
    dragRef.current = d; setDrag(d); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function update(event: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointer !== event.pointerId || locked) return;
    const delta = (level.bikes[d.bike].axis === 'h' ? event.clientX : event.clientY) - d.origin;
    const next = {...d, delta}; dragRef.current = next; setDrag(next);
  }
  function finish(event: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || event.pointerId !== d.pointer) return;
    const delta = (level.bikes[d.bike].axis === 'h' ? event.clientX : event.clientY) - d.origin;
    const final = {...d, delta};
    cancel();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (locked || positions !== d.positions || Math.abs(delta) < 7) return;
    const result = candidate(final);
    if (result.blocked) onBlocked();
    if (result.move.to !== positions[d.bike]) onMove(result.move);
  }
  const preview = drag ? candidate(drag) : null;
  return <div className="board-frame">
    <div className="board-surface" ref={board} data-testid="board" role="group" aria-label={t.bikePark} aria-busy={locked} style={{'--size':level.size} as CSSProperties}>
      {Array.from({length: level.size * level.size}, (_, i) => <div key={i} className="grid-dot" style={{left:`${(i % level.size + .5) * cellPercent}%`,top:`${(Math.floor(i / level.size) + .5) * cellPercent}%`}}/>)}
      {(['top','bottom','left','right'] as const).flatMap(side => Array.from({length: level.size}, (_, lane) => {
        const horizontal = side === 'top' || side === 'bottom';
        const isExit = level.exits.some(e => e.side === side && e.lane === lane);
        const position: CSSProperties = horizontal ? {left:`${lane * cellPercent}%`,width:`${cellPercent}%`,[side]: isExit ? '-27px' : '-5px'} : {top:`${lane * cellPercent}%`,height:`${cellPercent}%`,[side]: isExit ? '-27px' : '-5px'};
        return isExit ? <div key={side+lane} className={`exit-marker ${side}`} style={position} title={`${t.exit} · ${t[side]}`} data-exit={`${side}-${lane}`}><SideArrow side={side}/></div> : <div key={side+lane} className={`fence ${horizontal ? 'horizontal' : 'vertical'}`} style={position}/>;
      }))}
      {selected !== null && activeRange && <div className="legal-lane" aria-hidden="true" style={{...styleFor(selected, activeRange.min), [level.bikes[selected].axis === 'h' ? 'width' : 'height']: `${(activeRange.max - activeRange.min + level.bikes[selected].length) * cellPercent}%`}}/>}
      {level.obstacles.map((obstacle, i) => <div className={`obstacle ${obstacle.kind}`} key={i} style={{left:`${obstacle.x*cellPercent}%`,top:`${obstacle.y*cellPercent}%`,width:`${cellPercent}%`,height:`${cellPercent}%`}} role="img" aria-label={t[obstacle.kind]}>{obstacle.kind === 'tree' ? <TreeArt/> : <BollardArt/>}</div>)}
      {hint && hint.to >= 0 && <div className="hint-target" style={styleFor(hint.bike, hint.to)} aria-hidden="true"/>}
      {drag && preview && preview.move.to >= 0 && <div className="snap-preview" style={styleFor(drag.bike, preview.move.to)} aria-hidden="true"/>}
      {level.bikes.map((bike, i) => {
        if (positions[i] < 0) return null;
        const dragging = drag?.bike === i;
        const style = styleFor(i, positions[i]);
        if (dragging && preview) style.transform = `translate${bike.axis === 'h' ? 'X' : 'Y'}(${preview.offset / bike.length * 100}%)`;
        return <button key={bike.id} type="button" data-testid={`bike-${bike.id}`} data-bike-index={i} className={`bike ${bike.axis} ${selected === i ? 'selected' : ''} ${hint?.bike === i ? 'hinted' : ''} ${dragging ? 'dragging' : ''} ${dragging && preview?.blocked ? 'blocked' : ''}`} style={style}
          aria-label={`${bike.length === 3 ? t.cargo : t.regular} ${bike.id}`} aria-pressed={selected === i} aria-disabled={locked}
          onFocus={() => onSelect(i)} onPointerDown={e => begin(e,i)} onPointerMove={update} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
          onKeyDown={e => {
            const negative = bike.axis === 'h' ? 'ArrowLeft' : 'ArrowUp', positive = bike.axis === 'h' ? 'ArrowRight' : 'ArrowDown';
            if (e.key === negative || e.key === positive) { e.preventDefault(); if (!dragRef.current && !locked) onStep(e.key === negative ? -1 : 1, i); }
          }}>
          <span className="bike-body" style={{'--bike-color':bike.color} as CSSProperties}><BikeArt color={bike.color} cargo={bike.length === 3} vertical={bike.axis === 'v'}/><span className="bike-id">{bike.id}</span></span>
        </button>;
      })}
      {ghost && !reduced && (() => {
        const bike = level.bikes[ghost.move.bike], direction = ghost.move.exit ?? 1;
        const from = ghost.positions[ghost.move.bike];
        const distance = direction === 1 ? level.size - from + 1 : -(from + bike.length + 1);
        const style = {...styleFor(ghost.move.bike, from), '--escape-x':bike.axis === 'h' ? `${distance / bike.length * 100}%` : '0%', '--escape-y':bike.axis === 'v' ? `${distance / bike.length * 100}%` : '0%'} as CSSProperties;
        return <div className="bike escaping" style={style} aria-hidden="true"><span className="bike-body" style={{'--bike-color':bike.color} as CSSProperties}><BikeArt color={bike.color} cargo={bike.length===3} vertical={bike.axis==='v'}/></span></div>;
      })()}
    </div>
  </div>;
}
