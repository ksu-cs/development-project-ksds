<script setup>
/**
 * components/BaseMap.vue
 *
 * Contains the base svg element that all geojson data is rendered to.
 * Calls each Data component to fetch and render geojson data.
 */
import { defineProps, onMounted, useTemplateRef, ref } from 'vue';
import * as d3 from 'd3';
import RailroadData from './RailroadData.vue';
import BorderData from './BorderData.vue';
import CityData from './CityData.vue';
import TractData from './TractData.vue';
import { watcherType } from './watcherType';

const props = defineProps(["inputValue"]);
const svgRef = useTemplateRef("svg");
const defaultViewBox = "0 0 1600 800";

let properties = {
    projection: d3.geoAlbers().scale(14000).translate([1150, 375]),
    bbox: {
        x: 0,
        y: 0,
        width: 1600,
        height: 800
    }
}

let countyTransition = ref(true);
let zoomState = ref("state");
let svgTag = null;

const watchers = {
    [watcherType.onZoomChange]: zoomState,
    [watcherType.onYearChange]: props.inputValue,
    [watcherType.onCountyTransition]: countyTransition,
};

onMounted(() => {
    svgTag = d3.select(svgRef.value);
})

/**
 * Changes zoomState to zoomLevel, and transitions into
 * the given viewBox.
 * @param zoomLevel The new zoomState as a string
 * @param viewBox the viewBox to transition to
 */
function changeZoomLevel(zoomLevel, viewBox) {
    svgTag.transition()
            .duration(750)
            .attr("viewBox", viewBox)
            .on("end", () => zoomState.value = zoomLevel );
}

/**
 * Transitions the viewBox from where it is, to 
 * somewere else.
 * @param type placeolder, for when different types of transitions are needed
 * @param boxString the bounding box of the clicked on county as a string, will be replaced by a single object later
 * @param bbox the bounding box object of the clicked on county, will be replaced by a single object later
 */
function onTransition(type, boxString, bbox) {
    if (boxString === svgTag.attr("viewBox")) {
        properties.bbox = {
            x: 0,
            y: 0,
            width: 1600,
            height: 800
        }
        changeZoomLevel("state", defaultViewBox);
    } else {
        properties.bbox = bbox;
        changeZoomLevel("county", boxString);
        countyTransition.value = !countyTransition.value;
    }
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
            <RailroadData :properties="properties" :watchers="watchers" />
            <BorderData :properties="properties" :watchers="watchers" @transition="onTransition" />
            <TractData :properties="properties" :watchers="watchers" />
            <CityData :properties="properties" :watchers="watchers" />
        </svg>
        <!-- Will probably move this fieldset into its own component -->
        <fieldset class="checkboxes">
            <legend>Filters:</legend>
            <label><input type="checkbox"> Filter 1</label>
            <label><input type="checkbox"> Filter 2</label>
            <label><input type="checkbox"> Filter 3</label>
            <label><input type="checkbox"> Filter 4</label>
        </fieldset>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.checkboxes {
    display: flex;
    flex-direction: column;
}

.checkboxes label {
    padding: 5px 0px;
}
</style>
