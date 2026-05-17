<!--
	components/SchoolData.vue

	Updates and renders data relating to the schools in Kansas.

	=== Hooks ===
	OnZoomChange: On zoom in, fades in all schools and allows hovering over
	schools. On zoom out, fades out all schools and disallows hovering over
	schools.

	OnCountyTransition: Fades in those schools whose bbox is inside the viewbox.
	Fades out those schools whose bbox is outside the viewbox.

	Filter: Fades in when checked, fades out when unchecked.
-->

<script setup>
	// External imports
	import {
		defineProps,
		onMounted,
		useTemplateRef,
		defineEmits,
		computed,
		ref,
		inject,
	} from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers.js';
	import { registerKey } from '../utility/RegisterKey.js';
	import { renderCircles } from '@/utility/RenderFunctions.js';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel.js';
	import { GroupType } from '@/enums/GroupType.js';
import { normalizeGeometry } from '@/utility/geometry.js';

	// Define props, template refs, and emits
	const props = defineProps(['properties', 'watchers']);
	const emit = defineEmits(['school-hover']);
	const gRef = useTemplateRef('g');

	// Define reactive variables
	let showPoints = ref(false);
	let zoomState = ref(MapZoomLevel.STATE);

	// Defie non-reactive variables
	const label = 'schools';

	// Register this component
	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Schools',
			defaultStatus: false,
			visibleStates: new Set([MapZoomLevel.COUNTY]),
			groups: [GroupType.OTHER],
			legend: [{ label: 'School', color: 'black', type: 'symbol' }],
			onChecked: onChecked,
			onUnchecked: onUnchecked,
		},
	});

	// Points that represent schools
	let selectionPoints = null;
	let state = null;
	let gTag = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		json: `${props.properties.path}/json`,
		csv: `${props.properties.path}/csv`,
	};

	const getSchoolsPath = () => `${paths.geojson}/KSSchools.geojson`;

	// Fetches starting data on mount.
	onMounted(() => {
		gTag = d3.select(gRef.value);
		selectionPoints = gTag.selectAll('school-point');

		let { features, promise } = getData();
		state = getState(features);

		promise.then(() => {
			render();
		}).catch(error => {
			console.error("Error resolving promise: ", error);
		})
	});

	// Fades out schools at state level.
	// Fades in culled schools at county level.
	hooks.onZoomChange(newZoomState => {
		zoomState.value = newZoomState;
		render();
	});

	// Fades in/out culled selection.
	hooks.onCountyTransition(() => {
		render();
	});

	function getData() {
		const { result, promise } = fetchGeojson(getSchoolsPath());

		const features = computed(() => {
			return result.data.value?.features.map(f => {
				return {
					id: f.properties.OBJECTID,
					geometry: normalizeGeometry(f.geometry),
					data: {
						buildingName: f.properties.bldg_name,
						district: f.properties.org_name,
						orgNumber: f.properties.org_no,
						buildingNumber: f.properties.bldg_no,
						level: f.properties['Building Level'],
						dateOpened: f.properties.Date_Opened,
						homepage: f.properties.homepage_addr,
						address: f.properties.Address,
						city: f.properties.City,
						state: f.properties.State,
						zip: f.properties.Zip
					}
				}
			})
		})

		return {
			features,
			result,
			promise,
		}
	}

	function getState(features) {
		return computed(() => {
			return features.value.map(f => {
				const projectedCoordinates = props.properties.projection(f.geometry.coordinates);
				return {
					id: f.id,
					data: f.data,
					cx: projectedCoordinates[0],
					cy: projectedCoordinates[1],
					r: 0.8,
					opacity: showPoints.value && props.properties.zoomState.value === MapZoomLevel.COUNTY ? 1 : 0,
					pointerEvents: showPoints.value && props.properties.zoomState.value === MapZoomLevel.COUNTY ? 'visible' : 'none',
				}
			})
		})
	}

	function render() {
		selectionPoints = renderCircles(selectionPoints, state, { classStr: 'school-point' })
				.on('mouseenter', handleMouseEnter)
				.on('mouseleave', handleMouseLeave);
	}

	function handleMouseEnter(event, d) {
		if (!showPoints.value) return;
		
		const mousePos = { x: event.clientX, y: event.clientY };

		emit('school-hover', { data: d.data, pos: mousePos });
	}

	function handleMouseLeave() {
		if (!showPoints.value) return;

		emit('school-hover', null);
	}

	/**
	 * Enables or disables hover interactions based on the current map zoom
	 * state, and triggers a fade-in animation for the current selection
	 * 
	 * Specifically:
	 * - Disables hover when zoomed out to the state level
	 * - Enables  hover when zoomed in to the county levle
	 * @returns {void}
	 */
	function onChecked() {
		showPoints.value = true;
		render();
	}

	/**
	 * Disales hover interactions and triggers a fade-out animation for the
	 * current selection.
	 * @returns {void}
	 */
	function onUnchecked() {
		showPoints.value = false;
		render();
	}
</script>
<template>
	<g class="schools" ref="g"></g>
</template>

<style scoped>
	:global(.school-point) {
		fill: #242c34;
		stroke:#d1d5db;
		stroke-width: 0.25;
	}
</style>
