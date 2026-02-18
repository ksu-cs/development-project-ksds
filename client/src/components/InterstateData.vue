<script setup>
/**
 * components/InterstateData.vue
 * Responsible for all changes to the interstate lines in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchers';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';
import { fadeOut } from '@/d3/transitions/fadeSelection';
import { createTransition } from '@/d3/transitions/createTransition';

const props = defineProps(["properties", "watchers", "filters"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let selection = null;
let gTag = null;

let paths = {
    geojson: `${props.properties.path}/geojson`,
    csv: `${props.properties.path}/csv`
};

onMounted(() => {
    gTag = d3.select(gRef.value);
    const { result } = fetchGeojson(`${paths.geojson}/KS_Interstate_Lines.geojson`);
    validateData(result);
});

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onYearChange]: onYearChange,
    [watcherType.onInterstatesChecked]: onChecked,
};

assignWatchers(props.watchers, fnDict);

function validateData(r) {
    const d = r.data.value;
    const l = r.loading.value;
    const e = r.error.value;

    if (l) {
        const unwatch = watch(() => r.loading.value, () => { validateData(r); unwatch(); });
        return;
    }
    if (e) {
        console.error(e);
        return;
    }

    selection = gTag
        .selectAll(".interstate")
        .data(d.features, f => f.id ?? f.properties?.FID)
        .join(
            enter => enter
                .append("path")
                    // Works for LineString and MultiLineString
                    .attr("d", pathGen)
                    .attr("stroke-width", 1.2)
                    .attr("opacity", "0%")
                    .classed("interstate", true),
            update => update,
            exit => fadeOut(exit).remove()
        );

    applyVisibility(props.properties.inputValue.value);
}

function applyVisibility(currentYear) {
    if (!selection) return;

    // Checkbox off => hide all
    if (!props.filters.value) {
        fadeOut(selection);
        return;
    }

    // Checkbox on => show segments open by currentYear
    createTransition(selection)
        .attr("opacity", f => {
            const openYear = +f.properties?.year_open;
            if (!Number.isFinite(openYear)) return "0%";
            return openYear <= currentYear ? "100%" : "0%";
        });
}

function onZoom(newValue) {
    if (!selection) return;

    switch (newValue) {
        case "state":
            createTransition(selection).attr("stroke-width", 1.2);
            break;
        case "county":
            createTransition(selection).attr("stroke-width", 0.8);
            break;
    }
}

function onYearChange(newYear) {
    applyVisibility(newYear);
}

function onChecked() {
    applyVisibility(props.properties.inputValue.value);
}
</script>

<template>
    <g class="interstates" ref="g"></g>
</template>

<style scoped>
:global(.interstate) {
    fill: none;
    stroke: #1f77b4;
    pointer-events: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}
</style>
