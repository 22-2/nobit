# Implementation Plan

- [x] 1. Set up ThreadManager foundation with existing 5ch infrastructure






  - Create ThreadManager class using ObsidianFetcher, DefaultDecoder, and DefaultParser
  - Implement Svelte 5 $state reactive properties for thread, isLoading, error, and filters
  - Add constructor that initializes existing 5ch communication components
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.1 Write unit tests for ThreadManager public interface






  - Test loadThread method with mocked ObsidianFetcher responses
  - Test error handling for network failures and parsing errors
  - Test reactive state updates (thread, isLoading, error)
  - Focus on public interface behavior, not internal implementation details
  - _Requirements: 6.1_

- [x] 2. Implement ThreadManager core functionality





  - Add loadThread method using existing ObsidianFetcher.fetch()
  - Integrate DefaultDecoder for Shift-JIS decoding
  - Use DefaultParser.parseThread() for DAT file processing
  - Implement proper error handling with user-friendly Japanese messages
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 2.1 Add ThreadManager utility methods


  - Implement refreshThread method (reload current thread URL)
  - Add updateFilters method for ThreadFilters state management
  - Create jumpToPost method for navigation within thread
  - _Requirements: 1.4, 5.4, 7.2_

- [x] 2.2 Extend unit tests for ThreadManager methods






  - Test refreshThread functionality
  - Test updateFilters state changes
  - Test jumpToPost navigation logic
  - _Requirements: 6.1_

- [x] 3. Create ThreadView ItemView class





  - Extend Obsidian's ItemView class for ThreadView
  - Initialize ThreadManager in constructor with this.app
  - Implement getViewType() and getDisplayText() methods
  - Add proper Svelte component mounting/unmounting in onOpen/onClose
  - _Requirements: 2.1, 2.3, 2.4, 8.1, 8.2, 8.3_

- [x] 3.1 Set up Svelte context injection in ThreadView


  - Use setContext to inject ThreadManager into Svelte component tree
  - Ensure ThreadManager is available to child components via getContext
  - Implement proper context cleanup on view close
  - _Requirements: 2.3, 2.4_

- [x] 4. Create ThreadViewComponent.svelte main component





  - Build main thread display component using existing PostItem, ThreadToolbar, ThreadFilters
  - Implement getContext to access ThreadManager
  - Add onMount hook to load hardcoded thread URL for MVP
  - Create reactive UI that responds to ThreadManager state changes
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 9.1, 9.2, 9.3_

- [x] 4.1 Integrate existing thread components


  - Use PostItem.svelte for individual post display
  - Integrate ThreadToolbar.svelte for refresh functionality
  - Add ThreadFilters.svelte for filtering options
  - Ensure proper event handling between components and ThreadManager
  - _Requirements: 5.3, 5.4, 8.3_

- [x] 4.2 Implement loading and error states in ThreadViewComponent


  - Add loading spinner when ThreadManager.isLoading is true
  - Display error messages when ThreadManager.error is set
  - Show empty state when no thread is loaded
  - _Requirements: 1.5, 4.5_

- [x] 4.3 Update existing Storybook stories for integration testing






  - Verify PostItem.stories.svelte works with real 5ch data structures
  - Test ThreadToolbar.stories.svelte with ThreadManager mock
  - Ensure ThreadFilters.stories.svelte integrates properly
  - _Requirements: 6.2_

- [x] 5. Register ThreadView in main plugin





  - Add VIEW_TYPE_THREAD constant to constants.ts
  - Register ThreadView in NobitPlugin.onload()
  - Create command "Open Nobit Test Thread" to activate ThreadView
  - Update existing BrowserView or create separate ThreadView registration
  - _Requirements: 8.1, 8.4, 9.1_

- [x] 5.1 Configure hardcoded thread URL for MVP


  - Set specific 5ch thread URL in ThreadManager for initial testing
  - Choose stable, long-running thread for consistent testing
  - Document the hardcoded URL and rationale in code comments
  - _Requirements: 9.2, 9.5_

- [x] 5.2 Write E2E test for MVP functionality






  - Test "Open Nobit Test Thread" command opens ThreadView
  - Mock 5ch network responses using Playwright route interception
  - Verify thread content displays using existing PostItem components
  - Test loading states and error handling
  - Ensure no Svelte components import from 'obsidian' directly
  - _Requirements: 6.3, 6.4, 9.3, 9.4_

- [x] 6. Implement basic error handling and user feedback





  - Add network timeout handling in ThreadManager
  - Implement retry logic for failed requests
  - Create user-friendly error messages in Japanese
  - Add proper logging using existing loglevel infrastructure
  - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [ ]* 6.1 Add integration tests for error scenarios
  - Test network failure handling
  - Test malformed 5ch response parsing
  - Test timeout scenarios
  - Verify error state propagation to UI
  - _Requirements: 6.1, 6.4_

- [x] 7. Final integration and validation





  - Test complete flow: command → ThreadView → 5ch fetch → UI display
  - Verify ThreadManager state changes trigger UI updates correctly
  - Ensure proper cleanup when ThreadView is closed
  - Validate architectural separation (no 'obsidian' imports in Svelte)
  - _Requirements: 2.1, 2.2, 2.5, 9.3, 9.4_

- [x] 7.1 Performance validation and optimization


  - Test with long threads (1000+ posts) using existing components
  - Verify smooth scrolling performance
  - Check memory usage and cleanup
  - Optimize if needed while maintaining architectural principles
  - _Requirements: 3.1, 3.3, 3.4_

- [ ]* 7.2 Complete E2E test suite for MVP
  - Test full user journey from command to thread display
  - Verify integration with existing PostItem, ThreadToolbar components
  - Test error recovery and retry functionality
  - Ensure tests pass consistently with mocked 5ch responses
  - _Requirements: 6.3, 6.4, 6.5_