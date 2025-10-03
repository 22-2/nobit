# Requirements Document

## Introduction

This feature implements a lightweight, performant, and hackable 5ch-compatible browser as an Obsidian plugin. The primary goal is to solve the performance and UI/UX issues of existing 5ch clients like Siki by leveraging Obsidian's excellent window management capabilities as a UI framework. The solution follows a strict architectural separation between Obsidian's class-based world and Svelte's reactive UI world through a Manager layer pattern.

## Requirements

### Requirement 1: Core Browser Functionality

**User Story:** As a 5ch user, I want to browse 5ch boards and threads within Obsidian, so that I can have a lightweight and performant browsing experience.

#### Acceptance Criteria

1. WHEN the user opens the 5ch browser view THEN the system SHALL display a board list interface
2. WHEN the user selects a board THEN the system SHALL fetch and display the thread list for that board
3. WHEN the user selects a thread THEN the system SHALL fetch and display the thread content with posts
4. WHEN the user navigates between boards and threads THEN the system SHALL maintain browsing history
5. IF a network request fails THEN the system SHALL display appropriate error messages to the user

### Requirement 2: Architecture Separation

**User Story:** As a developer, I want clear separation between Obsidian and Svelte layers, so that the codebase remains maintainable and testable.

#### Acceptance Criteria

1. WHEN implementing any feature THEN Svelte components SHALL NOT import from 'obsidian' directly
2. WHEN managing state THEN all state management SHALL be handled within Manager classes using Svelte 5's $state
3. WHEN components need Obsidian functionality THEN they SHALL access it through Manager classes via getContext
4. WHEN Managers are created THEN they SHALL be instantiated in main.ts and injected using setContext
5. IF a component needs to interact with Obsidian API THEN it SHALL call Manager methods instead of direct API calls

### Requirement 3: Performance Optimization

**User Story:** As a 5ch user, I want fast loading and smooth scrolling, so that I can browse efficiently without performance issues.

#### Acceptance Criteria

1. WHEN fetching data THEN the system SHALL cache responses to avoid redundant network requests
2. WHEN displaying posts THEN the system SHALL lazy load images and media content
3. WHEN scrolling through threads THEN the system SHALL maintain smooth performance
4. IF memory usage exceeds thresholds THEN the system SHALL implement cleanup mechanisms
5. WHEN performance optimization is needed THEN virtual scrolling MAY be implemented as a future enhancement

### Requirement 4: Network Request Management

**User Story:** As a developer, I want reliable network handling, so that the application can gracefully handle 5ch's API responses and errors.

#### Acceptance Criteria

1. WHEN making requests to 5ch THEN the system SHALL implement proper rate limiting
2. WHEN parsing 5ch responses THEN the system SHALL handle various encoding formats correctly
3. WHEN network errors occur THEN the system SHALL implement retry logic with exponential backoff
4. WHEN responses are malformed THEN the system SHALL provide fallback parsing mechanisms
5. IF 5ch servers are unavailable THEN the system SHALL display appropriate offline indicators

### Requirement 5: User Interface Components

**User Story:** As a 5ch user, I want intuitive and familiar interface elements, so that I can navigate and interact with content easily.

#### Acceptance Criteria

1. WHEN viewing boards THEN the system SHALL display board categories and descriptions
2. WHEN viewing threads THEN the system SHALL show thread titles, post counts, and last update times
3. WHEN reading posts THEN the system SHALL display post numbers, timestamps, and user IDs
4. WHEN interacting with posts THEN the system SHALL support reply links and post references
5. IF posts contain special formatting THEN the system SHALL render them appropriately

### Requirement 6: Testing Infrastructure

**User Story:** As a developer, I want comprehensive testing coverage, so that I can confidently make changes without breaking existing functionality.

#### Acceptance Criteria

1. WHEN implementing Manager logic THEN unit tests SHALL be written using Vitest focusing on public interfaces to avoid brittleness during refactoring
2. WHEN creating UI components THEN component tests SHALL be developed in Storybook
3. WHEN implementing user flows THEN E2E tests SHALL be written using Playwright leveraging existing infrastructure
4. WHEN making network requests in tests THEN external APIs SHALL be mocked for deterministic results
5. IF any test fails THEN the CI/CD pipeline SHALL prevent merging

### Requirement 7: Configuration and Customization

**User Story:** As a 5ch user, I want to customize the browser behavior, so that I can tailor the experience to my preferences.

#### Acceptance Criteria

1. WHEN first using the plugin THEN the system SHALL provide default 5ch server configurations
2. WHEN users want customization THEN the system SHALL allow configuration of refresh intervals
3. WHEN users prefer different layouts THEN the system SHALL support multiple view modes
4. WHEN users want to filter content THEN the system SHALL provide keyword filtering options
5. IF users have accessibility needs THEN the system SHALL support font size and contrast adjustments
### Requir
ement 8: View Architecture and MVP Approach

**User Story:** As a developer, I want a modular view architecture, so that I can implement features incrementally starting with an MVP.

#### Acceptance Criteria

1. WHEN implementing views THEN the system SHALL have three independent ItemView classes: ThreadView, BoardView, and BoardListView
2. WHEN starting development THEN ThreadView SHALL be implemented first as the Minimum Viable Product
3. WHEN creating ThreadView THEN it SHALL use existing thread-related components
4. WHEN implementing each view THEN they SHALL be completely independent and self-contained
5. IF additional views are needed THEN they SHALL follow the same architectural pattern as ThreadView### Req
uirement 9: Ruthless MVP Definition (v0.0.1)

**User Story:** As a developer, I want to start with the absolute minimum viable implementation, so that I can validate the core architecture before adding complexity.

#### Acceptance Criteria

1. WHEN a user executes a specific command (e.g., "Open Nobit Test Thread") THEN the system SHALL open a single ThreadView
2. WHEN the ThreadView opens THEN it SHALL fetch and display content from a hardcoded, predefined thread URL
3. WHEN displaying the thread THEN the system SHALL demonstrate the Manager layer → Svelte UI architecture working correctly
4. WHEN the basic ThreadView works THEN the same architectural pattern SHALL be extended to other features
5. IF the hardcoded thread loads successfully THEN the foundation is ready for dynamic thread loading