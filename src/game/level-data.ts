import type { Bike, Exit, Level, Obstacle } from './types';

const colors = ['#df7795', '#73a993', '#d6a14a', '#809fc8', '#b392bd', '#c77957', '#638d93', '#a3a164', '#c986a6', '#789176'];
type BikeSpec = [axis: 'h' | 'v', lane: number, start: number, length?: 2 | 3];
export function level(id: number, title: [string, string], subtitle: [string, string], specs: BikeSpec[], exits: Exit[], obstacles: Obstacle[] = [], difficulty: Level['difficulty'] = 'easy', size = 6): Level {
  const bikes: Bike[] = specs.map(([axis, lane, start, length = 2], i) => ({ id: String.fromCharCode(65 + i), axis, lane, start, length, color: colors[i % colors.length] }));
  return { id, title: { de: title[0], en: title[1] }, subtitle: { de: subtitle[0], en: subtitle[1] }, size, bikes, exits, obstacles, difficulty, ...(id <= 3 ? { tutorial: id as 1 | 2 | 3 } : {}) };
}
export const L = (lane: number): Exit => ({ side: 'left', lane });
export const R = (lane: number): Exit => ({ side: 'right', lane });
export const T = (lane: number): Exit => ({ side: 'top', lane });
export const B = (lane: number): Exit => ({ side: 'bottom', lane });
