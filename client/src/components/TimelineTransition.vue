<template>
  <g></g>
</template>
<script setup>
/**
 * components/TimelineTransition.vue
 *
 * Handles when the input slider that represents the decade is moved
 * Renders the relevant data and removes the irrelevant data, fetching
 * geojson data when necessary.
 */
import * as d3 from 'd3';
import { defineEmits, defineProps, onMounted, watch } from 'vue';

const emit = defineEmits(["changeZoom", "zoomChanged", "zoomState"]);
const props = defineProps(["svgElement", "projection", "inputValue"]);

onMounted(() => {
    const slider = d3.select("#yearSlider");
    const label = d3.select("#yearLabel");

    // Called when the input slider
    // is moved by the play button.
    watch(() => props.inputValue,
        (year) => {
            label.text(year);
            updateMap(year);
        })

    //Whenever the slider is moved, updates label and map
    slider.on("change", function() {
        const year = +this.value;
        label.text(year);
        updateMap(year);
    });
})

async function updateRailroads(year) {
    // Select all railroads and update their stroke-opacity
    // based on their InOpBy property and the given year.
    d3.select(props.svgElement.value)
        .selectAll(".rail")
            .attr("stroke-opacity", d => d.properties.InOpBy <= year ? "60%" : "0%");
}

function updateMap(year) {
    updateRailroads(year);

    const fileName = `/geojson/KSCounty_${year}_GeoJSON.geojson`;

    d3.json(fileName).then(geoData => {
        const pathGen = d3.geoPath(props.projection);

        // JOIN new data
        const paths = d3.select(props.svgElement.value).select("g.borders").selectAll(".border")
            .data(geoData.features, d => d.properties.id); // key by id if available

        // remove old paths
        paths.exit()
            .transition()
            .duration(500)
                .attr("opacity", "0%")
                .remove();

        //new paths
        paths.enter()
            .append("path")
                .attr("d", d => {
                    d.geometry.coordinates[0].reverse();
                    return pathGen(d);
                })
                .attr("opacity", "0%")
                .classed("border", true)
            .transition()
            .duration(500)
                .attr("opacity", "100%");

        // Create onClick handlers to add zoom in and out functionality
        d3.select(props.svgElement.value)
            .selectAll("g.borders > .border")
            .on("click", (eventName) => {
                const bbox = eventName.target.getBBox();
                const boxString = String(bbox.x - 10) + " " +
                                String(bbox.y - 10) + " " +
                                String(bbox.width + 20) + " " +
                                String(bbox.height + 20);
                var viewBox = d3.select(props.svgElement.value).attr("viewBox");
                //if the zoomed in county is clicked again, it zooms out, otherwise the viewBox becomes whatever county was clicked
                if (boxString == viewBox) {
                    d3.select(props.svgElement.value)
                        .transition()
                        .duration(750)
                            .attr("viewBox", "0 0 1600 800")
                        .on("end", () => {
                          emit("changeZoom", "state")
                          emit("zoomState", "zoomOut")
                        });
                }
                else {
                    d3.select(props.svgElement.value)
                        .transition()
                        .duration(750)
                            .attr("viewBox", boxString)
                        .on("end", () => {
                          emit("changeZoom", "county")
                          emit("zoomState", "zoomIn")
                        });
                    }
                });
    });
}
</script>
