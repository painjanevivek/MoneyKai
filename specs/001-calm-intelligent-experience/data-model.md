# Experience Data Model

This feature creates **presentation models and rules**, not a new database. Existing MoneyKai services remain the source of truth for financial data, export records, settings, and future assistant responses.

## ExperienceTokenSet

| Field | Meaning | Validation |
| --- | --- | --- |
| `surfaceRole` | Semantic visual role: canvas, base surface, raised surface, muted surface, or overlay | Must map to an existing theme value; never encode a business state by color alone. |
| `textRole` | Primary, secondary, tertiary, inverse, or status text hierarchy | Must retain readable contrast in supported themes. |
| `emphasisLevel` | Quiet, standard, primary action, or critical | One primary emphasis per local decision area. |
| `spacingRole` | Compact, standard, section, or page rhythm | Must preserve readable grouping at narrow widths. |
| `elevationRole` | Flat, grouped, or temporary overlay | Ordinary information should default to flat/grouped. |

## MotionRecipe

| Field | Meaning | Validation |
| --- | --- | --- |
| `intent` | Entry, reveal, re-order, direct feedback, navigation orientation, or data-change acknowledgement | Must name a user benefit; decorative intent alone is invalid. |
| `trigger` | Initial view, deliberate user interaction, in-view reveal, or meaningful state change | Must not rely on timers to demand attention. |
| `fullMotion` | Normal transformation and timing behavior | Must be bounded, interruptible, and scoped to its component. |
| `reducedMotion` | Stable or minimally changing equivalent | Must preserve all information and action availability. |
| `semanticEffect` | Whether a content change needs assistive-technology notification | Decorative movement is always false. |
| `prohibitedUse` | Conditions that disallow the recipe | Includes obscuring text, looping workspace decoration, attention traps, and implying AI autonomy. |

## WorkspaceSurfaceState

| Field | Meaning | Validation |
| --- | --- | --- |
| `kind` | `ready`, `loading`, `empty`, `partial`, `restricted`, `unavailable`, or `error` | Exactly one active state per surface. |
| `headline` | Short truthful statement of the current condition | Cannot claim a completed action without authoritative data. |
| `detail` | Optional contextual explanation | Must not expose private values outside the surface’s authorization. |
| `source` | The service or record that establishes the state | Required for `ready`, `partial`, and persisted-history displays. |
| `primaryAction` | Safest recovery or progress action | Must be available only when the customer can take it. |
| `secondaryAction` | Optional alternative such as retry, learn more, or return | Must not trap the customer in a dead end. |

**State transitions**:

```text
loading -> ready | empty | partial | restricted | unavailable | error
ready -> loading | partial | unavailable | error
partial -> loading | ready | unavailable | error
error/unavailable -> loading (retry) | ready | empty | partial
```

## SavedReportExportPresentation

| Field | Meaning | Validation |
| --- | --- | --- |
| `availability` | `not-created`, `preparing`, `available`, `expired`, `failed`, or `unavailable` | `available` requires an authoritative export/report record. |
| `recordId` | Identifier of the authoritative saved item | Required only when `availability` is `available` or `expired`. |
| `title` | Customer-readable report/export name | Must describe actual available content. |
| `createdAt` | Customer-visible creation time | Only shown when supplied by the record. |
| `action` | Download, retry, create, or learn-more path | Must match the actual availability state. |

## GroundedAssistantPresentation

| Field | Meaning | Validation |
| --- | --- | --- |
| `status` | `disabled`, `loading`, `available`, `limited`, `refused`, `unavailable`, or `cancelled` | Does not imply a model/provider state beyond the typed response. |
| `facts` | Server-calculated financial facts, when applicable | Must be clearly visually separate from prose and sourced from the typed backend response. |
| `answer` | Plain-language explanation | Cannot claim an action was taken. |
| `sources` | Approved product-content references | Only show source links/labels supplied by the backend contract. |
| `caveats` | Contextual uncertainty and financial-safety boundary | Required where the backend marks a financial interpretation. |
| `nextAction` | Safe, optional user-controlled next step | Cannot create a state-changing action through the assistant. |

## ExperienceReleaseGate

| Field | Meaning | Validation |
| --- | --- | --- |
| `surface` | Landing, dashboard, reports, settings, or assistant | One gate per releasable surface. |
| `valueStatement` | User problem and expected improvement | Required before implementation. |
| `stateCoverage` | List of verified surface states | Must include ready and applicable non-happy paths. |
| `accessibilityResult` | Keyboard, focus, reduced-motion, and semantic review result | Any failure blocks release. |
| `claimReview` | Confirmation of accurate pricing, availability, privacy, and saved-state copy | Required for public/financial claims. |
| `rollback` | How the enhancement can be disabled or simplified | Must preserve core content and actions. |
