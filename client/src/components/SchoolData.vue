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
		watch,
		inject,
	} from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers.js';
	import { registerKey } from '../utility/RegisterKey.js';
	import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection.js';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel.js';
	import { GroupType } from '@/enums/GroupType.js';

	// Define props, template refs, and emits
	const props = defineProps(['properties', 'watchers']);
	const emit = defineEmits(['school-hover']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

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
	let gTag = null;
	let projectedSchools = [];
	let hoverActive = false;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		json: `${props.properties.path}/json`,
		csv: `${props.properties.path}/csv`,
	};

	// Fetches starting data on mount.
	onMounted(() => {
		gTag = d3.select(gRef.value);
		const { result } = fetchGeojson(`${paths.geojson}/KSSchools.geojson`);
		renderToSVG(result);
	});

	// Fades out schools at state level.
	// Fades in culled schools at county level.
	hooks.onZoomChange((newValue) => {
		switch (newValue) {
			case MapZoomLevel.STATE:
				hoverActive = false;
				if (selectionPoints) {
					selectionPoints
						.transition()
						.duration(200)
						.attr('opacity', '0%');
				}
				emit('school-hover', null);
				break;
			case MapZoomLevel.COUNTY:
				hoverActive = true;
				updateVisibleByBBox();
				break;
		}
	});

	// Fades in/out culled selection.
	hooks.onCountyTransition(() => {
		if (!hoverActive) return;
		updateVisibleByBBox();
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed, prints the error
	 * received. Populates selection by binding the data to path elements.
	 * @param result The object that holds the data, loading, and error
	 * properties
	 */
	function renderToSVG(result) {
		const d = result.data.value;
		const l = result.loading.value;
		const e = result.error.value;

		if (l) {
			// If data is still loading
			const unwatch = watch(
				() => result.loading.value,
				() => {
					renderToSVG(result);
					unwatch();
				}
			);
			return;
		} else if (e) {
			// If there was an error
			console.error(e);
			return;
		}
		// console.log("KSSchools features:", d && d.features ? d.features.length : "no data");

		projectedSchools = d.features.map((f) => {
			const coords = props.properties.projection(f.geometry.coordinates);
			return {
				x: coords[0],
				y: coords[1],
				props: f.properties,
			};
		});

		selectionPoints = gTag
			.selectAll('.school-point')
			.data(projectedSchools)
			.join('circle')
			.attr('class', 'school-point')
			.attr('cx', (d) => d.x)
			.attr('cy', (d) => d.y)
			.attr('r', 0.8)
			.attr('opacity', '0%')
			.on('mouseenter', (event, d) => {
				if (!hoverActive) return;
				const mousePos = { x: event.clientX, y: event.clientY };
				emit('school-hover', { props: d.props, pos: mousePos });
			})
			.on('mouseleave', () => {
				if (!hoverActive) return;
				emit('school-hover', null);
			});
	}

	/**
	 * Updates the visibility of selected points based on the current bounding
	 * box.
	 * 
	 * Specifically:
	 * - Triggers a fade in animation for points inside the bounding box
	 * - Triggers a fade out animation for points outside the bounding box
	 */
	function updateVisibleByBBox() {
		if (!selectionPoints || projectedSchools.length === 0) {
			return;
		}

		const bbox = props.properties.bbox;

		selectionPoints
			.transition()
			.duration(200)
			.attr('opacity', (d) => {
				const inside = pointInBBox(d, bbox);
				return inside ? '100%' : '0%';
			});
	}

	/**
	 * Determines whether a point lies within a given bounding box.
	 * The bounding box is treated as inclusive of its edges, meaning points on
	 * the boundary are considered inside.
	 * @param d The point to test (The data object associated with a school)
	 * @param { {x: number, y: number, width: number, height: number} } bbox The bounding box, defined by its top-left corner and
	 * dimensions
	 * @returns {boolean} True if the point is inside or on the edge of the
	 * bounding box; otherwise false.
	 */
	function pointInBBox(d, bbox) {
		return (
			d.x >= bbox.x &&
			d.x <= bbox.x + bbox.width &&
			d.y >= bbox.y &&
			d.y <= bbox.y + bbox.height
		);
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
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				hoverActive = false;
				break;
			case MapZoomLevel.COUNTY:
				hoverActive = true;
		}
		fadeIn(selectionPoints);
	}

	/**
	 * Disales hover interactions and triggers a fade-out animation for the
	 * current selection.
	 * @returns {void}
	 */
	function onUnchecked() {
		hoverActive = false;
		fadeOut(selectionPoints);
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
		pointer-events: visible;
	}
</style>
