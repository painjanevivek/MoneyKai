---

description: "Dependency-ordered implementation tasks for the Calm Intelligent Experience"
---

# Tasks: Calm Intelligent Experience

**Input**: Design documents from `specs/001-calm-intelligent-experience/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [UI experience contract](./contracts/ui-experience-contract.md), and [quickstart.md](./quickstart.md)

**Tests**: Focused unit and browser/visual validation tasks are included because the specification explicitly requires accessible, truthful, reduced-motion-safe behavior.

**Organization**: Tasks are grouped by independently testable user story. Finish the shared foundation before beginning story work.

## Mandatory commit and push protocol

After **every completed implementation task that changes files**, create and push one focused Conventional Commit before starting the next implementation task.

```text
feat(scope): concise completed-task summary

- State the customer-visible outcome.
- State the key technical or safety constraint preserved.
- State the focused validation run, or why it is deferred.
```

Use `fix(scope): ...` when correcting a defect. Stage only the files produced by the completed task—never unrelated user changes such as `AGENTS.md`. For a validation-only task that changes no files, attach its evidence to the current task’s change set; do not create an empty commit. If push authentication or CI blocks progress, retain the commit, report the exact blocker, and do not move work to another branch as a workaround.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the visual baseline, source-of-truth inventory, and scoped implementation structure without adding another framework.

- [X] T001 Create the current-state and claim baseline in `specs/001-calm-intelligent-experience/baseline.md`, covering landing content, pricing, web-only availability, workspace routes, reports, exports, and assistant availability states.
- [ ] T002 [P] Create the motion-intent policy and reduced-motion helper in `apps/MoneyKai-web/src/utils/motionPolicy.ts` using the `MotionRecipe` rules from `specs/001-calm-intelligent-experience/data-model.md`.
- [ ] T003 [P] Create focused unit coverage for motion-intent and reduced-motion fallbacks in `apps/MoneyKai-web/src/utils/motionPolicy.test.ts`.
- [ ] T004 [P] Add the experience-state inventory and owner map in `specs/001-calm-intelligent-experience/state-inventory.md` using `WorkspaceSurfaceState` and `SavedReportExportPresentation` from `data-model.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared visual and truthful-state foundation required by every redesigned surface.

**⚠️ CRITICAL**: Complete this phase before changing landing, workspace, report, settings, or assistant surfaces.

- [ ] T005 Define reusable semantic experience roles and document their mapping to existing themes in `apps/MoneyKai-web/src/constants/theme.ts` without changing customer-selected theme behavior.
- [ ] T006 [P] Create a reusable truthful status/empty/error surface in `apps/MoneyKai-web/src/components/ui/SurfaceState.tsx` based on `WorkspaceSurfaceState` from `specs/001-calm-intelligent-experience/data-model.md`.
- [ ] T007 [P] Create a reusable section and subsection heading primitive in `apps/MoneyKai-web/src/components/ui/SectionHeading.tsx` for dashboard, reports, and settings hierarchy.
- [ ] T008 [P] Create focused presentation tests for `SurfaceState` in `apps/MoneyKai-web/src/components/ui/SurfaceState.test.tsx`, covering loading, empty, unavailable, and error semantics.
- [ ] T009 Wire shared semantic roles and the new UI primitives into `apps/MoneyKai-web/src/components/ui/Card.tsx`, `apps/MoneyKai-web/src/components/ui/EmptyState.tsx`, and `apps/MoneyKai-web/src/components/ui/Button.tsx` without changing their existing functional contracts.
- [ ] T010 Validate the Phase 2 foundation against `specs/001-calm-intelligent-experience/contracts/ui-experience-contract.md` and record the result in `specs/001-calm-intelligent-experience/validation-log.md`.

**Checkpoint**: Shared hierarchy, truth-state, and reduced-motion primitives are ready. User stories can now proceed without inventing inconsistent local patterns.

---

## Phase 3: User Story 1 - Understand MoneyKai at a Glance (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor understands MoneyKai, its web availability, pricing posture, trust boundary, and next action without depending on animation.

**Independent Test**: With motion both enabled and reduced, a visitor can identify MoneyKai’s purpose and primary action within the first view, then reach accurate pricing and availability content while scrolling.

