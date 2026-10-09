import { getRange, isSolved, validatePositions } from './engine';
import type { Level, Move, Position } from './types';

export interface SolveResult { status: 'solved' | 'unsolvable' | 'limit'; moves: Move[]; visited: number }
interface Node { positions: Position; parent: number; moves: Move[] }

/**
 * Removing an exit-ready bike can never block any future move. Normalize every
 * node by taking all available exits. BFS then minimizes the number of internal
 * slides; all solutions contain exactly one exit per remaining bike, so the
 * resulting complete solution also uses the fewest total drag moves.
 */
function clearExits(level: Level, input: Position): { positions: Position; moves: Move[] } {
  const positions = input.slice();
  const moves: Move[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let bike = 0; bike < level.bikes.length; bike++) {
      if (positions[bike] === -1) continue;
      const range = getRange(level, positions, bike);
      if (!range.exitNegative && !range.exitPositive) continue;
      positions[bike] = -1;
      moves.push({ bike, to: -1, exit: range.exitNegative ? -1 : 1 });
      changed = true;
    }
  }
  return { positions, moves };
}

export function solve(level: Level, positions: Position, options: { maxNodes?: number } = {}): SolveResult {
  if (validatePositions(level, positions).length) return { status: 'unsolvable', moves: [], visited: 0 };
  const cap = Math.max(1, Math.floor(options.maxNodes ?? 80000));
  const start = clearExits(level, positions);
  const nodes: Node[] = [{ ...start, parent: -1 }];
  const seen = new Set<string>([start.positions.join(',')]);
  const finish = (index: number): SolveResult => {
    const segments: Move[][] = [];
    for (let i = index; i !== -1; i = nodes[i].parent) segments.push(nodes[i].moves);
    return { status: 'solved', moves: segments.reverse().flat(), visited: nodes.length };
  };
  for (let head = 0; head < nodes.length; head++) {
    const current = nodes[head];
    if (isSolved(current.positions)) return finish(head);
    for (let bike = 0; bike < level.bikes.length; bike++) {
      const from = current.positions[bike];
      if (from === -1) continue;
      const range = getRange(level, current.positions, bike);
      for (let to = range.min; to <= range.max; to++) {
        if (to === from) continue;
        const next = current.positions.slice();
        next[bike] = to;
        const cleared = clearExits(level, next);
        const key = cleared.positions.join(',');
        if (seen.has(key)) continue;
        if (nodes.length >= cap) return { status: 'limit', moves: [], visited: nodes.length };
        seen.add(key);
        nodes.push({ positions: cleared.positions, parent: head, moves: [{ bike, to }, ...cleared.moves] });
        if (isSolved(cleared.positions)) return finish(nodes.length - 1);
      }
    }
  }
  return { status: 'unsolvable', moves: [], visited: nodes.length };
}
