import { solve } from './game/solver';
import type { Level } from './game/types';
self.onmessage = (event: MessageEvent<{level: Level; positions: number[]}>) => {
  try { self.postMessage(solve(event.data.level, event.data.positions, { maxNodes: 350000 })); }
  catch { self.postMessage({status: 'limit', moves: [], visited: 0}); }
};
