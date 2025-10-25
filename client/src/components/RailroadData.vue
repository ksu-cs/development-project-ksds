<script>
/**
 * components/RailroadData.vue
 *
 * Fethces and renders all railroad data.
 * components/TimelineTransition.vue should handle
 * fading in and out the relevant railroad path elements
 */
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/railroads.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection);

        // Create path elements for each railroad
        d3.select(this.svgElement)
            .append("g")
            .classed("railroads", true)
            .selectAll(".rail")
            .data(data.features)
            .enter()
            .filter(d => d.properties.InOpBy <= 1860)
            .append("path")
                .attr("d", pathGen)
                .classed("rail", true);
    }
}
</script>

<style scoped>
:global(.rail) {
    fill: none;
    stroke: green;
    stroke-width: 1;
    stroke-opacity: 50%;
    pointer-events: none;
}
</style>
