<script setup>
/**
 * components/BaseMap.vue
 *
 * Contains the base svg element that all geojson data is rendered to.
 * Calls each Data component to fetch and render geojson data.
 */
import { defineProps, onMounted, useTemplateRef, ref, computed } from 'vue';
import * as d3 from 'd3';
import RailroadData from './RailroadData.vue';
import BorderData from './BorderData.vue';
import CityData from './CityData.vue';
import TractData from './TractData.vue';
import { watcherType } from './watcherType';

const props = defineProps(["inputValue", "statePath"]);
const svgRef = useTemplateRef("svg");
const defaultViewBox = "0 0 1600 800";

let countyTransition = ref(true);
let zoomState = ref("state");
let svgTag = null;

let properties = {
    inputValue: props.inputValue,
    zoomState: zoomState,
    projection: d3.geoAlbers().scale(14000).translate([1150, 375]),
    bbox: {
        x: 0,
        y: 0,
        width: 1600,
        height: 800
    },
    path: `/public/${props.statePath}`
}

let filters = {
    countyBorders: {
        label: "County Borders",
        visible: computed(() => true),
        checked: true,
        checkedRef: ref(true)
    },
    railroads: {
        label: "Railroads",
        visible: computed(() => true),
        checked: true,
        checkedRef: ref(true)
    },
    cities: {
        label: "Cities",
        visible: computed(() => true),
        checked: true,
        checkedRef: ref(true)
    },
    tracts: {
        label: "Tracts",
        visible: computed(() => zoomState.value === 'county'),
        checked: true,
        checkedRef: ref(true)
    }
}
const visibleFilters = computed(() => Object.values(filters).filter(item => item.visible.value))

const watchers = {
    [watcherType.onZoomChange]: zoomState,
    [watcherType.onYearChange]: props.inputValue,
    [watcherType.onCountyTransition]: countyTransition,
    [watcherType.onRailroadsChecked]: filters.railroads.checkedRef,
    [watcherType.onCountyBordersChecked]: filters.countyBorders.checkedRef,
    [watcherType.onCitiesChecked]: filters.cities.checkedRef,
    [watcherType.onTractsChecked]: filters.tracts.checkedRef,
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

function onCheckboxChecked(event, item) {
    item.checked = event.target.checked;
    item.checkedRef.value = item.checked;
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
            <RailroadData :properties="properties" :watchers="watchers" :filters="filters.railroads.checkedRef"/>
            <BorderData :properties="properties" :watchers="watchers" :filters="filters.countyBorders.checkedRef" @transition="onTransition" />
            <TractData :properties="properties" :watchers="watchers" :filters="filters.tracts.checkedRef" />
            <CityData :properties="properties" :watchers="watchers" :filters="filters.cities.checkedRef" />
        </svg>
        <TransitionGroup class="test" name="filters" tag="ul">
            <li class="filter" v-for="item in visibleFilters" :key="item.label">
                <input type="checkbox" :checked="item.checked" @click="onCheckboxChecked($event, item)">
                {{ item.label }}
            </li>
        </TransitionGroup>
        <!--
        <fieldset class="filters">
            <legend>Filters:</legend>
            <label><input type="checkbox"> County Borders</label>
            <label><input type="checkbox"> Railroads</label>
            <label><input type="checkbox"> Cities</label>
            <label v-if="zoomState === 'county'"><input type="checkbox"> Tracts</label>
        </fieldset>
        -->
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.column {
    display: flex;
    flex-direction: column;
}

.test {
    position: relative;
    padding: 0;
    list-style-type: none;
}

.filter {
    width: 100%;
    height: 30px;
}

.filters-move,
.filters-enter-active,
.filters-leave-active {
    transition: all 0.5s ease;
}

.filters-enter-from,
.filters-leave-to {
    opacity: 0%;
    transform: translateX(30px);
}

.filters-leave-active {
    position: absolute;
}
</style>
