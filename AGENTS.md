# AGENTS.md for nobit Project

## Project Overview
This project is an Obsidian plugin that functions as a lightweight, performant, and hackable 5ch-compatible browser.
The primary motivation is to solve the performance and UI/UX issues of existing clients like Siki, by leveraging Obsidian's excellent window management capabilities as a UI framework.

## Setup & Development
- **Install dependencies:** `pnpm install`
- **Start development server (with auto-rebuild):** `pnpm dev`
- **Build for production:** `pnpm build`
- **Check for type errors:** `pnpm check-types`

## Core Architecture Principles
The key to this project's stability is the strict separation between the Obsidian world (class-based) and the Svelte world (reactive UI).

1.  **The Manager Layer (The "Translator"):**
    - All state management and interaction with the Obsidian API (`this.app`) **MUST** be handled within Manager classes (e.g., `ThreadManager.ts`, `BoardManager.ts`).
    - Svelte components **MUST NOT** import from `obsidian` directly.
    - Managers are instantiated in `main.ts` and injected into the Svelte component tree using Svelte's `setContext` function. Svelte components then retrieve them using `getContext`.

2.  **State Management:**
    - Global or view-specific state **MUST** be managed within the Manager classes using Svelte 5's `$state`.
    - The Svelte UI's only job is to subscribe to this reactive `state` from the Manager and call the Manager's methods upon user interaction.

3.  **Dependency Flow:**
    `main.ts (Obsidian Plugin)` → `Manager.ts (Class with $state)` → `View.ts (Bridge)` → `Component.svelte (Pure UI)`

## Testing Strategy (Test Pyramid)
This project employs a three-tiered testing strategy. All tests must pass before merging a PR.

### 1. Unit Tests (Jest)
- **Purpose:** To test pure TypeScript logic, helper functions, and the business logic within Manager classes.
- **Location:** `*.test.ts` files.
- **How to run:**
    - Run all tests: `pnpm test`
    - Run in watch mode: `pnpm test:watch`
- **Note:** When testing Managers, the Obsidian `app` object should be mocked to isolate the logic.

### 2. Component Tests (Storybook - *Planned*)
- **Purpose:** To develop and test Svelte components in isolation from Obsidian.
- **Workflow:** UI components should ideally be created and verified in Storybook first before being integrated into the main application. This is especially true for complex components like popovers or custom scroll behaviors.

### 3. End-to-End (E2E) Tests (Playwright)
- **Purpose:** To test the complete user flow within a mock Obsidian environment, ensuring all layers work together correctly.
- **Location:** `e2e/specs/` directory.
- **How to run:**
    - Run all E2E tests: `pnpm test:e2e`
    - Run a specific E2E test: `pnpm test:e2e:example` (modify the path as needed)
    - Run in debug mode: `pnpm test:e2e:debug`
- **Key Requirement:** Network requests to external sites (like 5ch) **MUST** be mocked using Playwright's network interception features to ensure deterministic and fast tests.
- and please see `obsidian-testing-toolkit\docs\README.md`

## Code Style & Conventions
- **Formatting & Linting:** This project uses Biome. Please format your code before committing. `pnpm dlx @biomejs/biome format --write .`
- **File Naming:**
    - Managers: `ThreadManager.ts`
    - Svelte Views (Bridge): `ThreadView.ts`
    - Svelte Components: `ThreadComponent.svelte`, `ResItem.svelte`
- **TypeScript:** Strict mode is enabled. Avoid using `any` type.

## Contribution Flow (Pull Requests)
1. Create a branch from `main` with a descriptive name (e.g., `feature/thread-view`, `fix/post-button-bug`).
2. Implement your changes following the architecture principles.
3. Add or update relevant tests (Unit and/or E2E).
4. Before submitting a PR, ensure all checks pass locally:
   - `pnpm check-types`
   - `pnpm test`
   - `pnpm test:e2e`
5. Create a Pull Request targeting the `main` branch.
