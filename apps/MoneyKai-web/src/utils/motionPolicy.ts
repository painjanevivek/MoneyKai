export type MotionIntent = 'entry' | 'reveal' | 'reorder' | 'feedback' | 'navigation' | 'data-change';

export type MotionTransition = Readonly<{
  durationMs: number;
  opacityOnly: boolean;
  translateY?: number;
  translateX?: number;
  scale?: number;
}>;

export type MotionRecipe = Readonly<{
  intent: MotionIntent;
  full: MotionTransition;
  reduced: MotionTransition;
  allowsAutoplay: boolean;
  allowedSurfaces: readonly ('landing' | 'workspace')[];
}>;

const DEFAULT_REDUCED_TRANSITION: MotionTransition = {
  durationMs: 0,
  opacityOnly: true,
};

export const MOTION_RECIPES: Record<MotionIntent, MotionRecipe> = {
  entry: {
    intent: 'entry',
    full: { durationMs: 520, opacityOnly: false, translateY: 20 },
    reduced: DEFAULT_REDUCED_TRANSITION,
    allowsAutoplay: true,
    allowedSurfaces: ['landing'],
  },
  reveal: {
    intent: 'reveal',
    full: { durationMs: 440, opacityOnly: false, translateY: 12 },
    reduced: DEFAULT_REDUCED_TRANSITION,
    allowsAutoplay: true,
    allowedSurfaces: ['landing'],
  },
  reorder: {
    intent: 'reorder',
    full: { durationMs: 180, opacityOnly: false, translateY: 6 },
    reduced: { durationMs: 120, opacityOnly: true },
    allowsAutoplay: false,
    allowedSurfaces: ['workspace'],
  },
  feedback: {
    intent: 'feedback',
    full: { durationMs: 160, opacityOnly: false, scale: 0.98 },
    reduced: { durationMs: 100, opacityOnly: true },
    allowsAutoplay: false,
    allowedSurfaces: ['landing', 'workspace'],
  },
  navigation: {
    intent: 'navigation',
    full: { durationMs: 180, opacityOnly: false, translateX: 4 },
    reduced: { durationMs: 100, opacityOnly: true },
    allowsAutoplay: false,
    allowedSurfaces: ['workspace'],
  },
  'data-change': {
    intent: 'data-change',
    full: { durationMs: 220, opacityOnly: false, translateY: 4 },
    reduced: { durationMs: 120, opacityOnly: true },
    allowsAutoplay: false,
    allowedSurfaces: ['workspace'],
  },
};

export function getMotionTransition(intent: MotionIntent, prefersReducedMotion: boolean): MotionTransition {
  const recipe = MOTION_RECIPES[intent];
  return { ...(prefersReducedMotion ? recipe.reduced : recipe.full) };
}

export function canAutoplayMotion(intent: MotionIntent, surface: 'landing' | 'workspace'): boolean {
  const recipe = MOTION_RECIPES[intent];
  return recipe.allowsAutoplay && recipe.allowedSurfaces.includes(surface);
}
