import { describe, expect, it } from 'vitest';
import { canAutoplayMotion, getMotionTransition, MOTION_RECIPES } from './motionPolicy';

describe('motionPolicy', () => {
  it('returns the documented full-motion transition for a landing entry', () => {
    expect(getMotionTransition('entry', false)).toEqual({
      durationMs: 520,
      opacityOnly: false,
      translateY: 20,
    });
  });

  it('returns stable, opacity-only transitions when reduced motion is preferred', () => {
    expect(getMotionTransition('entry', true)).toEqual({
      durationMs: 0,
      opacityOnly: true,
    });
    expect(getMotionTransition('navigation', true)).toEqual({
      durationMs: 100,
      opacityOnly: true,
    });
  });

  it('returns a copy so callers cannot mutate the shared recipe', () => {
    const transition = getMotionTransition('feedback', false);

    expect(transition).toEqual(MOTION_RECIPES.feedback.full);
    expect(transition).not.toBe(MOTION_RECIPES.feedback.full);
  });

  it('allows autoplay only for approved landing entry and reveal motion', () => {
    expect(canAutoplayMotion('entry', 'landing')).toBe(true);
    expect(canAutoplayMotion('reveal', 'landing')).toBe(true);
    expect(canAutoplayMotion('entry', 'workspace')).toBe(false);
    expect(canAutoplayMotion('navigation', 'workspace')).toBe(false);
    expect(canAutoplayMotion('feedback', 'landing')).toBe(false);
  });
});
