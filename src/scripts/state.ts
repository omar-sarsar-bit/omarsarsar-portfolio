// Shared, frame-by-frame state between the scroll engine and the 3D scene.

export interface SpawnRequest {
  x: number; // normalised device coordinates, -1..1
  y: number;
}

export const state = {
  /** Smoothed scroll position in px. */
  scroll: 0,
  /** Scroll distance available, in px. */
  max: 1,
  /** 0..1 over the whole page. */
  progress: 0,
  /** Continuous chapter position: 2.5 means halfway between chapters 2 and 3. */
  chapter: 0,
  /** 0..1 progress inside each chapter while it crosses the viewport. */
  chapterProgress: [0, 0, 0, 0, 0, 0, 0, 0] as number[],
  pointer: { x: 0, y: 0 },
  tone: 'paper' as 'paper' | 'cobalt' | 'ink',
  rtl: false,
  mobile: false,
  spawns: [] as SpawnRequest[],
};

export const calm = (): boolean => document.documentElement.classList.contains('calm');
export const isAscent = (): boolean => document.documentElement.classList.contains('ascent');
