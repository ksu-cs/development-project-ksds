<!--
	components/RailroadData.vue

	Updates and renders data relating to the railroads in Kansas

	=== Hooks ===
	OnZoomChange: On zoom in, widens the width of the railroads. On zoom out,
	thins the width of the railroads.

	OnYearChange: Fades in all railroads that were constructed by the given
	year. Fades out all railroads that were not constructed by the given year.
	
	Filter: Fades in when checked, fades out when unchecked.
-->

<script setup>
	// External imports
	import { defineProps, onMounted, useTemplateRef, ref, computed, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility Imports
	import { fetchGeojson } from '../utility/fetchers';
	import { registerKey } from '../utility/RegisterKey';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';
	import { normalizeGeometry } from '@/utility/geometry';
import { renderLineStrings } from '@/utility/RenderFunctions';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const gRef = useTemplateRef('g');

	// Define reactive variables
	let showLines = ref(true);
	let zoomState = ref(MapZoomLevel.STATE);
	let yearValue = ref(1860);

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const fadeDuration = 500;
	const label = 'railroads';
	let selection = null;
	let state = null;
	let gTag = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		csv: `${props.properties.path}/csv`,
	};

	// Register this component
	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Railroads',
			defaultStatus: true,
			visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
			groups: [GroupType.INFRASTRUCTURE],
			legend: [{ label: 'Railroad', color: 'green', type: 'line' }],
			onChecked: onChecked,
			onUnchecked: onUnchecked,
		},
	});

	const getRailroadPath = () =>`${paths.geojson}/railroads.geojson`;

	// Fetch starting data on mount.
	onMounted(() => {
		gTag = d3.select(gRef.value);
		selection = gTag.selectAll('.railroads');

		let { features, promise } = getData();
		state = getState(features);

		promise.then(() => {
			render();
		}).catch(error => {
			console.error("Error fetching border data: ", error);
		});
	});

	// Change width of railroads on zoom change.
	hooks.onZoomChange((newZoomState) => {
		zoomState.value = newZoomState;
		render();
	});

	// Fade in/out railroads based on whether they were constructed by the given
	// year.
	hooks.onYearChange(newYear => {
		yearValue.value = newYear;
		render();
	});

	function getData() {
		const { result, promise } = fetchGeojson(getRailroadPath());

		const features = computed(() => {
			return result.data.value?.features.map(f => {
				return {
					id: f.properties.FID,
					geometry: normalizeGeometry(f.geometry),
					inOperationBy: f.properties.InOpBy,
				};
			})
		});

		return {
			features,
			result,
			promise,
		}
	}

	function getState(features) {
		return computed(() => {
			return features.value.map(f => {
				return {
					id: f.id,
					path: pathGen(f.geometry),
					strokeWidth: zoomState.value === MapZoomLevel.STATE ? 1 : 0.6,
					opacity: showLines.value && f.inOperationBy <= yearValue.value ? 1 : 0,
					pointerEvents: 'none',
				}
			})
		})
	}

	function render() {
		selection = renderLineStrings(selection, state, { duration: fadeDuration, classStr: 'rail' })
	}

	/**
	 * Fades in all railroads that were in operation by the current year.
	 */
	function onChecked() {
		showLines.value = true;
		render();
	}

	/**
	 * Fades out all railroads.
	 */
	function onUnchecked() {
		showLines.value = false;
		render();
	}
</script>

<template>
	<g class="railroads" ref="g"></g>
</template>

<style scoped>
	:global(.rail) {
		fill: none;
		stroke: green;
		stroke-dasharray: 4;
		stroke-linecap: round;
	}
</style>
