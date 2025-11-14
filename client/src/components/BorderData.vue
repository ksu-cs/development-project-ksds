<script setup>
/**
 * components/BorderData.vue
 * Responsible for all changes to the county borders in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch, defineEmits, ref } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson';

class FetchQueue {
    constructor(max = 10) {
        this.max = max;
        this.queue = Promise.resolve();
        this.count = 0;
    }
    
    enqueue(promise, result) {
        this.count += 1;
        this.queue = this.queue.then(() => {
            promise.then(() => validateData(result))
        });

        if (this.count >= 10) {
            this.resetQueue();
        }
    }

    resetQueue() {
        this.queue = Promise.resolve();
        this.count = 0;
    }
}

const emit = defineEmits(["transition"])
const props = defineProps(["projection", "inputValue", "zoomState"]);
const pathGen = d3.geoPath(props.projection)
const gRef = useTemplateRef("g");
const queue = new FetchQueue();

let selection = null;
let gTag = null;
let strokeWidth = 2;

onMounted(() => {
    let result = {
        data: ref(null),
        loading: ref(null),
        error: ref(null)
    }
    gTag = d3.select(gRef.value);
    let p = fetchGeojson("KSCounty_1860_GeoJSON.geojson", result);
    queue.enqueue(p, result);
})

watch(() => props.zoomState.value, onZoom);
watch(() => props.inputValue.value, onYearChange);
/**
 * Waits for the fetched data to load. If the fetch failed,
 * prints the error recieved. Populates selection by binding
 * the data to path elements.
 * @param result The object that holds the data, loading, and error values
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
        // Join border paths:
        // Enter selection -> create paths, style them,
        // add onClick handlers, fade in
        // Update seleciton -> do nothing
        // Exit selection -> fade out, then remove
        selection = gTag.selectAll(".border")
                        .data(d.features, d => d.properties.id)
                        .join(
                            enter => enter.append("path")
                                                .attr("d", d => {
                                                    // d3 expects the reverse winding order that geojson uses
                                                    d.geometry.coordinates[0].reverse();
                                                    return pathGen(d);
                                                })
                                                .attr("stroke", "black")
                                                .attr("stroke-width", strokeWidth)
                                                .attr("opacity", "0%")
                                                .classed("border", true)
                                                .on("click", onBorderClick)
                                            .transition()
                                                .duration(500)
                                                .attr("opacity", "100%"),
                            update => update,
                            exit => exit.transition()
                                            .duration(500)
                                            .attr("opacity", "0%")
                                            .remove()
                        );
    }
}

/**
 * Emits a transition event to BaseMap with the
 * the parameters "border", and the bounding box
 * of the border clicked on.
 * @param event The click event
 */
function onBorderClick(event) {
    const bbox = event.target.getBBox();
    const boxString = String(bbox.x - 10) + " " +
                        String(bbox.y - 10) + " " +
                        String(bbox.width + 20) + " " +
                        String(bbox.height + 20);
    emit("transition", "border", boxString);
}

/**
 * Changes the width of the border path elements based
 * on the zoomState
 * @param newValue The new zoomState string
 */
function onZoom(newValue) {
    switch (newValue) {
        case "state":
            strokeWidth = 2;
            selection.transition()
                    .duration(200)
                    .attr("stroke-width", strokeWidth);
            break;
        case "county":
            strokeWidth = 1;
            selection.transition()
                    .duration(200)
                    .attr("stroke-width", strokeWidth);
            break;
    }
}

/**
 * Fetches the border data for the given year.
 * @param newValue The year selected
 */
function onYearChange(newValue) {
    let result = {
        data: ref(null),
        loading: ref(null),
        error: ref(null)
    }
    let p = fetchGeojson(`KSCounty_${newValue}_GeoJSON.geojson`, result);
    queue.enqueue(p, result);
}
</script>

<template>
    <g class="border" ref="g"></g>
</template>

<style scoped>
:global(.border) {
    fill: none;
    pointer-events: all;
}
</style>