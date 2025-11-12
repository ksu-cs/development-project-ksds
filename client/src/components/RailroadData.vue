<script>
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson';

export default {
    props: [ "projection", "inputValue", "zoomState"],
    data() {
        return {
            pathGen: d3.geoPath(this.projection),
            selection: null,
            gTag: null
        }
    },
    methods: {
        validateData() {
            if (this.loading) {
                const unwatch = this.$watch(() => this.loading, () => { this.validateData(); unwatch() });
            } else if (this.error) {
                console.log(this.error);
            } else {
                console.log(this.data);
                this.selection = this.gTag.selectAll("path")
                                            .data(this.data.features)
                                            .enter()
                                            .append("path");
                
                this.selection
                        .attr("d", this.pathGen)
                        .attr("stroke-opacity", d => d.properties.InOpBy <= this.inputValue ? "60%" : "0%")
                        .attr("stroke-width", 1)
                        .classed("rail", true);
            }
        },
        onZoom(newValue) {
            if (newValue === "state") {
                this.selection
                    .transition()
                    .duration(200)
                        .attr("stroke-width", 0.6);
            } else if (newValue == "county") {
                this.selection
                    .transition()
                    .duration(200)
                        .attr("stroke-width", 1);
            }
        },
        onYearChange(newValue) {
            this.selection
                .transition()
                .duration(200)
                    .attr("stroke-opacity", d => d.properties.InOpBy <= newValue ? "60%" : "0%");
        }
    },
    setup() {
        // Fetch and validate data.
        const pathString = 'railroads.geojson';
        const { data, loading, error } = fetchGeojson(pathString);

        // Expose properties.
        return { pathString, data, loading, error }
    },
    mounted() {
        this.gTag = d3.select(this.$refs.g);
        console.log(this.gTag);
        this.validateData();
        this.$watch(() => this.zoomState, this.onZoom);
        this.$watch(() => this.inputValue, this.onYearChange);
    }
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
}
</style>