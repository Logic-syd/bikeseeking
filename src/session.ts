import type { Level, Move } from './game/types';
import { applyMove, initialPositions, validatePositions } from './game/engine';
import type { Language } from './i18n';
export interface Snapshot { positions: number[]; moves: number }
export interface Session extends Snapshot { levelId: number; history: Snapshot[] }
export interface Settings { language: Language; sound: boolean; reducedMotion: boolean }
export interface Saved { settings: Settings; best: Record<number, number>; session: Session | null }
export const STORAGE_KEY = 'rad-raus:v1';
export function newSession(level: Level): Session { return { levelId: level.id, positions: initialPositions(level), moves: 0, history: [] }; }
export function moveSession(level: Level, session: Session, move: Move): Session {
  const positions = applyMove(level, session.positions, move);
  return positions ? { ...session, positions, moves: session.moves + 1, history: [...session.history, { positions: session.positions, moves: session.moves }] } : session;
}
export function undoSession(session: Session): Session {
  const previous = session.history.at(-1);
  return previous ? { ...session, ...previous, history: session.history.slice(0, -1) } : session;
}
export function readSaved(levels: Level[]): Saved {
  const defaults: Saved = { settings: { language: navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en', sound: true, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }, best: {}, session: null };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!raw || raw.version !== 1) return defaults;
    const settings = raw.settings;
    if (settings && (settings.language === 'de' || settings.language === 'en')) defaults.settings.language = settings.language;
    if (typeof settings?.sound === 'boolean') defaults.settings.sound = settings.sound;
    if (typeof settings?.reducedMotion === 'boolean') defaults.settings.reducedMotion = settings.reducedMotion;
    for (const level of levels) { const score = raw.best?.[level.id]; if (Number.isSafeInteger(score) && score > 0) defaults.best[level.id] = score; }
    const s = raw.session;
    const level = levels.find(l => l.id === s?.levelId);
    const valid = (p: unknown, moves: unknown): boolean => !!level && Array.isArray(p) && p.every(Number.isInteger) && validatePositions(level, p).length === 0 && Number.isSafeInteger(moves) && (moves as number) >= 0;
    if (level && valid(s.positions, s.moves) && Array.isArray(s.history) && s.history.length === s.moves && s.history.every((h: Snapshot, i: number) => h && valid(h.positions, h.moves) && h.moves === i)) defaults.session = s;
  } catch { /* An unavailable or old save must never prevent playing. */ }
  return defaults;
}
export function writeSaved(saved: Saved): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...saved })); return true; } catch { return false; }
}
