<!--
	components/RiverData.vue

	Updates and renders data relating to the rivers of Kansas.

	=== Hooks ===
	OnZoomChange: On zoom in, widens the width of all rivers. On zoom out, thins
	the width of all rivers.

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
	const label = 'rivers';

	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Rivers',
			defaultStatus: true,
			visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
			groups: [GroupType.INFRASTRUCTURE],
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
		const { result } = fetchGeojson(`${paths.geojson}/KS_Rivers.geojson`);
		renderToSVG(result);
	});

	hooks.onZoomChange((newValue) => {
		if (!selection) return;
		const width = newValue === MapZoomLevel.STATE ? 0.8 : 0.4;
		selection.transition().duration(500).attr('stroke-width', width);
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
			.selectAll('.river')
			.data(d.features)
			.join('path')
			.attr('d', pathGen)
			.attr(
				'stroke-width',
				props.properties.zoomState.value === 'state' ? 0.8 : 0.4
			)
			.classed('river', true);
	}
</script>

<template>
	<g class="rivers" ref="g"></g>
</template>

<style scoped>
	:global(.river) {
		fill: none;
		stroke: #5bc0de;
		pointer-events: none;
	}
</style>
