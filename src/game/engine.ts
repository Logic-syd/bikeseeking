import type { Bike, Direction, Level, Move, Position, Side } from './types';

export function initialPositions(level: Level): Position { return level.bikes.map(b => b.start); }
export function isSolved(positions: Position): boolean { return positions.length > 0 && positions.every(p => p === -1); }

export function bikeCells(bike: Bike, start: number): { x: number; y: number }[] {
  if (start === -1) return [];
  return Array.from({ length: bike.length }, (_, i) => bike.axis === 'h'
    ? { x: start + i, y: bike.lane }
    : { x: bike.lane, y: start + i });
}

export function validatePositions(level: Level, positions: Position): string[] {
  const errors: string[] = [];
  if (positions.length !== level.bikes.length) return ['Position count does not match bike count.'];
  const occupied = new Map<string, string>();
  for (const o of level.obstacles) occupied.set(`${o.x},${o.y}`, 'obstacle');
  level.bikes.forEach((b, i) => {
    const start = positions[i];
    if (!Number.isInteger(start) || start < -1 || start > level.size - b.length) {
      errors.push(`Bike ${b.id} has an invalid position.`); return;
    }
    if (start === -1) return;
    if (!Number.isInteger(b.lane) || b.lane < 0 || b.lane >= level.size) {
      errors.push(`Bike ${b.id} has an invalid lane.`); return;
    }
    for (const { x, y } of bikeCells(b, start)) {
      const key = `${x},${y}`;
      if (occupied.has(key)) errors.push(`Bike ${b.id} overlaps ${occupied.get(key)} at ${key}.`);
      occupied.set(key, b.id);
    }
  });
  return errors;
}

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(level.size) || level.size < 3 || level.size > 8) errors.push('Board size must be an integer from 3 to 8.');
  if (!level.bikes.length) errors.push('A level must contain at least one bike.');
  const ids = new Set<string>();
  for (const b of level.bikes) {
    if (!b.id || ids.has(b.id)) errors.push(`Duplicate or empty bike id: ${b.id}.`);
    ids.add(b.id);
    if (b.axis !== 'h' && b.axis !== 'v') errors.push(`Invalid axis: ${b.id}.`);
    if (b.length !== 2 && b.length !== 3) errors.push(`Invalid length: ${b.id}.`);
    if (!Number.isInteger(b.start) || b.start < 0) errors.push(`Invalid starting coordinate: ${b.id}.`);
    const sides: Side[] = b.axis === 'h' ? ['left', 'right'] : ['top', 'bottom'];
    if (!level.exits.some(e => e.lane === b.lane && sides.includes(e.side))) errors.push(`Bike ${b.id} has no aligned exit.`);
  }
  const exits = new Set<string>();
  for (const e of level.exits) {
    const key = `${e.side},${e.lane}`;
    if (!['left', 'right', 'top', 'bottom'].includes(e.side) || !Number.isInteger(e.lane) || e.lane < 0 || e.lane >= level.size) errors.push(`Invalid exit: ${key}.`);
    if (exits.has(key)) errors.push(`Duplicate exit: ${key}.`);
    exits.add(key);
  }
  const obstacles = new Set<string>();
  for (const o of level.obstacles) {
    const key = `${o.x},${o.y}`;
    if (![o.x, o.y].every(n => Number.isInteger(n) && n >= 0 && n < level.size)) errors.push(`Invalid obstacle: ${key}.`);
    if (o.kind !== 'tree' && o.kind !== 'bollard') errors.push(`Invalid obstacle kind: ${key}.`);
    if (obstacles.has(key)) errors.push(`Duplicate obstacle: ${key}.`);
    obstacles.add(key);
  }
  return errors.concat(validatePositions(level, initialPositions(level)));
}

export interface MovementRange { min: number; max: number; exitNegative: boolean; exitPositive: boolean }

/** Find the contiguous free corridor; never tests just the destination cells. */
export function getRange(level: Level, positions: Position, bikeIndex: number): MovementRange {
  const b = level.bikes[bikeIndex];
  const start = positions[bikeIndex];
  const unavailable: MovementRange = { min: -1, max: -1, exitNegative: false, exitPositive: false };
  if (!b || start === undefined || start === -1) return unavailable;
  const blocked = new Set<number>();
  for (const o of level.obstacles) {
    if ((b.axis === 'h' ? o.y : o.x) === b.lane) blocked.add(b.axis === 'h' ? o.x : o.y);
  }
  level.bikes.forEach((other, i) => {
    if (i === bikeIndex || positions[i] === -1) return;
    for (const cell of bikeCells(other, positions[i])) {
      if ((b.axis === 'h' ? cell.y : cell.x) === b.lane) blocked.add(b.axis === 'h' ? cell.x : cell.y);
    }
  });
  let min = start;
  let max = start;
  while (min > 0 && !blocked.has(min - 1)) min--;
  while (max + b.length < level.size && !blocked.has(max + b.length)) max++;
  const negative: Side = b.axis === 'h' ? 'left' : 'top';
  const positive: Side = b.axis === 'h' ? 'right' : 'bottom';
  return {
    min, max,
    exitNegative: min === 0 && level.exits.some(e => e.side === negative && e.lane === b.lane),
    exitPositive: max + b.length === level.size && level.exits.some(e => e.side === positive && e.lane === b.lane),
  };
}

export function legalMoves(level: Level, positions: Position, bikeIndex?: number): Move[] {
  const moves: Move[] = [];
  const indices = bikeIndex === undefined ? level.bikes.map((_, i) => i) : [bikeIndex];
  for (const i of indices) {
    if (!level.bikes[i] || positions[i] === -1) continue;
    const r = getRange(level, positions, i);
    if (r.exitNegative) moves.push({ bike: i, to: -1, exit: -1 });
    if (r.exitPositive) moves.push({ bike: i, to: -1, exit: 1 });
    for (let to = r.min; to <= r.max; to++) if (to !== positions[i]) moves.push({ bike: i, to });
  }
  return moves;
}

export function applyMove(level: Level, positions: Position, move: Move): Position | null {
  if (validatePositions(level, positions).length || !Number.isInteger(move.bike) || !Number.isInteger(move.to)) return null;
  const b = level.bikes[move.bike];
  if (!b || positions[move.bike] === -1 || positions[move.bike] === move.to) return null;
  const r = getRange(level, positions, move.bike);
  if (move.to === -1) {
    if (move.exit !== -1 && move.exit !== 1) return null;
    if (move.exit === -1 ? !r.exitNegative : !r.exitPositive) return null;
  } else if (move.exit !== undefined || move.to < r.min || move.to > r.max) return null;
  const result = positions.slice();
  result[move.bike] = move.to;
  return result;
}

/** Accessible controls move one cell, then exit once the bike reaches its opening. */
export function stepMove(level: Level, positions: Position, bikeIndex: number, direction: Direction): Move | null {
  const b = level.bikes[bikeIndex];
  if (!b || positions[bikeIndex] === -1) return null;
  const r = getRange(level, positions, bikeIndex);
  const to = positions[bikeIndex] + direction;
  if (to >= r.min && to <= r.max) return { bike: bikeIndex, to };
  if ((direction === -1 && r.exitNegative) || (direction === 1 && r.exitPositive)) return { bike: bikeIndex, to: -1, exit: direction };
  return null;
}
