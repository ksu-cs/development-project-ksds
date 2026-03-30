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
	import { fetchGeojson } from '../utility/fetchers';
	import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection';
	import { createTransition } from '@/d3/transitions/createTransition';
	import { normalize, interpolateColor } from '@/utility/interpolators';
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
	const normData = {
		1860: {
			max: 34277,
			min: 19,
		},
		1870: {
			max: 32444,
			min: 2,
		},
		1880: {
			max: 32355,
			min: 3,
		},
		1890: {
			max: 54407,
			min: 724,
		},
		1900: {
			max: 73227,
			min: 304
		},
		1910: {
			max: 73227,
			min: 304
		},
		1920: {
			max: 122218,
			min: 908,
		},
		1930: {
			max: 141211,
			min: 1712,
		},
		1940: {
			max: 145071,
			min: 1443,
		},
		1950: {
			max: 222290,
			min: 2010,
		},
		1960: {
			max: 343231,
			min: 2069,
		},
		1970: {
			max: 350694,
			min: 2044,
		},
		1980: {
			max: 366531,
			min: 1845,
		},
		1990: {
			max: 403662,
			min: 1774,
		},
		2000: {
			max: 835135,
			min: 2958,
		},
		2020: {
			max: 1219726,
			min: 2568,
		}
	}

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

	borderHooks.onYearChange((newValue) => {
		let { result, promise } = fetchGeojson(
			`${paths.geojson}/KSCounty_${newValue}_GeoJSON.geojson`
		);
		queue.enqueue(promise, result, renderToSVG);
	});

	popHooks.onYearChange(() => {
		rerenderHeatMap += 1
	})

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
						.attr('fill-opacity', '0%')
						.classed('border', true)
						.on('click', onBorderClick);
					
					if (rerenderHeatMap > 0) {
						const year = props.properties.inputValue.value.toString();
						s = s.attr('fill', (d) => getCountyColor(d, year))
							.attr('fill-opacity', fillOpacity);
						rerenderHeatMap -= 1;
					}

					fadeIn(s, { duration: fadeDuration })

					return s;
				},
				(update) => update,
				(exit) => fadeOut(exit, { duration: fadeDuration }).remove()
			);
		
		//if (rerenderHeatMap) {
		//	displayHeatMap();
		//	rerenderHeatMap -= 1;
		//}
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

	function displayHeatMap() {
		let year = props.properties.inputValue.value.toString();

		createTransition(selection)
			.attr('fill', (d) => getCountyColor(d, year))
			.attr('fill-opacity', fillOpacity);
	}

	function getCountyColor(d, year) {
		const yearData = d.properties["pop-by-year"];
		if (Object.hasOwn(yearData, year)) {
				const t = normalize(yearData[year], normData[year].min, normData[year].max);
				return interpolateColor(lightColor, darkColor, t);
		} else{
			return `rgb(${invalidColor.r}, ${invalidColor.g}, ${invalidColor.b})`
		}
	}

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
