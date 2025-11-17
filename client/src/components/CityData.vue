<script setup>
/**
 * components/CityData.vue
 * Responsible for all changes to the cities in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch, ref } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';

const props = defineProps(["properties", "watchers"]);
const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let result = {
    data: ref(null),
    loading: ref(null),
    error: ref(null)
}
let selectionPoints = null;
let selectionText = null;
let gTag = null;

fetchGeojson("cities.geojson", result);

onMounted(() => {
    gTag = d3.select(gRef.value);
    validateData(result);
})

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
};

assignWatchers(props.watchers, fnDict);

function validateData(r) {
    let d = r.data.value;
    let l = r.loading.value;
    let e = r.error.value;

    if (l) {
        const unwatch = watch(() => r.loading.value, () => { validateData(r); unwatch() });
    } else if (e) {
        console.log(e);
    } else {
        // Create path elements for every pair of lon, lat coordinates
        selectionPoints = gTag.select(".points")
                                .selectAll(".point")
                                .data(d.features)
                                .enter()
                                .append("path")
                                    .attr("d", pathGen.pointRadius(1.5))
                                    .classed("point", true);
        
        // Project every city's lon, lat pair
        // pathGen does this for us, however,
        // we can't use pathGen here
        const projectedFeatures = d.features.map(feature => {
            return {
                coordinates: props.properties.projection(feature.geometry.coordinates),
                topTen: feature.properties["Top Ten"],
                name: feature.properties["City Name"]
            }
        });
        
        selectionText = gTag.select(".text")
                                .selectAll(".name")
                                .data(projectedFeatures)
                                .enter()
                                .append("text")
                                    .attr("x", d => d.coordinates[0])
                                    .attr("y", d => d.coordinates[1])
                                    .attr("opacity", d => d.topTen ? "100%" : "0%")
                                    .attr("font", "italic 13px sans-serif")
                                    .property("textContent", d => d.name)
                                    .classed("name", true)
                                    .each((d, i, n) => centerText(d, i, n, 5));
    }
}

/**
 * Centers every text element horizontally at its x position and
 * offsets it vertically by the given amount from its y position
 * @param d The data for the current node
 * @param i The index of the current node in the list of nodes
 * @param n The list of all nodes
 * @param dy The vertical offset (positive moves upward)
 */
function centerText(d, i, n, dy) {
    const bbox = n[i].getBBox();
    const originX = d.coordinates[0];
    const originY = d.coordinates[1];
    const centeredX = originX - (bbox.width / 2);
    
    d3.select(n[i])
            .attr("x", String(centeredX))
            .attr("y", originY - dy);
}

function onZoom(state) {
    switch (state) {
        case "state":
            selectionPoints.transition()
                    .duration(200)
                    .attr("d", pathGen.pointRadius(1.5));
            
            selectionText.attr("font-size", "100%")
                    .each((d, i, n) => centerText(d, i, n, 5))
                    .attr("opacity", d => d.topTen ? "100%" : "0%");
            break;
        case "county":
            selectionPoints.transition()
                    .duration(200)
                    .attr("d", pathGen.pointRadius(1));
            
            selectionText.attr("font-size", "30%")
                    .each((d, i, n) => centerText(d, i, n, 3))
                .transition()
                    .duration(200)
                    .attr("opacity", "100%");
            break;
    }
}
</script>

<template>
    <g class="cities" ref="g">
        <g class="points"></g>
        <g class="text"></g>
    </g>
</template>

<style scoped>
:global(.point) {
    fill: red;
    pointer-events: none;
}

:global(.name) {
    fill: blue;
    pointer-events: none;
}
</style>