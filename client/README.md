# Client

The client is a single-page application built with Vue and Node.js.

It features a core interactive map, represented by an SVG element in the `BaseMap.vue` component. This map manages multiple independent data components that can hook into changes to the SVG.

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

`BaseMap.vue` provides a register function that any descendant can use by injecting `registerKey` from `./RegisterKey`.

# Development/Production

In development, the client is run as a standalone application. The client should be automatically started upon mounting into the Github Codespace or the Dev Container.

In production, the client will be served to the user when they query the server at a specific endpoint.

## Adding a New Data Component

Follow the steps below to create and integrate a new data component into the map. The goal is to keep all business logic inside the component and leave `BaseMap.vue` unchanged except for registration in the template and import sections.

### 1. Create the Component's File

Create a new `.vue` file using the naming convenction:


    <Name>Data.vue


For example:

    RailroadData.vue
    CityData.vue
    BorderData.vue

### 2. Import Required Utilities

Inside your component, import the required libraries and composables:

```javascript
import * as d3 from 'd3';
import { fetchGeojson, fetchJson } from './fetchers';
import { fadeIn, fadeOut} from '@/d3/transitions/fadeSelection';
```

* d3 is used for DOM manipulation and transitions
* fetchGeojson/fetchJson are usd to retrieve data from the server
* fadeIn/fadeOut are helpers to create fade transition effects

### 3. Register the Component

Each data component must register itself with `BaseMap.vue` to hook into its state changes.

Inject `registerKey`:

```javascript
import { inject } from 'vue';
import { registerKey } from './RegisterKey';

const registerFn = inject(registerKey);
```

Then call it with a unique label:

```javascript
const label = 'railroads';

const hooks = registerFn(label);
```

The label must be unique. Duplicate labels will throw an error. This label is how `BaseMap.vue` tracks the components internally.

You may optionally pass a configuration object (for example, to register a filter). Refer to `RegisterKey.js` or the project wiki for the expected structure.

Example with options:

```javascript
const hooks = registerFn(label, {
    filter: {
        legibleLabel: "Railroads",
        defaultStatus: true,
        visibleStates: new Set([
            MapZoomLevel.STATE,
            MapZoomLevel.COUNtY,
        ]),
        groups: [
            GroupType.INFRASTRUCTURE
        ],
        onChecked: onChecked,
        onUnchecked: onUnchecked,
    },
});
```

Alternatively, since `registerFn` will only be used once, you can call the call to inject to directly access the hooks:

```javascript
import { inject } from 'vue';
import { registerKey } from './RegisterKey';

const hooks = inject(registerKey)(label);
```

The `hooks` object allows a component to react to state changes in `BaseMap.vue`. To call a hook, call the property associated with the state change you want to react to.

For example:

```javascript
hooks.onYearChange((newValue, oldValue, params) => {
    // Do something
});
```

Each time the year slider in `BaseMap.vue` changes, the given anonymouse function will be called. The anonymous function passed will be given three arguments: the new value of the state, the old value of the state, and optional parameters that might be necessary for the component to calculate additional information.

What hooks are available and when each hook is invoked is described in the `HookTypes.js` file and in the project's wiki.

### 4. Render to the SVG

Use d3 to render elements (typically `<path>` elements) directly into the base SVG managed by `BaseMap.vue`.

### Add the Component to `BaseMap.vue`

The only required changes in `BaseMap.vue` are:

1. Import the new component

2. Add it to the template

Example:

```javascript
import RailRoadData from './RailroadData.vue'
...
<svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
    <!--Other Data Components-->
    ...
    <RailroadData :properties="properties" />
<\svg>
```

Components render in the order they appear in the template.

* Components listed later render on top of earlier components.
* To draw above another dataset, place your component below it in the template.