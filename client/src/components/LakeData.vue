<!--
	components/LakeData.vue

	Renders and updates data relating to the lakes of Kansas.

	=== Hooks ===
	Filter: Fades in when checked, fades out when unchecked.
-->

<script setup>
	// External imports
	import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson } from '@/utility/fetchers';
	import { fadeOut, fadeIn } from '@/d3/transitions/fadeSelection';
	import { registerKey } from '@/utility/RegisterKey';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	const props = defineProps(['properties']);
	const gRef = useTemplateRef('g');

	const pathGen = d3.geoPath(props.properties.projection);
	const label = 'lakes';

	// Register with BaseMap for the filter UI
	inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Lakes',
			defaultStatus: true,
			visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
			groups: [GroupType.OTHER],
			onChecked: () => fadeIn(selection),
			onUnchecked: () => fadeOut(selection),
		},
	});

	let selection = null;
	let gTag = null;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
	};

	onMounted(() => {
		gTag = d3.select(gRef.value);
		const { result } = fetchGeojson(`${paths.geojson}/KS_Lakes.geojson`);
		renderToSVG(result);
	});

	function renderToSVG(r) {
		const d = r.data.value;
		const l = r.loading.value;

		if (l) {
			const unwatch = watch(
				() => r.loading.value,
				() => {
					renderToSVG(r);
					unwatch();
				}
			);
			return;
		}

		selection = gTag
			.selectAll('.lake')
			.data(d.features)
			.join('path')
			.attr('d', (f) => {
				// Polygons often need winding order reversal for D3
				if (f.geometry.coordinates[0])
					f.geometry.coordinates[0].reverse();
				return pathGen(f);
			})
			.classed('lake', true);
	}
</script>

<template>
	<g class="lakes" ref="g"></g>
</template>

<style scoped>
	:global(.lake) {
		fill: #add8e6;
		stroke: #5bc0de;
		stroke-width: 0.2;
	}
</style>
