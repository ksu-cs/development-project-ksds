/*
 * components/RegisterKey.js
 *
 * This file enables type hinting for the injected register function
 * by associating it with a specific symbol.
*/

/**
 * 
 * @callback HookCallBack
 * @param newValue The new state of the value hooked into
 * @param oldValue The old state of the value hooked into
 * @param params Additional properties passed to specific hooks
 * @returns {void}
 */

/**
 * Function declaration for each hook that createHooks returns.
 * @typedef {Object} HookObject
 * @property {(value: HookCallBack) => void} onZoomChange - Description.
 * @property {(value: HookCallBack) => void} onYearChange - Description.
 * @property {(value: HookCallBack) => void} onCountyTransition - Description.
 */

/**
 * The options for registering a filter for a component.
 * @typedef {Object} FilterOptions
 * @property {string} legibleLabel A label to be displayed to the user
 * @property {boolean} defaultStatus Whether the filter should start checked or unchecked.
 * @property {Set.<String>} visibleStates Set of all states for which the filter should appear
 * @property {string[]} groups List of all groups to register as (leave empty if none)
 * @property {(value: HookCallBack) => void} onChecked Callback for when the registered filter becomes checked
 * @property {(value: HookCallBack) => void} onUnchecked Callback for when the registered filter becomes unchecked
 */

/**
 * 
 * @typedef {Object} RegisterOptions
 * @property {FilterOptions} filter Object containing the options to register a filter for this component.
 */

/**
 * 
 * @callback RegisterFunction
 * @param label The strig the data component wants to register as (throws error if already taken by another component)
 * @param {RegisterOptions} options All options to register
 * @returns {HookObject}
 */

/**
 * @type {import('vue').InjectionKey<RegisterFunction>}
*/
export const registerKey = Symbol('register');