<script setup>
    import { defineProps, onMounted, useTemplateRef, defineEmits, watch, inject } from 'vue';
    import * as d3 from 'd3';
    import { fetchGeojson } from './fetchers.js';
    import { registerKey } from './RegisterKey.js';
import { MapZoomLevel } from './MapZoomLevel.js';
import { GroupType } from './GroupType.js';
import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection.js';

    const props = defineProps(["properties", "watchers"]);
    const emit = defineEmits(["school-hover"]);

    const gRef = useTemplateRef("g")
    const label = "schools";

    let gTag = null;
    let selectionPoints = null;
    let projectedSchools = [];
    let hoverActive = false;
    let paths = {
        geojson: `${props.properties.path}/geojson`,
        json: `${props.properties.path}/json`,
        csv: `${props.properties.path}/csv`
    }

    onMounted(() => {
        gTag = d3.select(gRef.value);

        const { result } = fetchGeojson(`${paths.geojson}/KSSchools.geojson`);
        validateData(result);
    });

    const hooks = inject(registerKey)(label, {
        filter: {
            legibleLabel: "Schools",
            defaultStatus: false,
            visibleStates: new Set([
                MapZoomLevel.COUNTY,
            ]),
            groups: [
                GroupType.OTHER,
            ],
            onChecked: onChecked,
            onUnchecked: onUnchecked,
        },
    })

    hooks.onZoomChange((newValue) => {
        switch (newValue) {
            case MapZoomLevel.STATE:
                hoverActive = false;
                if (selectionPoints) {
                    selectionPoints
                        .transition()
                        .duration(200)
                        .attr("opacity", "0%");
                }
                emit("school-hover", null);
                break;
            case MapZoomLevel.COUNTY:
                hoverActive = true;
                updateVisibleByBBox();
                break;
        }
    })

    hooks.onCountyTransition(() => {
        if (!hoverActive) return;
        updateVisibleByBBox();
    })

/*
    const fnDict = {
        [watcherType.onZoomChange]: onZoom,
        [watcherType.onCountyTransition]: onCountyTransition,
    }
*/

    // assignWatchers(props.watchers, fnDict);

    function validateData(result) {
        const d = result.data.value;
        const l = result.loading.value;
        const e = result.error.value;

        if (l) {
            const unwatch = watch(() => result.loading.value, () => { validateData(result); unwatch(); });
            return;
        }
        if (e) {
            console.error(e);
            return;
        }
        // console.log("KSSchools features:", d && d.features ? d.features.length : "no data");

        projectedSchools = d.features.map(f => {
            const coords = props.properties.projection(f.geometry.coordinates);
            return {
                x: coords[0],
                y: coords[1],
                props: f.properties
            };
        });

        selectionPoints = gTag
            .selectAll(".school-point")
            .data(projectedSchools)
            .join("circle")
                .attr("class", "school-point")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", .5)
                .attr("opacity", "0%")
                .on("mouseenter", (event, d) => {
                    if (!hoverActive) return;
                    const mousePos = { x: event.clientX, y: event.clientY };
                    emit("school-hover", { props: d.props, pos: mousePos });
                })
                .on("mouseleave", () => {
                    if (!hoverActive) return;
                    emit("school-hover", null);
                });
    }

/*
    function onZoom(state) {
        switch (state) {
            case "state":
                hoverActive = false;
                if (selectionPoints) {
                    selectionPoints
                        .transition()
                        .duration(200)
                        .attr("opacity", "0%");
                }
                emit("school-hover", null);
                break;

            case "county":
                hoverActive = true;
                updateVisibleByBBox();
                break;
        }
    }
*/

/*
    function onCountyTransition() {
        if (!hoverActive) return;
        updateVisibleByBBox();
    }   
*/

    function updateVisibleByBBox() {
        if (!selectionPoints || projectedSchools.length === 0) {
            return;
        }

        const bbox = props.properties.bbox;

        selectionPoints
            .transition()
            .duration(200)
            .attr("opacity", d => {
                const inside = pointInBBox(d, bbox);
                return inside ? "100%" : "0%";
            });
    }

    function pointInBBox(d, bbox) {
        return (
            d.x >= bbox.x &&
            d.x <= bbox.x + bbox.width &&
            d.y >= bbox.y &&
            d.y <= bbox.y + bbox.height
        );
    }

    function onChecked() {
        fadeIn(selectionPoints);
    }

    function onUnchecked() {
        fadeOut(selectionPoints);
    }
</script>
<template>
    <g class="schools" ref="g"></g>
</template>

<style scoped>
:global(.school-point) {
    fill: black;
    pointer-events: visible;
}
</style>