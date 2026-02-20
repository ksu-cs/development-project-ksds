<script setup>
/**
 * components/RailroadData.vue
 * Responsible for all changes to the railroad in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchers';
import { fadeOut } from '@/d3/transitions/fadeSelection';
import { createTransition } from '@/d3/transitions/createTransition';
import { MapZoomLevel } from './MapZoomLevel';
import { GroupType } from './GroupType';
import { registerKey } from './RegisterKey';

const props = defineProps(["properties"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

const label = "railroads"
let selection = null;
let gTag = null;
let paths = {
    geojson: `${props.properties.path}/geojson`,
    csv: `${props.properties.path}/csv`
}

const hooks = inject(registerKey)(label, {
    filter: {
        legibleLabel: "Railroads",
        defaultStatus: true,
        visibleStates: new Set([
            MapZoomLevel.STATE,
            MapZoomLevel.COUNTY,
        ]),
        groups: [
            GroupType.INFRASTRUCTURE,
        ],
        onChecked: onChecked,
        onUnchecked: onUnchecked,
    },
});

hooks.onZoomChange((newValue) => {
    switch (newValue) {
        case "state":
            createTransition(selection)
                    .attr("stroke-width", 1);
            break;
        case "county":
            createTransition(selection)
                    .attr("stroke-width", 0.6);
            break;
    }
})

hooks.onYearChange((newValue) => {
    createTransition(selection)
            .attr("opacity", d => d.properties.InOpBy <= newValue ? "100%" : "0%");
})

onMounted(() => {
    gTag = d3.select(gRef.value);
    let { result } = fetchGeojson(`${paths.geojson}/railroads.geojson`);
    validateData(result);
});

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
        console.error(e);
    } else {
        // Create rail path elements
        selection = gTag
            .selectAll(".rail")
            .data(d.features)
            .join(
                enter => enter
                    .append("path")
                        .attr("d", pathGen)
                        .attr("opacity", d => d.properties.InOpBy <= props.properties.inputValue.value ? "100%" : "0%")
                        .attr("stroke-width", 1)
                        .classed("rail", true),
                update => update,
                exit => fadeOut(exit).remove()
            )
    }
}

/**
 * Fades in the appropriate selection when checked, fades it out when unchecked.
 * @param newValue Whether this data components filter was checked or unchecked (true/false)
 */
/*
function onChecked(newValue) {
    if (newValue) {
        createTransition(selection)
                .attr("opacity", d => d.properties.InOpBy <= props.properties.inputValue.value ? "100%" : "0%");
    } else {
        fadeOut(selection);
    }
}
    */

function onChecked() {
    createTransition(selection)
            .attr("opacity", d => d.properties.InOpBy <= props.properties.inputValue.value ? "100%" : "0%");
}

function onUnchecked() {
    fadeOut(selection);
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