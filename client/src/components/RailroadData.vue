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
	import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility Imports
	import { fetchGeojson } from '../utility/fetchers';
	import { fadeOut } from '@/d3/transitions/fadeSelection';
	import { createTransition } from '@/d3/transitions/createTransition';
	import { registerKey } from '../utility/RegisterKey';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const label = 'railroads';

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

	let selection = null;
	let gTag = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		csv: `${props.properties.path}/csv`,
	};

	// Fetch starting data on mount.
	onMounted(() => {
		gTag = d3.select(gRef.value);
		let { result } = fetchGeojson(`${paths.geojson}/railroads.geojson`);
		renderToSVG(result);
	});

	// Change width of railroads on zoom change.
	hooks.onZoomChange((newValue) => {
		switch (newValue) {
			case 'state':
				createTransition(selection).attr('stroke-width', 1);
				break;
			case 'county':
				createTransition(selection).attr('stroke-width', 0.6);
				break;
		}
	});

	// Fade in/out railroads based on whether they were constructed by the given
	// year.
	hooks.onYearChange((newValue) => {
		createTransition(selection).attr('opacity', (d) =>
			d.properties.InOpBy <= newValue ? '100%' : '0%'
		);
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed,
	 * prints the error received. Populates selection by binding
	 * the data to path elements.
	 * @param r The object that holds the data, loading, and error properties
	 */
	function renderToSVG(r) {
		let d = r.data.value;
		let l = r.loading.value;
		let e = r.error.value;

		if (l) {
			// If data is still loading
			const unwatch = watch(
				() => r.loading.value,
				() => {
					renderToSVG(r);
					unwatch();
				}
			);
			return;
		} else if (e) {
			// If there was an error
			console.error(e);
			return;
		}

		// Create rail path elements
		selection = gTag
			.selectAll('.rail')
			.data(d.features)
			.join(
				(enter) =>
					enter
						.append('path')
						.attr('d', pathGen)
						.attr('opacity', (d) =>
							d.properties.InOpBy <=
							props.properties.inputValue.value
								? '100%'
								: '0%'
						)
						.attr('stroke-width', 1)
						.classed('rail', true),
				(update) => update,
				(exit) => fadeOut(exit).remove()
			);
	}

	/**
	 * Fades in all railroads that were in operation by the current year.
	 */
	function onChecked() {
		createTransition(selection).attr('opacity', (d) =>
			d.properties.InOpBy <= props.properties.inputValue.value
				? '100%'
				: '0%'
		);
	}

	/**
	 * Fades out all railroads.
	 */
	function onUnchecked() {
		fadeOut(selection);
	}
</script>

<template>
	<g class="railroads" ref="g"></g>
</template>

<style scoped>
	:global(.rail) {
		fill: none;
		stroke: green;
		pointer-events: none;
		stroke-dasharray: 4;
		stroke-linecap: round;
	}
</style>
