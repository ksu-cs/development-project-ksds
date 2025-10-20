<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/railroads.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection)

        d3.select(this.svgElement)
            .selectAll(".rail")
            .data(data.features)
            .enter()
            .append("path")
            .attr("d", pathGen)
            .attr("class", "rail")
    }
}
</script>

<style scoped>
:global(.rail) {
    fill: none;
    stroke: green;
    stroke-width: 1;
}
</style>