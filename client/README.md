# Client

The client is a single-page application built with Vue and Node.js.

It features a core interactive map, represented by an SVG element in the `BaseMap.vue` component. This map manages multilpe independent data components that can hook into changes to the SVG.

The client is intended to be highly modular, allowing new data components to be added without modifying the core map logic, or the logic of other data components.

## Architecture

### BaseMap.Vue

`BaseMap.vue` is the central component of the application as it manages the base SVG that all data components render to.

This component is responsible for the state of the base SVG that represents the interactive map of Kansas. These include, but are not limited to, managing the SVG's viewBox, pan/zoom, etc. A set of hooks into this component's state changes are exposed to each data component so that they can interact with the map.

This component should not depend on the structure of any data that renders to it, nor should it store this data anywhere. The business logic of all data should stay within the relevant data component.

One exception to this is the dislpay of tool tip content, which may be passed up to the `BaseMap.vue` component strictly for presentation purposes, no data processing should be done by `BaseMap.vue`

### Data Components

Each data component represents a specific dataset such as railroads, towns, and boundaries.

A data component is fully responsible for its own data. It should decide how it's data is loaded, how it's rendered into SVG elements (typically one or more path elements are preferred), and how it changes in response to changes to the map. It may invoke any number of hooks provided by `BaseMap.vue` or none at all if they aren't required.

### Hooks

`BaseMap.vue` passes a prop containing hooks down to each data component.

# Development/Production

In development, the client is run as a standalone application. The client should be automatically started upon mounting into the Github Codespace or the Dev Container.

In production, the client will be served to the user when they query the server at a specific endpoint.

## Adding a New Data Component

