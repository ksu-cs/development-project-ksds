<!--
	components/BorderData.vue

	Renders and updates data relating to the county borders of Kasnas.

	=== Hooks ===
	OnYearChange: Fetches border data from the server corresponding to
	the new year and renders it.

	OnZoomChange: Widens the width of rendered borders on Zoom in. Thins
	them on zoom out.

	Doesn't register a filter for borders, user shouldn't be able to disable
	this data.

	Registers a filter for the heatmap.
-->

<script setup>
	// External imports
	import {
		defineProps,
		onMounted,
		useTemplateRef,
		defineEmits,
		inject,
	} from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers';
	import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection';
	import { createTransition } from '@/d3/transitions/createTransition';
	import { applyChoropleth } from '@/utility/RenderFunctions';
	import { FetchQueue } from '../utility/FetchQueue';
	import { registerKey } from '../utility/RegisterKey';

	// Enum impports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const emit = defineEmits(['transition']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

	// Define non-reactive variables
	let rerenderHeatMap = 0;
	const pathGen = d3.geoPath(props.properties.projection);
	const queue = new FetchQueue();
	const fadeDuration = 500;
	const borderLabel = 'county-borders';
	const popLabel = 'county-pop';
	const fillOpacity = '100%';
	const lightColor = { r: 198, g: 219, b: 239 } // light blue
	const darkColor = { r: 8, g: 48, b: 108 } // dark blue
	const invalidColor = { r: 240, g: 240, b: 240} // light gray

	// Register this component
	const borderHooks = inject(registerKey)(borderLabel, {});
	const popHooks = inject(registerKey)(popLabel, {
		filter: {
			legibleLabel: "County Pop Heat Map",
			defaultStatus: false,
			visibleStates: new Set([MapZoomLevel.STATE]),
			groups: [GroupType.OTHER],
			onChecked: displayHeatMap,
			onUnchecked: hideHeatMap,
		},
	})


	// Polylines that represent each county border
	let selection = null;
	let gTag = null;
	let strokeWidth = 2;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		json: `${props.properties.path}/json`,
		csv: `${props.properties.path}/csv`,
	};

	onMounted(() => {
		gTag = d3.select(gRef.value);
		let { result, promise } = fetchGeojson(
			`${paths.geojson}/KSCounty_1860_GeoJSON.geojson`
		);
		queue.enqueue(promise, result, renderToSVG);
	});

	// Change width of borders on zoom change.
	borderHooks.onZoomChange((newValue) => {
		switch (newValue) {
			case MapZoomLevel.STATE:
				strokeWidth = 2;
				createTransition(selection).attr('stroke-width', strokeWidth);
				break;
			case MapZoomLevel.COUNTY:
				strokeWidth = 1;
				createTransition(selection).attr('stroke-width', strokeWidth);
				break;
		}
	});

	// Turn on/off the heat map on zoom change.
	popHooks.onZoomChange((newValue) => {
		switch (newValue) {
			case MapZoomLevel.STATE:
				displayHeatMap();
				break;
			case MapZoomLevel.COUNTY:
				hideHeatMap();
				break;
		}
	})

	// Fetch data on year change.
	borderHooks.onYearChange((newValue) => {
		let { result, promise } = fetchGeojson(
			`${paths.geojson}/KSCounty_${newValue}_GeoJSON.geojson`
		);
		queue.enqueue(promise, result, renderToSVG);
	});

	// Ensure the heat map is rerendered on year change as well.
	// rerenderHeatMap is checked in renderToSVG
	popHooks.onYearChange(() => {
		if (props.properties.zoomState.value == MapZoomLevel.STATE) {
			rerenderHeatMap += 1;
		}
	})

	/**
	 * Waits for the fetched data to load. If the fetch failed, prints the error
	 *  received. Populates selection by binding the data to path elements.
	 * @param r The object that holds the data, loading, and error
	 * properties
	 */
	function renderToSVG(r) {
		let d = r.data.value;
		let e = r.error.value;

		// Data should always have loaded since we're using the fetchqueue

		if (e) {
			// If there was an error
			console.error(e);
			return;
		}

		// Join border paths:
		// Enter selection -> create paths, style them,
		// add onClick handlers, fade in
		// Update seleciton -> do nothing
		// Exit selection -> fade out, then remove

		selection = gTag
			.selectAll('.border')
			.data(d.features, (d) => d.properties.id)
			.join(
				(enter) => {
					let s = enter
						.append('path')
						.attr('d', (d) => {
							// d3 expects the reverse winding order that geojson uses
							d.geometry.coordinates[0].reverse();
							return pathGen(d);
						})
						.attr('stroke', 'black')
						.attr('stroke-width', strokeWidth)
						.attr('opacity', '0%')
						.attr('fill-opacity', '0%')
						.classed('border', true)
						.call(applyChoropleth, lightColor, darkColor, invalidColor)
						.on('click', onBorderClick);
					
					// Only render the heat map for new data if the filter is
					// checked
					if (rerenderHeatMap > 0) {
						s = s.attr('fill-opacity', fillOpacity);
						rerenderHeatMap -= 1;
					}

					fadeIn(s, { duration: fadeDuration })

					return s;
				},
				(update) => update,
				(exit) => fadeOut(exit, { duration: fadeDuration }).remove()
			);
	}

	/**
	 * Emits a transition event to BaseMap with the the parameters "border", and
	 * the bounding box of the border clicked on.
	 * @param event The click event
	 */
	function onBorderClick(event) {
		const bbox = event.target.getBBox();
		const boxString =
			String(bbox.x - 10) +
			' ' +
			String(bbox.y - 10) +
			' ' +
			String(bbox.width + 20) +
			' ' +
			String(bbox.height + 20);
		emit('transition', 'border', boxString, bbox);
	}

	/**
	 * Sets the fill and fill-opacity for each county correpsonding to their
	 * population (normalized)
	 */
	function displayHeatMap() {
		createTransition(selection)
			.attr('fill-opacity', fillOpacity);
	}

	/**
	 * Sets the fill-opacity for all borders to '0%'.
	 */
	function hideHeatMap() {
		createTransition(selection)
			.attr("fill-opacity", "0%");
	}
</script>

<template>
	<g class="border" ref="g"></g>
</template>

<style scoped>
	:global(.border) {
		fill-rule: evenodd;
		pointer-events: all;
	}
</style>
