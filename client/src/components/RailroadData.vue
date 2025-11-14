<script setup>
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson'

const props = defineProps(["projection", "inputValue", "zoomState"]);
const { data, loading, error } = fetchGeojson("railroads.geojson");
const pathGen = d3.geoPath(props.projection);
const gRef = useTemplateRef("g");

let selection = null;
let gTag = null;

onMounted(() => {
    gTag = d3.select(gRef.value);
    validateData();
});

watch(() => props.zoomState.value, onZoom);
watch(() => props.inputValue.value, onYearChange);

/**
 * Waits for the fetched data to load. If the fetch failed,
 * prints the error recieved. If the fetch succeeded, binds
 * the data to the selection.
 */
function validateData() {
    if (loading.value) {
        // Watch for the data to load
        const unwatch = watch(() => loading.value, () => { validateData(); unwatch() });
    } else if (error.value) {
        console.log(error.value);
    } else {
        // Create rail path elements
        selection = gTag.selectAll("path")
                                    .data(data.value.features)
                                    .enter()
                                    .append("path");
        
        // Style rail path elements
        selection.attr("d", pathGen)
                .attr("stroke-opacity", d => d.properties.InOpBy <= props.inputValue ? "60%" : "0%")
                .attr("stroke-width", 1)
                .classed("rail", true);
    }
}

/**
 * Changes width of rail path elements based on the
 * zoomState.
 * @param newValue The new zoomState string
 */
function onZoom(newValue) {
    switch (newValue) {
        case "state":
            selection
                .transition()
                    .duration(200)
                    .attr("stroke-width", 0.6);
            break;
        case "county":
            selection
                .transition()
                    .duration(200)
                    .attr("stroke-width", 1);
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
    selection
        .transition()
            .duration(200)
            .attr("stroke-opacity", d => d.properties.InOpBy <= newValue ? "60%" : "0%");
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
}
</style>