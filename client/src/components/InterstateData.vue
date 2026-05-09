<!--
	components/InterstateData.vue

	Renders and upates data relating to the Interstate Highways in Kansas

	=== Hooks ===
	OnZoomChange: On zoom in, widens the width of the interstate highways. On
	zoom out, thins the width of the interstate highways.

	OnYearChange: Fades in all interstate highways that were constructed by
	the given year. Fades out all interstate highways that have yet to be
	constructed by the given year.

	Filter: Fades in when checked, fades out when unchecked.
-->

<script setup>
	// External imports
	import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers';
	import { fadeOut } from '@/d3/transitions/fadeSelection';
	import { createTransition } from '@/d3/transitions/createTransition';
	import { registerKey } from '../utility/RegisterKey';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	// Define props, template refs, and emits
	const props = defineProps(['properties', 'watchers', 'filters']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const label = 'interstates';

	// Register this component
	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Interstates',
			defaultStatus: true,
			visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
			groups: [GroupType.INFRASTRUCTURE],
			legend: [{ label: 'Interstate', color: '#1f77b4', type: 'line' }],
			onChecked: onChecked,
			onUnchecked: onUnchecked,
		},
	});

	// Polylines that represent highways
	let selection = null;
	let gTag = null;

	let paths = {
		geojson: `${props.properties.path}/geojson`,
		csv: `${props.properties.path}/csv`,
	};

	onMounted(() => {
		gTag = d3.select(gRef.value);
		const { result } = fetchGeojson(
			`${paths.geojson}/KS_Interstate_Lines.geojson`
		);
		renderToSVG(result);
	});

	// Change width of interstate on zoom change.
	hooks.onZoomChange((newValue) => {
		if (!selection) return;

		switch (newValue) {
			case 'state':
				createTransition(selection).attr('stroke-width', 1.2);
				break;
			case 'county':
				createTransition(selection).attr('stroke-width', 0.8);
				break;
		}
	});

	// Fade in appropriate interstates on year change.
	hooks.onYearChange((newValue) => {
		applyVisibility(newValue);
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed, prints the error
	 *  received. Populates selection by binding the data to path elements.
	 * @param r The object that holds the data, loading, and error
	 * properties
	 */
	function renderToSVG(r) {
		const d = r.data.value;
		const l = r.loading.value;
		const e = r.error.value;

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
		}
		if (e) {
			// If there was an error
			console.error(e);
			return;
		}

		selection = gTag
			.selectAll('.interstate')
			.data(d.features, (f) => f.id ?? f.properties?.FID)
			.join(
				(enter) =>
					enter
						.append('path')
						// Works for LineString and MultiLineString
						.attr('d', pathGen)
						.attr('stroke-width', 1.2)
						.attr('opacity', '0%')
						.classed('interstate', true),
				(update) => update,
				(exit) => fadeOut(exit).remove()
			);

		applyVisibility(props.properties.inputValue.value);
	}

	/**
	 * Fades in all interstate constructed by the given year and fades out all
	 * interstate not constructed by the given year.
	 * @param currentYear The year to base visiblity on.
	 */
	function applyVisibility(currentYear) {
		if (!selection) return;

		// Checkbox on => show segments open by currentYear
		createTransition(selection).attr('opacity', (f) => {
			const openYear = +f.properties?.year_open;
			if (!Number.isFinite(openYear)) return '0%';
			return openYear <= currentYear ? '100%' : '0%';
		});
	}

	/**
	 * Sets interstate width based on zoom state and fades in all appropriate
	 * interstates.
	 */
	function onChecked() {
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				selection.attr('stroke-width', 1.2);
				break;
			case MapZoomLevel.COUNTY:
				selection.attr('stroke-width', 0.8);
				break;
		}
		applyVisibility(props.properties.inputValue.value);
	}

	/**
	 * Fade out all interstates.
	 */
	function onUnchecked() {
		fadeOut(selection);
	}
</script>

<template>
	<g class="interstates" ref="g"></g>
</template>

<style scoped>
	:global(.interstate) {
		fill: none;
		stroke: #4f81bd;
		stroke-width: 1.8;

		pointer-events: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
