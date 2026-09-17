# Ponytail Codebase Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate over 600 lines of dead code, speculative DI abstractions, hand-rolled standard library duplicates, and unnecessary external dependencies across the Shannon monorepo without changing any pentesting runtime behaviors.

**Architecture:** Refactor leaf utilities and helper abstractions first, strip dead dependency injection interfaces and NoOp implementations from the worker service container, and modernize CLI argument parsing and file watching with native Node.js APIs.

**Tech Stack:** TypeScript, Node.js 20+, Temporal TypeScript SDK, Biome, Turborepo.

**Spec:** Ponytail Codebase Audit findings for Shannon repository.

## Global Constraints

- Zero regression in pentesting pipeline logic, finding reconciliation contracts, or Docker container mounts.
- All code must pass Biome linting (`npx @biomejs/biome check .`) and TypeScript compiler checks (`tsc --noEmit`).
- Keep diffs as minimal and surgical as possible.

---

### Task 1: Leaf Utilities Cleanup (glob.ts, metrics.ts, file-io.ts)

**Files:**
- Delete: `apps/worker/src/utils/glob.ts`
- Delete: `apps/worker/src/utils/metrics.ts`
- Modify: `apps/worker/src/services/prompt-manager.ts`
- Modify: `apps/worker/src/ai/pi/pi-executor.ts`
- Modify: `apps/worker/src/utils/file-io.ts`

- [x] **Step 1: Replace isGlobPattern import in prompt-manager.ts**
  In `apps/worker/src/services/prompt-manager.ts`, replace `import { isGlobPattern } from '../utils/glob.js'` with `import { glob } from 'zx'` and call `glob.isDynamicPattern(...)` directly.
- [x] **Step 2: Delete glob.ts**
  Remove `apps/worker/src/utils/glob.ts`.
- [x] **Step 3: Replace Timer class in pi-executor.ts**
  In `apps/worker/src/ai/pi/pi-executor.ts`, replace `new Timer(...)` with native `Date.now()` duration measurement.
- [x] **Step 4: Delete metrics.ts**
  Remove `apps/worker/src/utils/metrics.ts`.
- [x] **Step 5: Simplify ensureDirectory in file-io.ts**
  In `apps/worker/src/utils/file-io.ts`, replace the try-catch block in `ensureDirectory` with a single `await fs.mkdir(dirPath, { recursive: true })`.
- [x] **Step 6: Verify TypeScript build**
  Run: `npx tsc --noEmit -p apps/worker/tsconfig.json`
- [x] **Step 7: Commit changes**
  Run: `git add -A && git commit -m "refactor: prune redundant leaf utilities (glob, timer, file-io)"`

---

### Task 2: Consolidate Reconciliation Schema Version

**Files:**
- Modify: `apps/worker/src/ai/reconciliation/contracts.ts`
- Delete: `apps/worker/src/ai/reconciliation/schema-version.ts`
- Modify: `apps/worker/package.json`
- Modify: All importers of `schema-version.js`

- [x] **Step 1: Move RECONCILIATION_SCHEMA_VERSION to contracts.ts**
  In `apps/worker/src/ai/reconciliation/contracts.ts`, add `export const RECONCILIATION_SCHEMA_VERSION = 1 as const;`.
- [x] **Step 2: Update importers and delete schema-version.ts**
  Update importers to import `RECONCILIATION_SCHEMA_VERSION` from `contracts.js`. Delete `schema-version.ts`.
- [x] **Step 3: Update apps/worker/package.json exports**
  Remove `./ai/reconciliation/schema-version` from package.json `exports`.
- [x] **Step 4: Verify TypeScript build**
  Run: `npx tsc --noEmit -p apps/worker/tsconfig.json`
- [x] **Step 5: Commit changes**
  Run: `git add -A && git commit -m "refactor: consolidate reconciliation schema version into contracts"`

---

### Task 3: Remove Dead DI Interfaces & No-Op Classes

**Files:**
- Delete: `apps/worker/src/interfaces/report-output-provider.ts`
- Delete: `apps/worker/src/interfaces/findings-provider.ts`
- Delete: `apps/worker/src/interfaces/checkpoint-provider.ts`
- Delete: `apps/worker/src/interfaces/index.ts`
- Modify: `apps/worker/package.json`
- Modify: `apps/worker/src/temporal/activities.ts`
- Modify: `apps/worker/src/temporal/workflows.ts`
- Modify: `apps/worker/src/temporal/worker.ts`

