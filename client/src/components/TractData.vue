<script setup>
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchers';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';

const props = defineProps(["properties", "watchers"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let opacity = "0%";
let selection = null;
let culledSelection = null;
let gTag = null;

onMounted(() => {
    gTag = d3.select(gRef.value);
    let { result } = fetchGeojson("/geojson/KSTracts_2000.geojson");
    validateData(result);
});

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onCountyTransition]: onCountyTransition,
};

assignWatchers(props.watchers, fnDict);

/**
 * Waits for the fetched data to load. If the fetch failed,
 * prints the error recieved. Populates selection by binding
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
        // Create tract path elements bound to data.
        selection = gTag.selectAll(".tract")
                        .data(d.features)
                        .enter()
                        .append("path")
                            .attr("d", d => {
                                d.geometry.coordinates[0].reverse();
                                return pathGen(d);
                            })
                            .attr("opacity", opacity)
                            .classed("tract", true);
    
        culledSelection = selection.filter(() => true);
  }
}

/**
 * Fades out tract borders on a zoom out to
 * the state level
 * @param state the new zoomState
 */
function onZoom(state) {
    switch (state) {
        case "state":
            opacity = "0%";
            culledSelection.transition()
                .duration(200)
                .attr("opacity", opacity);
            break;
    }
}

/**
 * When transitioning to a county, cull every tract
 * that doesn't overlap with the selected county, then
 * fade in the tracts remaining
 */
function onCountyTransition() {
    // Fade out last selection
    culledSelection.transition()
            .duration(200)
            .attr("opacity", "0%");
    
    // Cull selection
    culledSelection = selection.filter((d, i, n) => {
        let nodeBBox = n[i].getBBox();
        return boxOverlapsBox(nodeBBox, props.properties.bbox);
    })

    // Fade in new selection
    culledSelection.transition()
            .duration(200)
            .attr("opacity", "100%");
}

/**
 * Returns true if both given bounding boxes overlap
 * @param box One of the bounding boxes to check
 * @param otherBox The other bounding box to check
 */
function boxOverlapsBox(box, otherBox) {
    return ((box.x >= otherBox.x &&
                        box.x <= otherBox.x + otherBox.width) ||
                        (box.x + box.width >= otherBox.x &&
                        box.x + box.width <= otherBox.x + otherBox.width)) &&
                        ((box.y >= otherBox.y &&
                        box.y <= otherBox.y + otherBox.height) ||
                        (box.y + box.height >= otherBox.y &&
                        box.y + box.height <= otherBox.y + otherBox.height))
}
</script>

<template>
    <g class="tracts" ref="g"></g>
</template>

<style scoped>
:global(.tract) {
    fill: none;
    stroke: #ff000d;
    stroke-width: 0.2;
    pointer-events: none;
    stroke-dasharray: 0.5 2;
    stroke-linecap: round;
}
</style>