- [ ] T011 [P] [US1] Write landing-page content and claim tests in `apps/MoneyKai-web/src/app/index.test.tsx`, covering web-only wording, Free/coming-soon pricing labels, and the primary call to action.
- [ ] T012 [US1] Recompose the public story and remove redundant/empty sections in `apps/MoneyKai-web/src/app/index.tsx` using the promise → proof → benefits → trust → pricing → action sequence from `plan.md`.
- [ ] T013 [US1] Consolidate the landing-page visual hierarchy and responsive spacing in `apps/MoneyKai-web/src/global.css` using existing warm MoneyKai public tokens rather than adding a competing style system.
- [ ] T014 [US1] Implement the landing hero and product-preview motion recipes in `apps/MoneyKai-web/src/app/index.tsx` with a complete stable reduced-motion path from `src/utils/motionPolicy.ts`.
- [ ] T015 [US1] Encapsulate any required timeline-only landing composition in `apps/MoneyKai-web/src/components/marketing/LandingMotionScene.tsx`; do not introduce ambient workspace motion or a new animation dependency.
- [ ] T016 [US1] Update landing accessibility semantics, focus order, alternative text, and decorative-media treatment in `apps/MoneyKai-web/src/app/index.tsx` and `apps/MoneyKai-web/src/global.css`.
- [ ] T017 [US1] Add wide, tablet, and narrow viewport visual-regression coverage for the landing page in `playwright/landing-calm-experience.spec.ts`.
- [ ] T018 [US1] Add a reduced-motion landing journey assertion in `playwright/landing-calm-experience.spec.ts` proving essential copy and calls to action are available without spatial/looping animation.
- [ ] T019 [US1] Record the landing-page claim and accessibility review in `specs/001-calm-intelligent-experience/validation-log.md` using the scenarios in `quickstart.md`.

**Checkpoint**: The landing page is an independently shippable MVP: clear, calm, accurate, responsive, and useful without motion.

---

## Phase 4: User Story 2 - Navigate a Calm, Capable Workspace (Priority: P1)

**Goal**: An authenticated customer can identify their financial priority, navigate reports and saved outputs, and find a settings category without a dense or generic card-heavy interface.

**Independent Test**: A fixture-data customer can navigate dashboard → Reports → Saved reports & exports → Settings on the first attempt, with truthful empty and unavailable states.

- [ ] T020 [P] [US2] Add navigation-label and active-state coverage for report destinations in `apps/MoneyKai-web/src/components/layout/DesktopShell.test.tsx`.
- [ ] T021 [P] [US2] Add truthful saved-report/export state coverage in `apps/MoneyKai-web/src/app/(tabs)/reports/saved.test.tsx`, including no-record, preparing, available, failed, and unavailable cases.
- [ ] T022 [US2] Refine reports hierarchy, active-route feedback, keyboard semantics, and the explicit Statement intelligence/Saved reports & exports split in `apps/MoneyKai-web/src/components/layout/DesktopShell.tsx`.
- [ ] T023 [US2] Recompose priority, next action, and secondary detail on the finance overview in `apps/MoneyKai-web/src/app/(tabs)/dashboard.tsx` and `apps/MoneyKai-web/src/components/dashboard/` without recalculating or mutating finance data in presentation code.
- [ ] T024 [US2] Apply `SurfaceState` to truthful report/import/export conditions in `apps/MoneyKai-web/src/app/(tabs)/reports.tsx` and `apps/MoneyKai-web/src/app/(tabs)/reports/saved.tsx`.
- [ ] T025 [US2] Reorganize existing controls into predictable named settings sections and subsections in `apps/MoneyKai-web/src/app/(tabs)/settings.tsx`, preserving all existing actions and privacy explanations.
- [ ] T026 [US2] Reduce unnecessary card nesting and align typography, dividers, status colors, and actions across `apps/MoneyKai-web/src/app/(tabs)/dashboard.tsx`, `apps/MoneyKai-web/src/app/(tabs)/reports.tsx`, and `apps/MoneyKai-web/src/app/(tabs)/settings.tsx`.
- [ ] T027 [US2] Add direct-interaction-only responsive motion to reports navigation and non-destructive workspace feedback in `apps/MoneyKai-web/src/components/layout/DesktopShell.tsx` and the affected route components, honoring `motionPolicy.ts`.
- [ ] T028 [US2] Add authenticated navigation and empty-state browser coverage in `playwright/workspace-calm-experience.spec.ts` using non-sensitive fixture data.
- [ ] T029 [US2] Record dashboard/report/settings task-completion, keyboard, long-label, and no-record validation in `specs/001-calm-intelligent-experience/validation-log.md`.

