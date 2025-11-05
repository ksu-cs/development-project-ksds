<script>
/**
 * components/BaseMap.vue
 *
 * Contains the base svg element that all geojson data is rendered to.
 * Calls each Data component to fetch and render geojson data.
 */
import { ref } from 'vue';
import StartupData from './StartupData.vue';
import TimelineTransition from './TimelineTransition.vue';
import * as d3 from 'd3';

export default {
    components: {
        StartupData,
        TimelineTransition
    },
    data() {
        return {
            scale: 14000,
            translation: [1150, 375]
        }
    },
    methods: {
        changeZoomLevel(new_level) {
            console.log(new_level);
            this.zoom_level.value = new_level;
        },
        centerText(d, i, n, dy) {
            const bbox = n[i].getBBox();
            const originX = d.geometry.coordinates[0];
            const originY = d.geometry.coordinates[1];
            const centeredX = originX - (bbox.width / 2);
            
            d3.select(n[i])
                    .attr("x", String(centeredX))
                    .attr("y", originY - dy);
        }
    },
    created() {
        this.projection = d3.geoAlbers().scale(this.scale).translate(this.translation)
        // Will reference the svg element in the template
        // If svg is declared in data(), it will be unwrapped
        this.svg = ref(null);
        this.zoom_level = ref("state");
    },
    mounted() {
        this.svg.value = this.$refs.svg;
        // When zoom level changes, re-render data
        // based on zoom level
        this.$watch(() => this.zoom_level.value,
                    (newValue) => {
                        const svgSelection = d3.select(this.svg.value);
                        // Projection is the identity function
                        const pathGen = d3.geoPath(null);
                        if (newValue == "county") { // Zoomed into county
                            // Shrink city points
                            svgSelection.selectAll(".city")
                                .transition()
                                .duration(500)
                                    .attr("d", pathGen.pointRadius(1));

                            // Shrink city names
                            svgSelection.selectAll(".city-name")
                                    .attr("opacity", "100%")
                                    .attr("font-size", "30%")
                                .each((d, i, n) => this.centerText(d, i, n, 3));
                            
                            // Shrink border width
                            svgSelection.selectAll(".border")
                                .transition()
                                .duration(500)
                                    .attr("stroke-width", "1");
                        }
                        else if (newValue == "state") { // Zoomed out to state
                            // Enlarge city points
                            svgSelection.selectAll(".city")
                                .transition()
                                .duration(500)
                                    .attr("d", pathGen.pointRadius(1.5));
                            
                            // Enlarge city names and filer by top ten
                            svgSelection.selectAll(".city-name")
                                    .attr("opacity", d => d.properties["Top Ten"] ? "100%" : "0%")
                                    .attr("font-size", "100%")
                                .each((d, i, n) => this.centerText(d, i, n, 5));
                            
                            // Enlarge border width
                            svgSelection.selectAll(".border")
                                .transition()
                                .duration(500)
                                    .attr("stroke-width", "2");
                        }
                    })
    }
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
            <g class="railroads"></g>
            <g class="borders"></g>
            <g class="cities">
                <g class="points"></g>
                <g class="names"></g>
            </g>
        </svg>
        <fieldset class="checkboxes">
            <legend>Filters:</legend>
            <label><input type="checkbox"> Filter 1</label>
            <label><input type="checkbox"> Filter 2</label>
            <label><input type="checkbox"> Filter 3</label>
            <label><input type="checkbox"> Filter 4</label>
        </fieldset>

        <!--Fetches and renders geojson data-->
        <StartupData :svgElement="svg" :projection="projection" @changeZoom="changeZoomLevel" />
        <TimelineTransition :svgElement="svg" :projection="projection" @changeZoom="changeZoomLevel"/>
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
