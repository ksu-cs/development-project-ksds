<!--
	components/CitySubdivisionData.vue

	Renders and updates data relating to the City subdivision borders of Kansas.

	Registers a filter for the borders

	Registers a filter for the heatmap.

    Our borders and population data for City Subdivisions are from 1970 to 2020.
-->
<script setup>
import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from '@/utility/fetchers';
import { createTransition } from '@/d3/transitions/createTransition';
import { interpolateColor } from '@/utility/Interpolators'; 
import { registerKey } from '@/utility/RegisterKey';
import { MapZoomLevel } from '@/enums/MapZoomLevel';
import { GroupType } from '@/enums/GroupType';

const props = defineProps(['properties']);
const gRef = useTemplateRef('g');

const label = 'city-subdivisions';
const popLabel = 'city-sub-pop';
const fillOpacity = "1";
const lightColor = { r: 198, g: 219, b: 239 }; 
const darkColor = { r: 8, g: 48, b: 108 }; 
const invalidColor = { r: 240, g: 240, b: 240 }; 

let isLinesChecked = false;
let isPopChecked = false;
let selection = null;
let pathGen = null;

const subHooks = inject(registerKey)(label, {
    filter: {
        legibleLabel: 'City Subdivisions',
        defaultStatus: false,
        visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
        groups: [GroupType.OTHER],
        onChecked: () => { isLinesChecked = true; updateStyles(); },
        onUnchecked: () => { isLinesChecked = false; updateStyles(); },
    },
});

const popHooks = inject(registerKey)(popLabel, {
    filter: {
        legibleLabel: 'City Sub Pop Heat Map',
        defaultStatus: false,
        visibleStates: new Set([MapZoomLevel.STATE]),
        groups: [GroupType.OTHER],
        onChecked: () => { isPopChecked = true; updateStyles(); },
        onUnchecked: () => { isPopChecked = false; updateStyles(); },
    },
});

onMounted(() => {
    pathGen = d3.geoPath(props.properties.projection);
    const { result } = fetchGeojson(`${props.properties.path}/geojson/KS_Cty_Sub_With_Pop.geojson`);
    
    // Watch for data load
    watch(() => result.data.value, (newData) => {
        if (newData) renderToSVG(newData);
    }, { immediate: true });
});

// Update the heatmap colors when the timeline changes
popHooks.onYearChange(() => {
    if (isPopChecked) updateStyles();
});

// Hide the heatmap when zoomed into a county, show it when zoomed out
popHooks.onZoomChange((newZoom) => {
    if (!selection) return;
    if (newZoom === MapZoomLevel.COUNTY) {
        createTransition(selection).attr('fill-opacity', 0);
    } else if (newZoom === MapZoomLevel.STATE && isPopChecked) {
        createTransition(selection).attr('fill-opacity', fillOpacity);
    }
});

// Ensure lines stay visible or hide appropriately on zoom
subHooks.onZoomChange(() => {
    if (!selection) return;
    createTransition(selection).attr('stroke-opacity', isLinesChecked ? 1 : 0);
});

function renderToSVG(data) {
    const gTag = d3.select(gRef.value);

    selection = gTag.selectAll('.city-sub')
        .data(data.features)
        .join('path')
        .attr('class', 'city-sub')
        .attr('d', pathGen) 
        .attr('stroke', '#f0ad4e')
        .attr('stroke-width', 0.6)
        .attr('stroke-opacity', 0)
        .attr('fill-opacity', 0);
        
    updateStyles();
}

function updateStyles() {
    if (!selection) return;

    const currentYear = props.properties.inputValue.value;
    const yearKey = `AV0AA${currentYear}`;
    const isStateView = props.properties.zoomState.value === MapZoomLevel.STATE;

    createTransition(selection)
        .attr('stroke-opacity', isLinesChecked ? 1 : 0)
        .attr('fill-opacity', (isPopChecked && isStateView) ? fillOpacity : 0)
        .attr('fill', d => {
            if (!isPopChecked) return "none";

            const stats = d.properties['decade-stats']?.[yearKey];
            const pop = d.properties[yearKey];

            // If data is missing for this decade, use the invalidColor fallback
            if (pop === undefined || !stats) {
                return `rgb(${invalidColor.r}, ${invalidColor.g}, ${invalidColor.b})`;
            }

            const range = stats.max - stats.min;
            const norm = range === 0 ? 0 : (pop - stats.min) / range;
            return interpolateColor(lightColor, darkColor, norm);
        });
}
</script>

<template>
    <g ref="g"></g>
</template>

<style scoped>
:global(.city-sub) {
    pointer-events: none;
    fill-rule: evenodd;
}
</style>