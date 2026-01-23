<script setup>
/**
 * components/CityData.vue
 * Responsible for all changes to the cities in BaseMap.vue
 */
import { defineProps, onMounted, useTemplateRef, watch } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson, fetchJson } from './fetchers';
import { assignWatchers } from './assignWatchers';
import { watcherType } from './watcherType';
import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection';
import { createTransition } from '@/d3/transitions/createTransition';

const props = defineProps(["properties", "watchers", "filters"]);

const pathGen = d3.geoPath(props.properties.projection);
const gRef = useTemplateRef("g");
const defaultYear = 1860;

let selectionPoints = null;
let selectionBoxes = null;
let selectionText = null;
let selectionPop = null;
let cityPops = null;
let gTag = null;
let hoverActive = true;
let zoomState = "state";
let paths = {
    geojson: `${props.properties.path}/geojson`,
    json: `${props.properties.path}/json`,
    csv: `${props.properties.path}/csv`
}

onMounted(() => {
    gTag = d3.select(gRef.value);
    const { result, promise } = fetchGeojson(`${paths.geojson}/KSPlace1900.geojson`);
    promise.then(() => {
        const pop_result = fetchJson(`${paths.json}/city-pops.json`);
        validatePopData(pop_result.result);
    })
    validateData(result);
})

const fnDict = {
    [watcherType.onZoomChange]: onZoom,
    [watcherType.onYearChange]: [
        onChangeYear,
        getTownPopByYear,
    ],
    [watcherType.onCitiesChecked]: onChecked,
};

assignWatchers(props.watchers, fnDict);

/**
 * Waits for the fetched data to load. If the fetch failed,
 * prints the error received. Populates selection by binding
 * the data to path elements.
 * @param result The object that holds the data, loading, and error properties
 */
