import { levels } from '../src/game/levels';
import { applyMove, initialPositions, isSolved, validateLevel, validatePositions } from '../src/game/engine';
import { solve } from '../src/game/solver';
let failed = false;
for (const level of levels) {
  const errors = validateLevel(level);
  const started = performance.now();
  const solution = solve(level, initialPositions(level));
  let positions = initialPositions(level);
  for (const move of solution.moves) {
    const next = applyMove(level, positions, move);
    if (!next) { errors.push(`Invalid solution move: ${JSON.stringify(move)}`); break; }
    positions = next;
    errors.push(...validatePositions(level, positions));
  }
  if (solution.status !== 'solved' || !isSolved(positions)) errors.push(`Solver result: ${solution.status}`);
  const duration = (performance.now() - started).toFixed(1);
  console.log(`${errors.length ? 'FAIL' : 'PASS'} Level ${String(level.id).padStart(2, '0')}: ${solution.moves.length} moves, ${solution.visited} nodes, ${duration} ms${errors.length ? ` — ${errors.join('; ')}` : ''}`);
  failed ||= errors.length > 0;
}
if (failed) process.exitCode = 1;
