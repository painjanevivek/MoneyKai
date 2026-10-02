import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const badge = readFileSync(new URL('../../assets/branding/moneykai-badge.svg', import.meta.url), 'utf8');
const notificationIcon = readFileSync(new URL('../../android/app/src/main/res/drawable/ic_moneykai_notification.xml', import.meta.url), 'utf8');

describe('Android notification logo', () => {
  it('uses all four paths and the transform from the actual app badge instead of a letter M', () => {
    const badgePaths = [...badge.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
    expect(badgePaths).toHaveLength(4);
    for (const path of badgePaths) expect(notificationIcon).toContain(`android:pathData="${path}"`);
    expect(badge).toContain('translate(128 128) scale(.25)');
    expect(notificationIcon).toContain('android:translateX="128" android:translateY="128" android:scaleX="0.25" android:scaleY="0.25"');
    expect(notificationIcon).toContain('android:viewportWidth="512" android:viewportHeight="512"');
    expect(notificationIcon).not.toContain('M4,19V5h3l5,8');
  });

  it('preserves the circular ring and uses only white or transparent fills for Android tinting', () => {
    expect(badge).toContain('cx="256" cy="256" r="216"');
    expect(badge).toContain('stroke-width="16"');
    expect(notificationIcon).toContain('android:pathData="M256,40a216,216 0,1 1,0 432a216,216 0,1 1,0 -432Z"');
    expect(notificationIcon).toContain('android:strokeWidth="16"');
    expect([...notificationIcon.matchAll(/android:(?:fillColor|strokeColor)="([^"]+)"/g)].every(match => ['#FFFFFFFF', '#00000000'].includes(match[1]))).toBe(true);
    expect(notificationIcon).not.toMatch(/<rect|android:tint=/);
  });
});
