# Unit Testing Guidelines

This document outlines the conventions and requirements for writing unit tests in this repository. The goal is to ensure tests are consistent and maintainable.

All frontend unit tests use:

* Vitest
* Vue Test Utils
* Node environment

If you want to expand the suite of testing utilities, add them to the above list, preferably after consulting your teammates.

## Test File Naming Convention

All unit test files should follow this convention:


    <Name>.test.js


Examples:

    BorderData.test.js
    CityData.test.js
    fetchers.test.js

Tests should be placed into the dedicated `__tests__` directory in the client, which is located inside the `src/` directory.

## Test Structure

### Arrange / Act / Assert / Cleanup pattern

|Step|Purpose|
|----|-------|
|Arrange|Setup data, mocks, and components|
|Act|Trigger the behavior|
|Assert|Verify the expected result|
|Cleanup|Ensure further testing is not influenced by this test|

## Mocking Fetches

All API calls using `fetch` must be mocked.

Example:

```javascript
beforeEach(() => {
    global.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData),
        })
    })
})
```

After each test, mocks must be restored:

```javascript
afterEach(() => {
    vi.restoreAllMocks();
})
```

This ensures that no external dependencies can influence test results (for example, if the server is unavailable).

## Mocking SVG `getBBox`

In the test environment, `SVGElement` doesn't have a `getBBox` function, so we must create a mock implementation for those components that rely on it.

Example:

```javascript
beforeEach(() => {
    SVGElement.prototype.getBBox = vi.fn(() => {
        return {
            x: 0,
            y: 0,
            width: 1600,
            height: 800,
        }
    })
})
```

## Fixtures and Mock Data

Reusable test data should be stored in fixtures.

All mock data in the client is stored in

    src/__tests__/mock-data/

## Snapshot Testing

Snapshot tests are used to verify rendered output.

Example:

```javascript
expect(gEl.outerHTML).toMatchSnapshot();
```

These are useful for ensuring data is rendered the same way across changes.

All snapshots are automatically stored in

    src/__tests__/__snapshots__/

## Component Mounting

Generally, data components should be mounted using:

```javascript
import { mount } from '@vue/test-utils';
```

Data components typically do not have (and likely should not have) child components.

If a component depends on:

* Global providers
* Composables
* Props

These dependencies should be mocked during mounting.

## Async Rendering

Vue updates the DOM asynchronously.

All tests must wait for updates before asserting.

Example:

```javascript
await wrapper.vm.$nextTick();
```

Multiple updates may require multiple ticks. Currently, the data components appear to fully render after four ticks.

```javascript
await wrapper.vm.$nextTick();
await wrapper.vm.$nextTick();
await wrapper.vm.$nextTick();
await wrapper.vm.$nextTick();
```

A helper function for handling this may be introduced in the future.

## Coverage

Unit tests should prioritize:

* Component logic
* Conditional rendering
* Event handling

Currently, all data components should use snapshots to ensure rendered output stays consistent.