import type { Level } from './types';
import { level, R, B } from './level-data';
import { additionalLevels } from './additional-levels';

/** Hand-authored boards. Every lane opening is explicit; unlisted edges are fences. */
export const levels: Level[] = [
  level(1, ['Guten Morgen!', 'Good morning!'], ['Schiebe dein Rad zum mintgrünen Ausgang.', 'Slide your bike through the mint exit.'], [['h', 2, 1]], [R(2)], [{ x: 0, y: 0, kind: 'tree' }], 'easy', 5),
  level(2, ['Bitte Platz machen', 'Make a little room'], ['Erst das Rad im Weg, dann bist du dran.', 'Clear the bike in the way, then ride out.'], [['h', 2, 0], ['v', 2, 1]], [R(2), B(2)], [{ x: 4, y: 0, kind: 'tree' }], 'easy', 5),
  level(3, ['Großer Einkauf', 'The big shop'], ['Das Lastenrad braucht drei freie Felder.', 'The cargo bike needs three clear cells.'], [['h', 2, 0, 3], ['v', 3, 1]], [R(2), B(3)], [{ x: 0, y: 4, kind: 'bollard' }], 'easy', 5),
  ...additionalLevels,
];
