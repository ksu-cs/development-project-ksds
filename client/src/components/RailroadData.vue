<script setup>
/**
 * components/RailroadData.vue
 * Responsible for all changes to the railroad in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchers';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';
import { fadeOut } from '@/d3/transitions/fadeSelection';

const props = defineProps(["properties", "watchers", "filters"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let selection = null;
let gTag = null;
let paths = {
    geojson: `${props.properties.path}/geojson`,
    csv: `${props.properties.path}/csv`
}

onMounted(() => {
    gTag = d3.select(gRef.value);
    let { result } = fetchGeojson(`${paths.geojson}/railroads.geojson`);
    validateData(result);
});

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onYearChange]: onYearChange,
    [watcherType.onRailroadsChecked]: onChecked,
};

assignWatchers(props.watchers, fnDict);

/**
 * Waits for the fetched data to load. If the fetch failed,
 * prints the error received. Populates selection by binding
 * the data to path elements.
 * @param r The object that holds the data, loading, and error properties
 */
function validateData(r) {
    let d = r.data.value;
    let l = r.loading.value;
    let e = r.error.value;

    if (l) {
        // Watch for the data to load
        const unwatch = watch(() => r.loading.value, () => { validateData(r); unwatch() });
    } else if (e) {
        console.log(e);
    } else {
        // Create rail path elements
        selection = gTag.selectAll(".rail")
                                    .data(d.features)
                                    .enter()
                                    .append("path");
        
        // Style rail path elements
        selection.attr("d", pathGen)
                .attr("opacity", d => d.properties.InOpBy <= props.properties.inputValue.value ? "60%" : "0%")
                .attr("stroke-width", 1)
                .classed("rail", true);
    }
}

/**
 * Changes width of rail path elements based on the
 * zoomState
 * @param newValue The new zoomState string
 */
function onZoom(newValue) {
    switch (newValue) {
        case "state":
            selection.transition()
                        .duration(200)
                        .attr("stroke-width", 1);
            break;
        case "county":
            selection.transition()
                        .duration(200)
                        .attr("stroke-width", 0.6);
            break;
    }
}

/**
 * Fades in all rail path elements that were in operation
 * by the given year. Fades out those elements that were not
 * in operation by the given year.
 * @param newValue The year selected
 */
function onYearChange(newValue) {
    if (props.filters.value) {
        selection.transition()
                .duration(200)
                .attr("opacity", d => d.properties.InOpBy <= newValue ? "100%" : "0%");
    }
}

function onChecked(newValue) {
    if (newValue) {
        selection.transition()
                .duration(200)
                .attr("opacity", d => d.properties.InOpBy <= props.properties.inputValue.value ? "60%" : "0%")
    } else {
        fadeOut(selection);
    }
}
</script>

<template>
    <g class="railroads" ref="g" ></g>
</template>

<style scoped>
:global(.rail) {
    fill: none;
    stroke: green;
    pointer-events: none;
    stroke-dasharray: 4;
    stroke-linecap: round;
}
</style>