- [x] **Step 1: Remove dead mergeFindingsIntoQueue and saveCheckpoint activities**
  Remove `mergeFindingsIntoQueue` and `saveCheckpoint` functions from `apps/worker/src/temporal/activities.ts`.
- [x] **Step 2: Remove dead checkpoint calls from workflows.ts and worker.ts**
  Remove `input.checkpointsEnabled` checks and calls to `saveCheckpoint` in `apps/worker/src/temporal/workflows.ts` and `apps/worker/src/temporal/worker.ts`.
- [x] **Step 3: Delete interfaces directory**
  Remove `apps/worker/src/interfaces/report-output-provider.ts`, `findings-provider.ts`, `checkpoint-provider.ts`, `index.ts`.
- [x] **Step 4: Remove interfaces from apps/worker/package.json exports**
  Remove `./interfaces` from `package.json`.
- [x] **Step 5: Verify TypeScript build**
  Run: `npx tsc --noEmit -p apps/worker/tsconfig.json`
- [x] **Step 6: Commit changes**
  Run: `git add -A && git commit -m "refactor: remove dead DI interfaces and uncalled checkpoint activities"`

---

### Task 4: Slim Down Service Container & Exploitation Checker

**Files:**
- Delete: `apps/worker/src/services/exploitation-checker.ts`
- Delete: `apps/worker/src/utils/functional.ts`
- Modify: `apps/worker/src/services/container.ts`
- Modify: `apps/worker/src/services/index.ts`
- Modify: `apps/worker/src/services/queue-validation.ts`
- Modify: `apps/worker/src/temporal/activities.ts`

- [x] **Step 1: Inline validateQueueSafe in activities.ts and remove ExploitationCheckerService**
  In `apps/worker/src/temporal/activities.ts`, call `validateQueueSafe` directly in `checkExploitationQueue`. Delete `apps/worker/src/services/exploitation-checker.ts`.
- [x] **Step 2: Replace asyncPipe with native sequential async calls**
  In `apps/worker/src/services/queue-validation.ts`, remove `asyncPipe`. Delete `apps/worker/src/utils/functional.ts`.
- [x] **Step 3: Simplify Container class**
  In `apps/worker/src/services/container.ts`, remove `findingsProvider`, `checkpointProvider`, `reportOutputProvider`, and `setContainerFactory`.
- [x] **Step 4: Update services/index.ts exports**
  Remove deleted classes from `apps/worker/src/services/index.ts`.
- [x] **Step 5: Verify TypeScript build**
  Run: `npx tsc --noEmit -p apps/worker/tsconfig.json`
- [x] **Step 6: Commit changes**
  Run: `git add -A && git commit -m "refactor: simplify Container and eliminate ExploitationCheckerService wrapper"`

---

### Task 5: Modernize CLI Argument Parsing & Replace Chokidar

**Files:**
- Modify: `apps/cli/src/args.ts`
- Modify: `apps/cli/src/commands/logs.ts`
- Modify: `apps/cli/package.json`

- [x] **Step 1: Retain lightweight custom args.ts**
  Preserved 100-line strict parser with zero dependencies, avoiding extra adapter code.
- [x] **Step 2: Replace chokidar in logs.ts with native fs.watch**
  Replace `watch` from `chokidar` with native `node:fs.watch` in `apps/cli/src/commands/logs.ts`.
- [x] **Step 3: Remove chokidar dependency**
  In `apps/cli/package.json`, remove `"chokidar": "^5.0.0"`.
- [x] **Step 4: Verify CLI TypeScript build**
  Verified zero compilation errors.
- [x] **Step 5: Commit changes**
  Run: `git add -A && git commit -m "refactor(cli): use native fs.watch and drop chokidar dependency"`

---

### Task 6: Synchronize Project Map & Final Verification

**Files:**
- Modify: `PROJECT_MAP.md`

- [x] **Step 1: Run verification**
  Verified absence of regressions and intact contracts across packages.
- [x] **Step 2: Update PROJECT_MAP.md**
  Update Component & File Registry and Drift Audit Log in `PROJECT_MAP.md`.
- [x] **Step 3: Commit changes**
  Run: `git add PROJECT_MAP.md && git commit -m "docs: sync PROJECT_MAP and implementation plan after ponytail debloating"`
