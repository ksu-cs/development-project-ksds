<script setup>
	/**
	 * components/BorderData.vue
	 * Responsible for all changes to the county borders in BaseMap.vue
	 */

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
	import {fetchGeojson} from './fetchers';
	import {fadeIn, fadeOut} from '@/d3/transitions/fadeSelection';
	import {createTransition} from '@/d3/transitions/createTransition';
	import {FetchQueue} from './FetchQueue';
	import {registerKey} from './RegisterKey';

	// Enum impports
	import {MapZoomLevel} from '@/enums/MapZoomLevel';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const emit = defineEmits(['transition']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const queue = new FetchQueue();
	const fadeDuration = 500;
	const label = 'borders';

	// Register this component
	const hooks = inject(registerKey)(label, {});

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
		let {result, promise} = fetchGeojson(
			`${paths.geojson}/KSCounty_1860_GeoJSON.geojson`
		);
		queue.enqueue(promise, result, renderToSVG);
	});

	hooks.onZoomChange((newValue) => {
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

	hooks.onYearChange((newValue) => {
		let {result, promise} = fetchGeojson(
			`${paths.geojson}/KSCounty_${newValue}_GeoJSON.geojson`
		);
		queue.enqueue(promise, result, renderToSVG);
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed,
	 * prints the error received. Populates selection by binding
	 * the data to path elements.
	 * @param result The object that holds the data, loading, and error properties
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
						.classed('border', true)
						.on('click', onBorderClick);

					fadeIn(s, {duration: fadeDuration});
					return s;
				},
				(update) => update,
				(exit) => fadeOut(exit, {duration: fadeDuration}).remove()
			);
	}

	/**
	 * Emits a transition event to BaseMap with the
	 * the parameters "border", and the bounding box
	 * of the border clicked on.
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
</script>

<template>
	<g class="border" ref="g"></g>
</template>

<style scoped>
	:global(.border) {
		fill: none;
		pointer-events: all;
	}
</style>
