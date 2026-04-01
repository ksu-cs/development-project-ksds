<!--
	components/TractData.vue

	Updates and renders data related to county tract data in Kansas

	=== Hooks ===
	OnZoomChange: On zoom out, fade out all tracts that lie within the viewbox.
	Fade in is handled by OnCountyTransition.

	OnCountyTransition: Fade out all tracts currently visible. Fade in all
	tracts that lie within the viewbox.

	Filter: Fade in when checked, fade out when unchecked.
-->

<script setup>
	// External imports
	import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers';
	import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection';
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
	const label = 'tracts';

	// Register this component
	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Tracts',
			defaultStatus: false,
			visibleStates: new Set([MapZoomLevel.COUNTY]),
			groups: [GroupType.OTHER],
			onChecked: onChecked,
			onUnchecked: onUnchecked,
		},
	});

	let opacity = '0%';
	let selection = null;
	let culledSelection = null;
	let gTag = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		csv: `${props.properties.path}/csv`,
	};

	// Fetches starting data on mount.
	onMounted(() => {
		gTag = d3.select(gRef.value);
		let { result } = fetchGeojson(`${paths.geojson}/KSTracts_2000.geojson`);
		renderToSVG(result);
	});

	// Fades out the culled selection on zoom out to state.
	hooks.onZoomChange((newValue) => {
		switch (newValue) {
			case MapZoomLevel.STATE:
				opacity = '0%';
				culledSelection
					.transition()
					.duration(200)
					.attr('opacity', opacity);
				break;
			case MapZoomLevel.COUNTY:
				// Do nothing
				break;
		}
	});

	// Culls the selection by the current bounding box.
	// Fades in the culled selection.
	hooks.onCountyTransition(() => {
		// Fade out last selection
		fadeOut(culledSelection);

		// Cull selection
		culledSelection = selection.filter((d, i, n) => {
			let nodeBBox = n[i].getBBox();
			return boxOverlapsBox(nodeBBox, props.properties.bbox);
		});

		// Fade in new selection
		fadeIn(culledSelection);
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed,
	 * prints the error recieved. Populates selection by binding
	 * the data to path elements.
	 * @param r The object that holds the data, loading, and error properties
	 */
	function renderToSVG(r) {
		let d = r.data.value;
		let l = r.loading.value;
		let e = r.error.value;

		if (l) {
			// If data is still loading
			// Watch for the data to load
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

		// Create tract path elements bound to data.
		selection = gTag
			.selectAll('.tract')
			.data(d.features)
			.enter()
			.append('path')
			.attr('d', (d) => {
				d.geometry.coordinates[0].reverse();
				return pathGen(d);
			})
			.attr('opacity', '0')
			.classed('tract', true);

		culledSelection = selection.filter(() => true);

		switch (props.properties.zoomState.value) {
			case 'state': // Do nothing
				break;
			case 'county':
				// Cull selection
				culledSelection = selection.filter((d, i, n) => {
					let nodeBBox = n[i].getBBox();
					return boxOverlapsBox(nodeBBox, props.properties.bbox);
				});
				fadeIn(culledSelection);
				break;
		}
	}

	/**
	 * Returns true if both given bounding boxes overlap.
	 * Two boxes overlap if they intersect on both the x and y axes.
	 * 
	 * - Should rewrite in a simpler way later.
	 * @param box One of the bounding boxes to check
	 * @param otherBox The other bounding box to check
	 * @returns {boolean} True if the boxes overlap; otherwise false
	 */
	function boxOverlapsBox(box, otherBox) {
		return (
			((box.x >= otherBox.x && box.x <= otherBox.x + otherBox.width) ||
				(box.x + box.width >= otherBox.x &&
					box.x + box.width <= otherBox.x + otherBox.width)) &&
			((box.y >= otherBox.y && box.y <= otherBox.y + otherBox.height) ||
				(box.y + box.height >= otherBox.y &&
					box.y + box.height <= otherBox.y + otherBox.height))
		);
	}

	/**
	 * When zoomed to the county level, filters the current selection to only
	 * include elements whose bounding boxes overlap with the active bounding
	 * box. The resulting culled selection is faded in.
	 * @returns {void}
	 */
	function onChecked() {
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				// Do nothing
				break;
			case MapZoomLevel.COUNTY:
				// Cull selection
				culledSelection = selection.filter((d, i, n) => {
					let nodeBBox = n[i].getBBox();
					return boxOverlapsBox(nodeBBox, props.properties.bbox);
				});

				fadeIn(culledSelection);
				break;
		}
	}

	/**
	 * When zoomed to the county level, this function fades out the previously
	 * culled selection.
	 */
	function onUnchecked() {
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				// Do nothing
				break;
			case MapZoomLevel.COUNTY:
				fadeOut(culledSelection);
				break;
		}
	}
</script>

<template>
	<g class="tracts" ref="g"></g>
</template>

<style scoped>
	:global(.tract) {
		fill: none;
		stroke: #ff000d;
		stroke-width: 0.2;
		pointer-events: none;
		stroke-dasharray: 0.5 2;
		stroke-linecap: round;
	}
</style>
