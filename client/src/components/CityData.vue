<script setup>
/**
 * components/CityData.vue
 * Responsible for all changes to the cities in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchers';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';

const props = defineProps(["properties", "watchers"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");

let selectionPoints = null;
let selectionText = null;
let selectionBoxes = null;
let gTag = null;
let townPopulations = {};
let hoverActive = true;
let paths = {
    geojson: `${props.properties.path}/geojson`,
    csv: `${props.properties.path}/csv`
}

onMounted(() => {
    gTag = d3.select(gRef.value);
    const { result } = fetchGeojson(`${paths.geojson}/KSPlace1900.geojson`);
    validateData(result);
})

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onYearChange]: handleYearChange,
};

function handleYearChange(newYear) {
    updateTownPopulationsOnYearChange(newYear);
    onChangeYear(newYear);
}

assignWatchers(props.watchers, fnDict);

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
        const unwatch = watch(() => r.loading.value, () => { validateData(r); unwatch() });
    } else if (e) {
        console.log(e);
    } else {
        gTag.select(".points").selectAll("*").remove();
        gTag.select(".text").selectAll("*").remove();
        // Create path elements for every pair of lon, lat coordinates
        selectionPoints = gTag.select(".points")
                                .selectAll(".point")
                                .data(d.features)
                                .enter()
                                .append("path")
                                    .attr("d", pathGen.pointRadius(2))
                                    .classed("point", true);
        
        selectionBoxes = gTag.select(".points")
                                .selectAll(".hitbox")
                                .data(d.features)
                                .enter()
                                .append("path")
                                    .attr("d", pathGen.pointRadius(5))
                                    .classed("hitbox", true)
        
        // Project every city's (lon, lat) pair
        // pathGen does this for us, however,
        // we can't use pathGen here
        const projectedFeatures = d.features.map(feature => {
            return {
                coordinates: props.properties.projection(feature.geometry.coordinates),
                name: feature.properties.NAME
            }
        });
        
        let textDict = { };

        selectionText = gTag.select(".text")
                                .selectAll(".name")
                                .data(projectedFeatures)
                                .enter()
                                .append("text")
                                    .attr("x", d => d.coordinates[0])
                                    .attr("y", d => d.coordinates[1])
                                    .attr("opacity", "0%")
                                    .attr("font", "italic 13px sans-serif")
                                    .property("textContent", d => d.name)
                                    .classed("name", true)
                                    .each((d, i, n) => {
                                        centerText(d, i, n, 5);
                                        textDict[d.name] = n[i]; // For quick access when setting up hover events
                                    });
        
        // Setup events to display town name on hover
        selectionBoxes.on("mouseenter", (event) => {
            let properties = event.target.__data__.properties; // Get properties from the hit box
            if (hoverActive) {
                d3.select(textDict[properties.NAME])
                    .transition()
                        .duration(200)
                        .attr("opacity", "100%");
            }
        }).on("mouseleave", (event) => {
            let properties = event.target.__data__.properties; // Get properties from the hit box
            if (hoverActive) {
                d3.select(textDict[properties.NAME])
                    .transition()
                        .duration(200)
                        .attr("opacity", "0%");
            }
        })
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

/**
 * On zoom into a county, shrinks a cities point and text,
 * and enlarges them on a zoom out to the state
 * @param state the new zoomState
 */
function onZoom(state) {
    switch (state) {
        case "state":
            selectionPoints.transition()
                    .duration(200)
                    .attr("d", pathGen.pointRadius(2));
            
            selectionText.attr("font-size", "100%")
                    .each((d, i, n) => centerText(d, i, n, 5))
                    .attr("opacity", "0%");
            
            // Display town names on hover
            hoverActive = true;
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
            
            // Don't display town names on hover
            hoverActive = false;
            break;
    }
}

/**
 * Load in and create a dictionary with the county, city name, and city population 
 * by the given year. Delete the old dictionary??
 * @param newValue The year selected
 */
//can also have the old value as an parameter if you want, otherwise just ignore
function updateTownPopulationsOnYearChange(newYear) {
    // We only have town population data starting in 1970 until 2020
    if (newYear >= 1970) {
        d3.csv("KSPopulation1970-2020ByCity.csv").then(data => {

            const col = `AV0AA${newYear}`; // build column name dynamically

            // convert population to number
            data.forEach(d => {
                d[col] = +d[col];
            });

            townPopulations = Object.fromEntries(
                data.map(d => [d.CTY_SUB, d[col]])
            );

            console.log(townPopulations);
        });
    }
}

function onChangeYear(newYear) {
    let fileName = '';
    if (newYear <= 1900)
    { 
        fileName = `${paths.geojson}/KSPlace1900.geojson`; 
    }
    else if (newYear >= 2010) 
    {
        fileName = `${paths.geojson}/KSPlace2010.geojson`;
    }
    else {
        fileName = `${paths.geojson}/KSPlace${newYear}.geojson`;
    }

    const { result } = fetchGeojson(fileName);
    validateData(result);
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

:global(.hitbox) {
    fill: black;
    opacity: 0%;
    pointer-events: visible;
}
</style>
