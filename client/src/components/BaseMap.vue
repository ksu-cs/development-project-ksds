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
import SchoolData from './SchoolData.vue';
import { watcherType } from './watcherType';

const props = defineProps(["inputValue", "statePath"]);
const svgRef = useTemplateRef("svg");
let hoveredSchool = ref(null);
const defaultViewBox = "0 0 1600 800";

let properties = {
    projection: d3.geoAlbers().scale(14000).translate([1150, 375]),
    bbox: {
        x: 0,
        y: 0,
        width: 1600,
        height: 800
    },
    path: `/public/${props.statePath}`
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
            <SchoolData :properties="properties" :watchers="watchers" @school-hover="hoveredSchool = $event" />
        </svg>
        <fieldset class="checkboxes" v-if="zoomState === 'county'">
            <legend>Filters:</legend>
            <label><input type="checkbox"> Filter 1</label>
            <label><input type="checkbox"> Filter 2</label>
            <label><input type="checkbox"> Filter 3</label>
            <label><input type="checkbox"> Filter 4</label>
        </fieldset>
        <div class="school-info-box" v-if="hoveredSchool" :style="{ left: hoveredSchool.pos.x + 15 + 'px',
              top: hoveredSchool.pos.y + 15 + 'px' }">
            <h3>{{ hoveredSchool.props.bldg_name }}</h3>
            <p><strong>District:</strong> {{ hoveredSchool.props.org_name }} ({{ hoveredSchool.props.org_no }})</p>
            <p><strong>Building No:</strong> {{ hoveredSchool.props.bldg_no }}</p>
            <p><strong>Level:</strong> {{ hoveredSchool.props['Buildng Level'] }}</p>
            <p><strong>Opened:</strong> {{ hoveredSchool.props.Date_Opened }}</p>
            <p><strong>Homepage:</strong> {{ hoveredSchool.props.homepage_addr }}</p>
            <p><strong>Address:</strong> {{ hoveredSchool.props.Address }}, {{ hoveredSchool.props.City }}, {{ hoveredSchool.props.State }} {{ hoveredSchool.props.Zip }}</p>
        </div>
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

.school-info-box {
    position: fixed;
    background: white;
    padding: 10px 14px;
    border: 1px solid #888;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    z-index: 9999;
    pointer-events: none; /* VERY IMPORTANT — avoids interfering with hover detection */
    font-size: 13px;
    max-width: 250px;
}
</style>