**Checkpoint**: Dashboard, Reports, Saved reports & exports, and Settings are independently usable, visually calm, and truthful without requiring the assistant.

---

## Phase 5: User Story 3 - Receive Trustworthy AI Guidance (Priority: P2)

**Goal**: The web client can present future guarded-assistant outcomes as evidence-based, limited, optional assistance without enabling any AI provider or expanding data access.

**Independent Test**: Typed fixture responses render facts, sources, explanation, caveats, and status distinctly; disabled/refused/unavailable paths never block dashboard, reports, or settings.

- [ ] T030 [P] [US3] Add a `GroundedAssistantPresentation` mapper and type guards in `apps/MoneyKai-web/src/features/ai/presentation.ts` using existing `apps/MoneyKai-web/src/features/ai/types.ts` and `services/aiClient.ts` contracts.
- [ ] T031 [P] [US3] Add mapper tests for disabled, loading, available, limited, refused, unavailable, and cancelled responses in `apps/MoneyKai-web/src/features/ai/presentation.test.ts`.
- [ ] T032 [US3] Create an accessible assistant answer-state component in `apps/MoneyKai-web/src/components/ai/GroundedAssistantAnswer.tsx` that visually separates facts, sources, explanation, caveats, status, and safe next actions.
- [ ] T033 [US3] Integrate `GroundedAssistantAnswer` into `apps/MoneyKai-web/src/components/dashboard/AiAssistantPanel.tsx` and `apps/MoneyKai-web/src/components/dashboard/AIInsights.tsx` without creating a second client protocol or provider call.
- [ ] T034 [US3] Add disabled, refusal, quota/unavailable, and source/fact presentation checks in `apps/MoneyKai-web/src/components/ai/GroundedAssistantAnswer.test.tsx`.
- [ ] T035 [US3] Add a no-autonomy/no-core-route-blocking browser scenario in `playwright/workspace-calm-experience.spec.ts` using typed assistant fixtures only.
- [ ] T036 [US3] Record the AI UI boundary review in `specs/001-calm-intelligent-experience/validation-log.md`, confirming that no provider key, private-document processing, RAG corpus, or write action is enabled.

**Checkpoint**: The UI can safely render the eventual guarded assistant but remains a fully functional finance product when the assistant is disabled.

---

## Phase 6: User Story 4 - Use Motion Without Losing Control (Priority: P2)

**Goal**: Customers who use reduced motion, keyboard navigation, screen readers, or constrained devices receive the same content, actions, and truthful states.

**Independent Test**: Keyboard-only and reduced-motion validation completes the landing, reports, Saved reports & exports, settings, and assistant-state journeys without relying on animation, color alone, or hover.

- [ ] T037 [P] [US4] Add reduced-motion and semantic-state tests for shared motion rules in `apps/MoneyKai-web/src/utils/motionPolicy.test.ts`.
- [ ] T038 [P] [US4] Add keyboard focus-order and action-label coverage for the reports and settings journeys in `playwright/workspace-calm-experience.spec.ts`.
- [ ] T039 [US4] Audit and correct focus visibility, accessible labels, color-independent states, and responsive reading order in `apps/MoneyKai-web/src/components/layout/DesktopShell.tsx`, `apps/MoneyKai-web/src/app/(tabs)/settings.tsx`, and `apps/MoneyKai-web/src/app/(tabs)/reports/saved.tsx`.
- [ ] T040 [US4] Audit and correct reduced-motion/static behavior across `apps/MoneyKai-web/src/app/index.tsx`, `apps/MoneyKai-web/src/components/marketing/LandingMotionScene.tsx`, and workspace interaction components.
- [ ] T041 [US4] Record wide/narrow, reduced-motion, keyboard-only, and screen-reader review outcomes in `specs/001-calm-intelligent-experience/validation-log.md`.

