export type Axis = 'h' | 'v';
export type Direction = -1 | 1;
export type Side = 'left' | 'right' | 'top' | 'bottom';
export interface Bike { id: string; axis: Axis; lane: number; length: 2 | 3; start: number; color: string }
export interface Exit { side: Side; lane: number }
export interface Obstacle { x: number; y: number; kind: 'tree' | 'bollard' }
export interface Level {
  id: number;
  title: { de: string; en: string };
  subtitle: { de: string; en: string };
  size: number;
  bikes: Bike[];
  exits: Exit[];
  obstacles: Obstacle[];
  difficulty: 'easy' | 'medium' | 'hard';
  tutorial?: 1 | 2 | 3;
}
/** Each entry is the bike's long-axis start coordinate, or -1 after exit. */
export type Position = number[];
/** Exits always use to:-1 plus an explicit exit direction. */
export interface Move { bike: number; to: number; exit?: Direction }
