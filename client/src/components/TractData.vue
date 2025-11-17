<script setup>
import { defineProps, defineEmits, onMounted, useTemplateRef, watch, ref } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';

const emit = defineEmits(["addHandler"]);
const props = defineProps(["properties", "watchers"]);
const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let opacity = "0%";
let selection = null;
let culledSelection = null;
let gTag = null;

onMounted(() => {
    let result = {
        data: ref(null),
        loading: ref(null),
        error: ref(null)
    }
    gTag = d3.select(gRef.value);
    fetchGeojson("KSTracts_2000.geojson", result);
    validateData(result);
});

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onCountyTransition]: onCountyTransition,
};

assignWatchers(props.watchers, fnDict);
emit("addHandler", "cull", cullSelection)

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

function onCountyTransition() {
    culledSelection.transition()
            .duration(200)
            .attr("opacity", "0%");
    culledSelection = selection.filter((d, i, n) => {
        let nodeBBox = n[i].getBBox();
        return boxOverlapsBox(nodeBBox, props.properties.bbox);
    })
    culledSelection.transition()
            .duration(200)
            .attr("opacity", "100%");
}

function cullSelection(type, selector) {
    // Delay this call until cullSelection has been populated
    if (culledSelection === null) {
        console.log("this is null");
        watch(ref(culledSelection), () => cullSelection(type, selector));
        return;
    }

    switch (type) {
        case "box":
            culledSelection.transition()
                    .duration(200)
                    .attr("opacity", "0%");
            culledSelection = selection.filter((d, i, n) => {
                let node = n[i];
                let nodeBBox = node.getBBox();
                return boxOverlapsBox(nodeBBox, selector);
            })
            culledSelection.transition()
                    .duration(200)
                    .attr("opacity", "100%");
            break;
    }
}

/**
 * Returns true if both boxes overlap
 * @param box One of the boxes to check
 * @param otherBox The other box to check
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
    stroke: #b22222;
    stroke-width: 0.2;
    pointer-events: none;
    stroke-dasharray: 0.5 0.5;
}
</style>