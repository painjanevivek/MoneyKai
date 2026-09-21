# MoneyKai Mobile Design System

**Version:** 1.0.0

**Status:** Production token contract for Android V1

**Owner:** Mobile / design system

## Principles

MoneyKai must feel calm, trustworthy, and quick to understand before it feels decorative. The
system uses one light appearance, solid surfaces, restrained depth, accessible contrast, and short
purposeful motion. Financial meaning, sync state, privacy choices, destructive consequences, and
recovery are never encoded by color or motion alone.

## Sources of Truth

- `src/constants/designTokens.ts` owns brand, semantic color, type, space, shape, control, icon,
  motion, elevation, and glass primitives.
- `src/constants/theme.ts` exposes the compatibility names used by existing components while M02
  migrates them. New code should prefer the semantic values exported from the token source.
- `src/hooks/useTheme.ts` returns the immutable production light scheme. It has no user-, device-,
  or system-controlled appearance path.

Raw visual constants may exist outside the token source only for an approved provider brand mark,
a documented data-visualization mapping, or a native/platform contract that cannot consume tokens.
Every exception needs a comment and test or evidence reference.

## Color

### Brand primitives

| Role | Value | Use |
|---|---|---|
| Ink | `#171A15` | Primary text and content on lime actions |
| Paper | `#F8F7F0` | Application canvas |
| Surface | `#FFFFFF` | Cards, fields, and sheets |
| Cream | `#F1EAD7` | Quiet support surfaces |
| Lime | `#B8F25C` | Primary action surface and selected emphasis |
| Lime strong | `#557A18` | Accessible action-linked text and icons on light surfaces |
| Lime deep | `#314610` | Focus, pressed, and strong emphasis |
| Olive | `#667453` | Secondary emphasis and neutral status support |

Status colors use distinct red, amber, blue, and green families with paired soft backgrounds. Text,
icons, labels, and state wording must accompany status color.

### Semantic usage

- `action` + `onAction` is the primary filled action pair.
- `primary` is the accessible lime-family foreground for links, icons, and emphasized text.
- `primaryBg` is a quiet lime tint, not a success state.
- `surfaceSupport` and `surfaceElevated` create hierarchy without gradients.
- `focusRing` is visible independently of border color.
- `glassBg` and `glassBorder` are allowed only for the navigation/sheet cases defined below.

Automated tests require WCAG AA contrast for primary text on the canvas, secondary text on white,
primary foreground on white, and ink on the lime action surface. M02.5 adds rendered/device checks.

## Typography

Android uses its installed system sans-serif and sans-serif-medium families. This avoids presenting
an unloaded font name in the active React Native entry point and preserves native text shaping,
fallback glyphs, and font-scale behaviour. Sizes begin at 12 px with paired line heights; body copy
defaults to 15/22. Display sizes are reserved for one screen title or amount hierarchy, not card
decoration.

- Regular: long-form/supporting text.
- Medium: controls, labels, and compact metrics.
- Semibold/bold compatibility aliases: emphasis without introducing another font family.
- Monospace: identifiers or diagnostic text only; never normal financial presentation.

Text must wrap at 200% scaling. Do not disable font scaling or use `adjustsFontSizeToFit` to conceal
important content.

## Space, Shape, and Elevation

Spacing uses a 4 px foundation with the named sequence `xs` through `5xl`. Screen gutters start at
16 px and may grow on wide layouts. Controls use 44, 48, or 56 px heights; every interactive target
must occupy at least 44x44 px even when its visible icon is smaller.

Radii range from 4 to 24 px. Use 12-16 px for normal cards and controls; full pills are reserved for
compact statuses, chips, and avatars. Elevation is intentionally shallow. Hierarchy should come
from spacing, typography, surface color, and border before shadow.

## Icons

Material Community Icons are the application icon family until the production adapter in M02.3
owns names, sizes, accessibility, and platform rendering. Use 20 px for inline actions, 24 px for
standard navigation/actions, and 28-32 px only for a focused empty state or feature marker. Branded
identity-provider marks remain separate from application icons.

## Motion

Motion durations are 120 ms, 180 ms, or 240 ms. Transitions communicate hierarchy or state change;
they do not loop, bounce for decoration, or delay a financial result. The reduced-motion duration is
zero and M02.3 provides one runtime decision hook consumed by navigation and interactive primitives.

Press feedback uses opacity and at most a 0.98 scale. Any transform must preserve the 44x44 target
and accessible focus. Screen transitions retain user-entered state and never animate a false success.

## Glass

Glass is a restrained navigation/overlay material, not a page background or card theme. Its solid
fallback is 92% white with an olive border. Android blur remains disabled until the exact Expo SDK
56 `BlurTargetView`/`BlurView` contract, pinned dependency, low-end device performance, and rendered
contrast pass M02.5. The solid fallback is the production default.

## Appearance Migration

Existing installs and backups may contain older theme names or a dark preference. Restore and store
merge paths normalize all such values to the light production theme. The active app, alternate
router shell, status bar, navigation container, auth shell, and settings surfaces cannot select a
dark appearance. Serialized compatibility fields remain temporarily so old data is readable; M03
owns their schema retirement after migration coverage exists.

## Prohibited Patterns

- gradients, theme pickers, appearance toggles, or system-controlled dark appearance;
- bright lime text on white or white text on lime;
- raw shadows/radii/colors repeated across production components;
- color-only status, unlabeled icon buttons, touch targets below 44x44 px;
- hidden financial consequences, sync state, permission purpose, or destructive action detail; and
- decorative glass or motion that reduces legibility, predictability, or low-end performance.

## Change Control

Token changes require focused contrast/type/touch/motion tests and rendered regression evidence for
affected components. Adding an appearance mode, gradient, font dependency, blur dependency, or new
icon family reopens `DESIGN-01`, `DESIGN-02`, `A11Y-01`, and applicable release checks.