function validateData(result) {
    let d = result.data.value;
    let l = result.loading.value;
    let e = result.error.value;

    if (l) {
        const unwatch = watch(() => result.loading.value, () => { validateData(result); unwatch() });
    } else if (e) {
        console.error(e);
    } else {
        selectionPoints = gTag
            .select(".points")
            .selectAll(".point")
            .data(d.features, (d) => d.properties.NAME)
            .join(
                enter => enter
                    .append("path")
                        .attr("opacity", "0%")
                        .classed("point", true),
                update => update,
                exit => fadeOut(exit).remove()
            )
        
        selectionBoxes = gTag
            .select(".points")
            .selectAll(".hitbox")
            .data(d.features, (d) => d.properties.NAME)
            .join(
                enter => {
                    return enter
                        .append("path")
                            .attr("d", pathGen.pointRadius(5))
                            .classed("hitbox", true);
                },
                update => update,
                exit => exit.remove()
            )
        
        // Project every city's (lon, lat) pair
        // pathGen does this for us, however,
        // we can't use pathGen here
        const projectedFeatures = d.features.map(feature => {
            return {
                coordinates: props.properties.projection(feature.geometry.coordinates),
                name: feature.properties.NAME,
                place: feature.properties.PLACE
            }
        });
        
        let textDict = { };
        let popDict = { };

        selectionText = gTag
            .select(".text")
            .selectAll(".name")
            .data(projectedFeatures, (d) => d.name)
            .join(
                enter => {
                    return enter
                        .append("text")
                            .attr("x", d => d.coordinates[0])
                            .attr("y", d => d.coordinates[1])
                            .attr("font", "italic 13px sans-serif")
                            .attr("opacity", "0%")
                            .property("textContent", d => d.name)
                            .classed("name", true)
                            .each((d, i, n) => textDict[d.name] = n[i]); // For quick access when setting up hover events.
                },
                update => update,
                exit => fadeOut(exit).remove()
            );
        
        selectionPop = gTag
            .select(".text")
            .selectAll(".pop")
            .data(projectedFeatures, (d) => d.name)
            .join(
                enter => {
                    return enter
                        .append("text")
                            .attr("x", d => d.coordinates[0])
                            .attr("y", d => d.coordinates[1])
                            .attr("font", "italic 13px sans-serif")
                            .attr("opacity", "0%")
                            .property("textContent", "---")
                            .classed("pop", true)
                            .each((d, i, n) => popDict[d.name] = n[i]);
                },
                update => update,
                exit => fadeOut(exit).remove()
            )

        // Setup events to display town name on hover
        selectionBoxes.on("mouseenter", (event) => {
            let properties = event.target.__data__.properties; // Get properties from the hit box
            if (hoverActive) {
                fadeIn(d3.select(textDict[properties.NAME]));
                fadeIn(d3.select(popDict[properties.NAME]));
            }
        }).on("mouseleave", (event) => {
            let properties = event.target.__data__.properties; // Get properties from the hit box
            if (hoverActive) {
                fadeOut(d3.select(textDict[properties.NAME]));
                fadeOut(d3.select(popDict[properties.NAME]));
            }
        })

        switch (zoomState) {
            case "state":
                selectionPoints
                        .attr("d", pathGen.pointRadius(2));
                selectionText
                        .attr("font-size", "100%")
                        .each((d, i, n) => centerText(d, i, n, 16));
                selectionPop
                        .attr("font-size", "100%")
                        .each((d, i, n) => centerText(d, i, n, 5))
                if (props.filters.value) {
                    fadeIn(selectionPoints);
                }
                break;
            case "county":
                selectionPoints
                        .attr("d", pathGen.pointRadius(1));
                selectionText
                        .attr("font-size", "30%")
                        .each((d, i, n) => centerText(d, i, n, 3));
                selectionPop
                        .attr("font-size", "30%")
                        .each((d, i, n) => centerText(d, i ,n, -5))
                if (props.filters.value) {
                    fadeIn(selectionPoints);
                    fadeIn(selectionText);
                    fadeIn(selectionPop);
                }
                break;
        }
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
    zoomState = state;
    switch (state) {
        case "state":
            createTransition(selectionPoints)
                    .attr("d", pathGen.pointRadius(2));
            selectionText
                    .attr("font-size", "100%")
                    .each((d, i, n) => centerText(d, i, n, 15))
                    .attr("opacity", "0%");
            selectionPop
                    .attr("font-size", "100%")
                    .each((d, i, n) => centerText(d, i, n, 5))
                    .attr("opacity", "0%");
            
            // Display town names on hover
            hoverActive = true;
            break;
        case "county":
            createTransition(selectionPoints)
                    .attr("d", pathGen.pointRadius(1));
            selectionText
                    .attr("font-size", "30%")
                    .each((d, i, n) => centerText(d, i, n, 3));
            selectionPop
                    .attr("font-size", "30%")
                    .each((d, i, n) => centerText(d, i, n, -5))
            
            if (props.filters.value) {
                fadeIn(selectionText);
                fadeIn(selectionPop);
            }
            
            // Don't display town names on hover
            hoverActive = false;
            break;
    }
}

function validatePopData(result) {
    let d = result.data.value;
    let l = result.loading.value;
    let e = result.error.value;

    if (l) {
        const unwatch = watch(() => result.loading.value, () => { validatePopData(result); unwatch() });
    } else if (e) {
        console.warn(e);
    } else {
        cityPops = d;
        getTownPopByYear(defaultYear)
    }
}

/**
 * Load in and create a dictionary with the county, city name, and city population 
 * by the given year. Delete the old dictionary??
 * @param newValue The year selected
 */
//can also have the old value as an parameter if you want, otherwise just ignore
function getTownPopByYear(newYear) {
    // We only have town population data starting in 1970 until 2020
    if (newYear < 1970) {
        return;
    }

    selectionPop.each((d, i, n) => {
        let node = n[i];
        let city_name = d.name;
        let city_place = d.place;

        let key = null;
        
        if (Object.hasOwn(cityPops, city_name)) {
            key = city_name;
        } else if (Object.hasOwn(cityPops, city_place)) {
            key = city_place;
        } else {
            console.warn(`'${city_name}' or '${city_place}' has no corresponding record`);
        }

        if (key != null) {
            let pop = cityPops[key][newYear];
            if (pop == null) {
                console.warn(`'${key}' has a record but no population for '${newYear}'`);
            } else {
                node.textContent = String(pop);
            }
        }
    })
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

    const { result, promise } = fetchGeojson(fileName);
    promise.then(() => getTownPopByYear(newYear));
    validateData(result);
}

function onChecked(newValue) {
    if (newValue) {
        fadeIn(selectionPoints);
        switch (zoomState) {
            case "state":
                hoverActive = true;
                break;
            case "county":
                hoverActive = false;
                fadeIn(selectionText);
                fadeIn(selectionPop);
            break;
        }
    } else {
        hoverActive = false;
        fadeOut(selectionPoints);
        switch (zoomState) {
            case "state": // Do nothing
                break;
            case "county":
                fadeOut(selectionText);
                fadeOut(selectionPop);
                break;
        }
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

:global(.pop) {
    fill: blue;
    pointer-events: none;
}

:global(.hitbox) {
    fill: black;
    opacity: 0%;
    pointer-events: visible;
}
</style>
