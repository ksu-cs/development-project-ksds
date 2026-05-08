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
		computed,
	} from 'vue';
	import * as d3 from 'd3';
	import { watch, ref } from 'vue';

	// Utility imports
	import { fetchGeojson } from '../utility/fetchers';
	import { registerKey } from '../utility/RegisterKey';
	import { normalizeGeometry } from '../utility/geometry';
	import { renderPolygonPaths, getChoroplethScale } from '@/utility/RenderFunctions';

	// Enum impports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const emit = defineEmits(['transition']);
	const gRef = useTemplateRef('g');

	// Define reactive variables
	let showHeatmap = ref(false);
	let zoomState = ref(MapZoomLevel.STATE);

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const fadeDuration = 500;
	const borderLabel = 'county-borders';
	const popLabel = 'county-pop';
	const lightColor = { r: 198, g: 219, b: 239 } // light blue
	const darkColor = { r: 8, g: 48, b: 108 } // dark blue
	const invalidColor = { r: 240, g: 240, b: 240} // light gray


	// Register this component
	const borderHooks = inject(registerKey)(borderLabel, {});
	/* eslint-disable no-unused-vars */
	const popHooks = inject(registerKey)(popLabel, {
	/* eslint-enable no-unused-vars */
		filter: {
			legibleLabel: "County Pop Heat Map",
			defaultStatus: false,
			visibleStates: new Set([MapZoomLevel.STATE]),
			groups: [GroupType.OTHER],
			onChecked: handleHeatmapChecked,
			onUnchecked: handleHeatmapUnchecked,
		},
	})


	// Polygons that represent each county border
	let selection = null;
	let gTag = null;
	let state = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		json: `${props.properties.path}/json`,
		csv: `${props.properties.path}/csv`,
	};
	// Gets the path to the server for a specific year.
	const getCountyPath = (year) => `${paths.geojson}/KSCounty_${year}_GeoJSON.geojson`;

	onMounted(() => {
		gTag = d3.select(gRef.value);
		selection = gTag.selectAll('.border');

		let { features, result } = useCountyBorders(1860);
		state = useCountyRenderState(features);

		watch(result.loading, () => {
			selection = renderPolygonPaths(selection, state, { duration: fadeDuration}, { onClick: handleBorderClick })
		});
	});

	borderHooks.onZoomChange((newValue) => {
		zoomState.value = newValue;
		selection = renderPolygonPaths(selection, state, { duration: fadeDuration}, { onClick: handleBorderClick });
	})

	// Fetch data on year change.
	borderHooks.onYearChange((newValue) => {
		let {features, result} = useCountyBorders(newValue);
		state = useCountyRenderState(features);

		watch(result.loading, () => {
			selection = renderPolygonPaths(selection, state, { duration: fadeDuration}, { onClick: handleBorderClick });
		})
	});

	/**
	 * Fetches and processes county borders geojson data for a given year.
	 * @param {number} year - The year for which to fetch and process the county
	 * border data.
	 * @returns {Object} An object containing the following properties:
	 * - `features`: A computed property that maps each county feature to an
	 * object containing:
	 *    - `id`: The unique county identifier (`NHGISNAM`).
	 *    - `geometry`: The normalized geometry of the county border.
	 *    - `norm`: A normalized population value if the population data is
	 * valid; otherwise `null`.
	 * - `result`: The raw result object returned from the `fetchGeojson`
	 * function.
	 * - `promise`: The promise associated with the geojson fetch request.
	 */
	function useCountyBorders(year) {
		const { result, promise } = fetchGeojson(getCountyPath(year));

		const features = computed(() => {
			return result.data.value?.features.map((f) => {
				return {
					id: f.properties.NHGISNAM,
					geometry: normalizeGeometry(f.geometry),
					norm: f.properties['pop-data'].valid ? f.properties['pop-data'].norm : null,
				}
			})
		});

		return {
			features,
			result,
			promise,
		}
	}

	/**
	 * Computes the rendering state for county features based on their properties.
	 * @param {Array<Object>} features - A computed property containing an array of county features.
	 * 
	 * @returns {ComputedRef<Array<Object>>} A computed property that returns an
	 * array of rendering attributes for each county, with the following structure:
	 * - `id`: The unique identifier for the county.
	 * - `path`: The path data generated for the county's geometry.
	 * - `fill`: The fill color for the county, determined by a choropleth scale
	 * based on the county's `norm` property.
	 * - `opacity`: A constant value of `1`, as opacity is controlled through
	 * other properties.
	 * - `fillOpacity`: A dynamic value based on the `showHeatmap` and
	 * `zoomState` properties, which determines whether to show the heatmap fill
	 * opacity.
	 * - `stroke`: The color of the stroke for the county's path, always set to
	 * `'black'`.
	 * - `strokeWidth`: The width of the stroke, which changes depending on the
	 * current zoom level (`MapZoomLevel.STATE` results in a wider stroke).
	 */
	function useCountyRenderState(features) {
		return computed(() => {
			return features.value.map((f) => ({
				id: f.id,
				path: pathGen(f.geometry),
				fill: getChoroplethScale(lightColor, darkColor, invalidColor, f.norm),
				opacity: 1,
				fillOpacity: showHeatmap.value && zoomState.value != MapZoomLevel.COUNTY ? 1 : 0,
				stroke: 'black',
				strokeWidth: zoomState.value == MapZoomLevel.STATE ? 2 : 1,
			}))
		});
	}

	/**
	 * Emits a transition event to BaseMap with the the parameters "border", and
	 * the bounding box of the border clicked on.
	 * @param event The click event
	 */
	function handleBorderClick(event) {
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

	function handleHeatmapChecked() {
		showHeatmap.value = true;
		selection = renderPolygonPaths(selection, state, { duration: fadeDuration}, { onClick: handleBorderClick });
	}

	function handleHeatmapUnchecked() {
		showHeatmap.value = false;
		selection = renderPolygonPaths(selection, state, { duration: fadeDuration}, { onClick: handleBorderClick });
	}
</script>

<template>
	<g class="border" ref="g"></g>
</template>

<style scoped>
	:global(.border) {
		fill-rule: evenodd;
		pointer-events: all;
		stroke: #888;
		stroke-width: 0.8;
		
	}
</style>
