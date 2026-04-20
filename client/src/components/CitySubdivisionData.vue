<script setup>
/**
 * components/CitySubdivisionData.vue
 * Responsible for rendering City Subdivisions in Kansas.
 */
import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from '@/utility/fetchers';
import { fadeOut, fadeIn } from '@/d3/transitions/fadeSelection';
import { registerKey } from '@/utility/RegisterKey';
import { MapZoomLevel } from '@/enums/MapZoomLevel';
import { GroupType } from '@/enums/GroupType';

const props = defineProps(['properties']);
const gRef = useTemplateRef('g');
const label = 'city-subdivisions';

// Register with BaseMap for the filter UI
inject(registerKey)(label, {
    filter: {
        legibleLabel: 'City Subdivisions',
        defaultStatus: false,
        visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
        groups: [GroupType.OTHER],
        onChecked: () => fadeIn(selection),
        onUnchecked: () => fadeOut(selection),
    },
});

let selection = null;
let gTag = null;
let pathGen = null;

onMounted(() => {
    gTag = d3.select(gRef.value);
    pathGen = d3.geoPath(props.properties.projection);
    
    const { result } = fetchGeojson(`${props.properties.path}/geojson/KS_Cty_Sub_With_Pop.geojson`);
    renderToSVG(result);
});

function renderToSVG(r) {
    const d = r.data.value;
    if (r.loading.value) {
        const unwatch = watch(() => r.loading.value, () => { 
            renderToSVG(r); 
            unwatch(); 
        });
        return;
    }
    if (r.error?.value) {
        console.error("City Subdivision GeoJSON load error:", r.error.value);
        return;
    }
    if (!d || !d.features) return;

    selection = gTag.selectAll('.city-sub')
        .data(d.features)
        .join('path')
        .attr('class', 'city-sub')
        .attr('d', (f) => {
            if (f.geometry && f.geometry.coordinates && f.geometry.coordinates[0]) {
                f.geometry.coordinates[0].reverse();
            }
            return pathGen(f);
        })
        .attr('opacity', '0%');
}
</script>

<template>
    <g class="city-subdivisions" ref="g"></g>
</template>

<style scoped>
:global(.city-sub) {
    fill: none;
    stroke: #f0ad4e;
    stroke-width: 0.6;
    pointer-events: none;
}
</style>