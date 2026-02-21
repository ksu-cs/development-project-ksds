/*
 * components/RegisterKey.js
 *
 * Provides a strongly-typed Vue InjectionKey for registering data components
 * with the BaseMap component.
 * 
 * A RegisterFunction allows a component to :
 *  - Register itself under a unique label
 *  - Optionally register a UI filter
 *  - Hook into changes in the BaseMap's state
*/

/**
 * Callback signature used by all hooks.
 * @callback HookCallback
 * @param {*} newValue The updated value after the change.
 * @param {*} oldValue The previous value before the change.
 * @param {Object} [params] Optional contextual parameters provided by the hook.
 * @returns {void}
 */

/**
 * Collection of hooks returned after a component successfully registers itself.
 * 
 * These methods allow components to hook into changes in the BaseMap's state.
 * 
 * @typedef {Object} HookObject
 * 
 * @property {(value: HookCallback) => void} onZoomChange
 * Registers a hook for when the map zoom level changes.
 * 
 * @property {(value: HookCallback) => void} onYearChange
 * Registers a hook for when the selected year changes.
 * 
 * @property {(value: HookCallback) => void} onCountyTransition
 * Registers a hook for when the selected county changes.
 */

/**
 * Configuration for registering a UI filter associated with a data component.
 * 
 * @typedef {Object} FilterOptions
 * 
 * @property {string} legibleLabel
 * Human-readable label displayed in the UI.
 * 
 * @property {boolean} defaultStatus
 * Whether the filter starts enabled (true) or disabled (false).
 * 
 * @property {Set<String>} visibleStates
 * Set of all map zoom level states in which this filter should be visible.
 * 
 * @property {string[]} groups
 * Logical grouping identifiers for organizing filters in the UI.
 * Leave empty if no grouping is required.
 * 
 * @property {(value: HookCallback) => void} onChecked
 * Registers a callback triggered when the filter becomes checked.
 * 
 * @property {(value: HookCallback) => void} onUnchecked
 * Registers a callback triggered when the filter becomes unchecked.
 */

/**
 * Optional configuration passed when registering a component.
 * 
 * @typedef {Object} RegisterOptions
 * 
 * @property {FilterOptions} [filter]
 * Optional filter configuration if the component should expose a toggleable
 * filter in the UI.
 */

/**
 * The main registration function injected into components.
 * 
 * Each component must register using a unique label.
 * An error is thrown if the label is already registered.
 * 
 * Once registered, the function returns a HookObject, allowing the component
 * to hook into changes to the BaseMap's state.
 * 
 * @callback RegisterFunction
 * 
 * @param label
 * The unique identifier for this component.
 * 
 * @param {RegisterOptions} options
 * Optional configuration incluiding:
 *  - filter registration
 * 
 * @returns {HookObject}
 */

/**
 * Vue InjectionKey for accessing the global register function.
 * 
 * Components must inject this key to gain access to the register function.
 * 
 * @type {import('vue').InjectionKey<RegisterFunction>}
*/
export const registerKey = Symbol('register');