# Global Rules

## Interface Design Defaults

When handling user requests related to interface design, web applications, UI components, layout structure, or visual styling:
- **Awesome Design Skills**: Use the awesome-design-skills library (skills/ directory containing 67 design system skills).
- **Default Behavior**: Consult and apply the relevant design system skill (such as bento, glassmorphism, modern, minimal, clean, shadcn, neobrutalism, premium, sleek, vibrant, etc.) matching the requested or standard design context.
- **Standards**: Enforce the visual foundations, color palette tokens, typography scales, spacing scales, accessibility requirements (WCAG 2.2 AA), keyboard interaction rules, and quality gates specified in the chosen skill's SKILL.md.

## Mandatory Skill Orchestration & Dispatching (skill-orchestrator)

For EVERY user request across ALL projects, workspaces, and sessions:
- **Universal Middleware Interception**: You MUST always invoke and execute through the skill-orchestrator skill (skills/skill-orchestrator/SKILL.md) as the universal entry point before taking actions, modifying files, executing tools, or finalizing plans.
- **Prompt Decomposition**: Deconstruct every incoming prompt across 3 critical axes:
  1. **Axis A (Core Technical Intent)**: Categorize intent (feature-scaffold, bug-fix, refactor, test-qa, security-audit, map-sync, debt-tracking, etc.).
  2. **Axis B (Complexity & Boundary Scope)**: Assess scope (Fast Path for single-file trivial fixes, Bounded for standard 1-3 files, Architectural for multi-subsystem / heavy changes).
  3. **Axis C (Required Toolsets)**: Determine the required runtime tools (filesystem, search, terminal, browser).
- **Pipeline DAG & Step 1 Hard Gate (ponytail)**:
  - **Mandatory Step 1**: Always execute ponytail first to establish minimalist baselines (YAGNI, internal code reuse, standard library / native platform first, minimal diffs).
  - **Downstream Dispatch**: Construct and follow an explicit Directed Acyclic Graph (DAG) chaining the necessary skills (e.g., project-map-navigator, brainstorming, test-driven-development, systematic-debugging, verification-before-completion, webapp-testing, etc.).
- **Execution Receipt**: Before making non-trivial modifications or tool executions, announce the active pipeline:
  `[Orchestrator] Active Pipeline: ponytail -> <Next Skill(s)> | Intent: <Classified Intent> | Scope: <Fast|Bounded|Architectural>`

## Mandatory Zero-Mock & Verifiable Evidence Standard (no-mocks-verifiable-evidence)

For ALL projects, workspaces, and sessions without exception:
1. **Zero Mocks & No Placeholders**:
   - Every feature, UI element, API route, and background task MUST be connected directly to real system components, real CLI/engine processes, real filesystem paths, and real data.
   - Absolutely NO mock data, fake generators, pseudo-code, stubbed no-op callbacks, or placeholder UI components are permitted.
   - When no real data exists (e.g. an empty repository or freshly initialized workspace with no runs), render an honest empty state ("No scans found / Please launch a scan"), NEVER fake simulated records.
2. **Strict Verifiable Evidence Before Completion**:
   - Never declare any task, bugfix, or feature as complete without direct empirical proof.
   - Prohibit all speculative assertions, estimates, or unverified claims.
   - Every completion statement MUST cite exact execution output, test runs, process exit codes, or verified HTTP responses as tangible evidence.
