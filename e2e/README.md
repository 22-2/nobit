# E2E Testing

This directory contains end-to-end tests for the Obsidian plugin using Playwright.

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run a specific test file
pnpm test:e2e:example

# Run with debug output
pnpm test:e2e:debug
```

## Manual Testing Mode

For manual exploration and testing, you can launch Obsidian with the plugin already installed:

```bash
# Launch with plugin in a new vault
pnpm manual

# Launch in sandbox mode (shared vault for faster startup)
pnpm manual:sandbox
```

The manual mode will:
- ✅ Launch Obsidian with your plugin pre-installed
- ✅ Enable the plugin automatically
- ✅ Keep the window open for manual interaction
- ✅ Use the same setup as E2E tests for consistency

Press `Ctrl+C` to exit when you're done testing.

### Use Cases for Manual Mode

- 🔍 Explore plugin behavior interactively
- 🐛 Debug issues that are hard to reproduce in automated tests
- 🎨 Test UI/UX manually before writing automated tests
- 📸 Take screenshots or record videos for documentation

## Test Structure

- `specs/` - Test specifications
- `helpers/` - Test utilities and page objects
- `setup/` - Test environment setup
- `manual.ts` - Manual testing script

## Writing Tests

See the [obsidian-testing-toolkit documentation](../obsidian-testing-toolkit/docs/README.md) for detailed information on writing tests.
