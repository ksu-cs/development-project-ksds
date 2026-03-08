<script setup>
	/**
	 * components/BaseMap.vue
	 *
	 * Contains the base svg element that all geojson data is rendered to.
	 * Calls each Data component to fetch and render geojson data.
	 */

	// External imports
	import {
		defineProps,
		onMounted,
		useTemplateRef,
		ref,
		computed,
		provide,
		watch,
	} from 'vue';
	import * as d3 from 'd3';

	// Component imports
	import RailroadData from './RailroadData.vue';
	import BorderData from './BorderData.vue';
	import CityData from './CityData.vue';
	import TractData from './TractData.vue';
	import SchoolData from './SchoolData.vue';
	import InterstateData from './InterstateData.vue';

	// Utility imports
	import { registerKey } from '../utility/RegisterKey';

	// Enum Imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';
	import { HookType } from '@/enums/HookType';

	// Define props, template refs, and emits
	const props = defineProps(['inputValue', 'statePath']);
	const svgRef = useTemplateRef('svg');

	// Define reactive variables
	let hoveredSchool = ref(null);
	let countyTransition = ref(true);
	let zoomState = ref(MapZoomLevel.STATE);

	// Define non-reactive variables
	const defaultViewBox = '0 0 1600 800';
	let registeredLabels = new Set([]);
	let hookBuckets = {}; // Holds each hook in a bucket [list] with a specific label that coincides with a data component.

	// A list of bucket labels that belong to a predefined group.
	// Used to unhook these labels when that group is toggled off.
	let bucketGroups = {
		[GroupType.INFRASTRUCTURE]: [],
		[GroupType.OTHER]: [],
	};

	let svgTag = null;

	// Each component that registers with a filter option will have an entry in this object
	let filters = {};

	// List of all filters where their visible property is true.
	const visibleFilters = computed(() =>
		Object.values(filters)
			.filter((item) => item.visible.value)
			.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel))
	);

	// Object passed to each data component so they can access properties of the map.
	let properties = {
		inputValue: props.inputValue,
		zoomState: zoomState,
		projection: d3.geoAlbers().scale(14000).translate([1150, 375]),
		bbox: {
			x: 0,
			y: 0,
			width: 1600,
			height: 800,
		},
		path: `/public/${props.statePath}`,
	};

	onMounted(() => {
		svgTag = d3.select(svgRef.value);
	});

	watch(props.inputValue, (newValue, oldValue) => {
		invokeHook(HookType.onYearChange, newValue, oldValue, {});
	});

	/**
	 * Creates an object containing each hook function, seeded with the given label.
	 * @param label The label to seed each hook with
	 */
	function createHooks(label) {
		let hooks = {};

		Object.keys(HookType).forEach((key) => {
			if (Object.hasOwn(hookBuckets, key)) {
				if (Object.hasOwn(hookBuckets[key], label)) {
					if (!Array.isArray(hookBuckets[key][label])) {
						console.error(
							`BaseMap: each value in hookBuckets[key][label] must be an array, found ${typeof hookBuckets[key][label]}`
						);
						return;
					}
				} else {
					hookBuckets[key][label] = [];
				}
			} else {
				hookBuckets[key] = {};
				hookBuckets[key][label] = [];
			}

			hooks[key] = (callbackFn) => {
				hookBuckets[key][label].push(callbackFn);
			};
		});

		return hooks;
	}

	/**
	 *
	 */
	function invokeHook(hookName, newValue, oldValue, params) {
		Object.entries(hookBuckets[hookName]).forEach(([key, fnList]) => {
			if (!(Object.hasOwn(filters, key) && !filters[key].status)) {
				fnList.forEach((fn) => fn(newValue, oldValue, params));
			}
		});
	}

	/** @type {import('../utility/RegisterKey').RegisterFunction} */
	function registerComponent(label, options) {
		// , groups, onChecked, onUnchecked
		// Check if the given label already exists
		if (registeredLabels.has(label)) {
			throw new Error(
				`BaseMap: Component with label '${label}' already exists.`
			);
		}

		registeredLabels.add(label);

		// Check if the component is attempting to register a filter
		if (Object.hasOwn(options, 'filter')) {
			// Validate filter option properties
			if (!Object.hasOwn(options.filter, 'legibleLabel')) {
				throw new Error(
					`BaseMap: 'leigibleLable' for filter does not exist.`
				);
			} else if (!Object.hasOwn(options.filter, 'defaultStatus')) {
				throw new Error(
					`BaseMap: 'defaultStatus' for filter does not exist.`
				);
			} else if (!Object.hasOwn(options.filter, 'visibleStates')) {
				throw new Error(
					`BaseMap: 'visibleStates' for filter does not exist.`
				);
			} else if (!Object.hasOwn(options.filter, 'groups')) {
				throw new Error(`BaseMap: 'groups' for filter does not exist.`);
			} else if (!Object.hasOwn(options.filter, 'onChecked')) {
				throw new Error(
					`BaseMap: 'onChecked' for filter does not exist.`
				);
			} else if (!Object.hasOwn(options.filter, 'onUnchecked')) {
				throw new Error(
					`BaseMap: 'onUnchecked' for filter does not exist.`
				);
			}

			// Register each group from the component
			options.filter.groups.forEach((value) => {
				// Validate group name
				if (!Object.hasOwn(bucketGroups, value)) {
					throw new Error(
						`BaseMap: Group with name '${value}' doesn't exist.`
					);
				}
				console.log(value);
				bucketGroups[value].push(label);
			});

			console.log(filters);

			filters[label] = {
				displayLabel: options.filter.legibleLabel,
				status: options.filter.defaultStatus,
				statusRef: ref(options.filter.defaultStatus),
				visible: computed(() =>
					options.filter.visibleStates.has(zoomState.value)
				),
				onChecked: options.filter.onChecked,
				onUnchecked: options.filter.onUnchecked,
			};
		}

		return createHooks(label);
	}

	provide(registerKey, registerComponent);

	/**
	 * Changes zoomState to zoomLevel, and transitions into
	 * the given viewBox.
	 * @param zoomLevel The new zoomState as a string
	 * @param viewBox the viewBox to transition to
	 */
	function changeZoomLevel(zoomLevel, viewBox) {
		svgTag
			.transition()
			.duration(750)
			.attr('viewBox', viewBox)
			.on('end', () => {
				invokeHook(
					HookType.onZoomChange,
					zoomLevel,
					zoomState.value,
					{}
				);
				zoomState.value = zoomLevel;
			});
	}

	/**
	 * Transitions the viewBox from where it is, to
	 * somewere else.
	 * @param type placeolder, for when different types of transitions are needed
	 * @param boxString the bounding box of the clicked on county as a string, will be replaced by a single object later
	 * @param bbox the bounding box object of the clicked on county, will be replaced by a single object later
	 */
	function onTransition(type, boxString, bbox) {
		if (boxString === svgTag.attr('viewBox')) {
			properties.bbox = {
				x: 0,
				y: 0,
				width: 1600,
				height: 800,
			};
			changeZoomLevel('state', defaultViewBox);
		} else {
			properties.bbox = bbox;
			changeZoomLevel('county', boxString);
			invokeHook(
				HookType.onCountyTransition,
				!countyTransition.value,
				countyTransition.value,
				{}
			);
			countyTransition.value = !countyTransition.value;
		}
	}

	/**
	 * Updates the checked state of a data components filter when it becomes checked/unchecked
	 * @param event The click event that triggered this function call
	 * @param item The entry in the filters object that corresponds to its data component.
	 */
	function onFilterClicked(event, item) {
		if (event.target.checked) {
			item.onChecked();
		} else {
			item.onUnchecked();
		}

		item.status = event.target.checked;
		item.statusRef.value = item.status;
	}