**Checkpoint**: The enhanced experience remains controlled, accessible, and understandable under motion, accessibility, and device constraints.

---

## Phase 7: Polish and Cross-Cutting Concerns

**Purpose**: Verify performance, public claims, rollback readiness, and full feature quality across all user stories.

- [ ] T042 [P] Audit landing copy and all changed public claims in `apps/MoneyKai-web/src/app/index.tsx` and `apps/MoneyKai-web/src/content/publicSite.ts` against current approved pricing and platform availability.
- [ ] T043 [P] Review all changed surfaces for truthful state wording and source-of-truth adherence using `specs/001-calm-intelligent-experience/contracts/ui-experience-contract.md`.
- [ ] T044 Add or update focused component tests for every changed shared primitive in `apps/MoneyKai-web/src/components/ui/` and route test coverage in `apps/MoneyKai-web/src/app/`.
- [ ] T045 Run and record TypeScript, lint, unit, browser, public-route SEO, and web-build results in `specs/001-calm-intelligent-experience/validation-log.md` using the commands in `quickstart.md`.
- [ ] T046 Capture desktop, tablet, narrow-width, reduced-motion, empty-data, and unavailable-assistant screenshots in `specs/001-calm-intelligent-experience/screenshots/` and reference them from `validation-log.md`.
- [ ] T047 Document visual/assistant rollback behavior and release-control ownership in `specs/001-calm-intelligent-experience/rollback.md` without changing production flags or credentials.
- [ ] T048 Prepare the implementation pull-request description in `specs/001-calm-intelligent-experience/pull-request.md`, including customer impact, tests, accessibility review, public-claim review, AI-boundary confirmation, rollout, rollback, and screenshots.

---

## Dependencies and Execution Order

```text
Phase 1 (T001–T004)
  -> Phase 2 (T005–T010)
      -> US1 landing MVP (T011–T019)
      -> US2 workspace (T020–T029)
      -> US3 assistant presentation (T030–T036)
      -> US4 accessibility/motion control (T037–T041)
          -> Phase 7 cross-cutting release work (T042–T048)
```

### User Story Dependencies

- **US1 (P1)** depends only on the shared foundation and is the recommended MVP.
- **US2 (P1)** depends on the shared foundation; it can run alongside US1 after T010, but both stories share visual primitives and should merge in small commits.
- **US3 (P2)** depends on the shared foundation and existing typed AI client only. It does not depend on the AI backend rollout.
- **US4 (P2)** verifies all prior stories. Early helper tests can run in parallel, but final accessibility review follows the affected visual work.

### Parallel Opportunities

- T002, T003, and T004 can proceed in parallel after the baseline scope is agreed.
- T006, T007, and T008 touch separate shared files and can proceed in parallel.
- T011 can be prepared while the landing implementation is scoped; T020 and T021 can be prepared while workspace composition is scoped.
- T030/T031 and T037/T038 are independent of landing/reports implementation after Phase 2.
- T042 and T043 may run in parallel after all changed surfaces are available.

## Parallel Example: Foundation

```text
Task: "Create truthful state primitive in apps/MoneyKai-web/src/components/ui/SurfaceState.tsx"
Task: "Create section heading primitive in apps/MoneyKai-web/src/components/ui/SectionHeading.tsx"
Task: "Create SurfaceState tests in apps/MoneyKai-web/src/components/ui/SurfaceState.test.tsx"
```

## Implementation Strategy

### MVP first

1. Complete T001–T010.
2. Complete T011–T019 for the landing page.
3. Validate the landing experience with and without motion.
4. Commit and push every focused completed task, then demo the public experience before expanding scope.

### Incremental delivery

1. Foundation → shared, truthful visual language.
2. US1 → clear public story and motion discipline.
3. US2 → calm authenticated workspace and discoverable navigation.
4. US3 → guarded-assistant presentation only, no backend enablement.
5. US4 → full accessibility and motion-control verification.
6. Phase 7 → release evidence and rollback readiness.

## Format Validation

All 48 tasks use the required checkbox, sequential task ID, optional parallel marker, user-story label where required, and exact file path format.
