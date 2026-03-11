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

	onMounted(() => {
		gTag = d3.select(gRef.value);

		const { result } = fetchGeojson(`${paths.geojson}/KSSchools.geojson`);
		renderToSVG(result);
	});

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

	hooks.onCountyTransition(() => {
		if (!hoverActive) return;
		updateVisibleByBBox();
	});

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
			.attr('r', 0.5)
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

	function pointInBBox(d, bbox) {
		return (
			d.x >= bbox.x &&
			d.x <= bbox.x + bbox.width &&
			d.y >= bbox.y &&
			d.y <= bbox.y + bbox.height
		);
	}

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
		fill: black;
		pointer-events: visible;
	}
</style>