</script>

<template>
	<div class="container">
		<svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
			<!--
                All components that render to the svg go here.
                A component will be drawn over all components above it.
            -->
			<RailroadData :properties="properties" />
			<BorderData :properties="properties" @transition="onTransition" />
			<TractData :properties="properties" />
			<CityData :properties="properties" />
			<SchoolData
				:properties="properties"
				@school-hover="hoveredSchool = $event"
			/>
			<InterstateData :properties="properties" />
		</svg>

		<!--
            This Transition Group represents a list of filters
            Whenever a filter becomes visible, it fades in and slides into position
            Whenever a filter becomes invisible, it fades out and slides out of position
        -->
		<TransitionGroup class="test" name="filters" tag="ul">
			<li
				class="filter"
				v-for="item in visibleFilters"
				:key="item.displayLabel"
			>
				<input
					type="checkbox"
					:checked="item.status"
					@click="onFilterClicked($event, item)"
				/>
				{{ item.displayLabel }}
			</li>
		</TransitionGroup>
		<div
			class="school-info-box"
			v-if="hoveredSchool"
			:style="{
				left: hoveredSchool.pos.x + 15 + 'px',
				top: hoveredSchool.pos.y + 15 + 'px',
			}"
		>
			<h3>{{ hoveredSchool.props.bldg_name }}</h3>
			<p>
				<strong>District:</strong>
				{{ hoveredSchool.props.org_name }} ({{
					hoveredSchool.props.org_no
				}})
			</p>
			<p>
				<strong>Building No:</strong> {{ hoveredSchool.props.bldg_no }}
			</p>
			<p>
				<strong>Level:</strong>
				{{ hoveredSchool.props['Buildng Level'] }}
			</p>
			<p>
				<strong>Opened:</strong> {{ hoveredSchool.props.Date_Opened }}
			</p>
			<p>
				<strong>Homepage:</strong>
				{{ hoveredSchool.props.homepage_addr }}
			</p>
			<p>
				<strong>Address:</strong> {{ hoveredSchool.props.Address }},
				{{ hoveredSchool.props.City }}, {{ hoveredSchool.props.State }}
				{{ hoveredSchool.props.Zip }}
			</p>
		</div>
	</div>
</template>

<style scoped>
	.container {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.column {
		display: flex;
		flex-direction: column;
	}

	.test {
		position: relative;
		padding: 0;
		list-style-type: none;
	}

	.filter {
		width: 100%;
		height: 30px;
	}

	.school-info-box {
		position: fixed;
		background: white;
		padding: 10px 14px;
		border: 1px solid #888;
		border-radius: 6px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		z-index: 9999;
		pointer-events: none;
		font-size: 13px;
		max-width: 250px;
	}

	.filters-move,
	.filters-enter-active,
	.filters-leave-active {
		transition: all 0.5s ease;
	}

	.filters-enter-from,
	.filters-leave-to {
		opacity: 0%;
		transform: translateX(30px);
	}

	.filters-leave-active {
		position: absolute;
	}
</style>
